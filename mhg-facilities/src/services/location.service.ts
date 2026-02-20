import { LocationDAO } from '@/dao/location.dao'
import { UserDAO } from '@/dao/user.dao'
import { TenantDAO } from '@/dao/tenant.dao'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationStatus = Database['public']['Enums']['location_status']

interface CreateLocationInput {
  name: string
  address?: string
  city?: string
  state?: string
  zip?: string
  phone?: string
  square_footage?: number
  manager_id?: string
  emergency_contact_phone?: string
  status?: LocationStatus
  opened_date?: string
}

interface UpdateLocationInput {
  name?: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  phone?: string | null
  square_footage?: number | null
  manager_id?: string | null
  emergency_contact_phone?: string | null
  status?: LocationStatus
  opened_date?: string | null
  closed_date?: string | null
}

interface LocationStats {
  ticket_count: number
  asset_count: number
  open_tickets: number
  high_priority_tickets: number
  total_assets: number
  critical_assets: number
}

/**
 * Location Service - Business logic for location management
 * Handles tenant limits, manager assignment, and location lifecycle
 */
export class LocationService {
  constructor(
    private locationDAO = new LocationDAO(),
    private userDAO = new UserDAO(),
    private tenantDAO = new TenantDAO()
  ) {}

  /**
   * Get all locations for the current tenant
   */
  async getAllLocations(): Promise<Location[]> {
    return this.locationDAO.findAll()
  }

  /**
   * Get only active locations
   */
  async getActiveLocations(): Promise<Location[]> {
    return this.locationDAO.findActive()
  }

  /**
   * Get location by ID
   */
  async getLocationById(id: string): Promise<Location | null> {
    return this.locationDAO.findById(id)
  }

  /**
   * Get location with manager details
   */
  async getLocationWithManager(id: string) {
    return this.locationDAO.findByIdWithManager(id)
  }

  /**
   * Get locations managed by a specific user
   */
  async getLocationsByManager(managerId: string): Promise<Location[]> {
    return this.locationDAO.findByManager(managerId)
  }

  /**
   * Get locations with statistics
   */
  async getLocationsWithStats() {
    return this.locationDAO.findWithStats()
  }

  /**
   * Create a new location
   * Checks tenant limits before creating
   */
  async createLocation(data: CreateLocationInput): Promise<Location> {
    // Check tenant limits
    const withinLimit = await this.checkWithinTenantLimit()
    if (!withinLimit) {
      throw new Error('Location limit reached for your plan. Please upgrade to add more locations.')
    }

    // Validate manager if provided
    if (data.manager_id) {
      const manager = await this.userDAO.findById(data.manager_id)
      if (!manager) {
        throw new Error('Manager not found')
      }
      // Check if manager has appropriate role
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        throw new Error('User must be a manager or admin to be assigned as location manager')
      }
    }

    return this.locationDAO.createLocation({
      name: data.name,
      address: data.address ?? null,
      city: data.city ?? null,
      state: data.state ?? null,
      zip: data.zip ?? null,
      phone: data.phone ?? null,
      square_footage: data.square_footage ?? null,
      manager_id: data.manager_id ?? null,
      emergency_contact_phone: data.emergency_contact_phone ?? null,
      status: data.status ?? 'active',
      opened_date: data.opened_date ?? null,
      closed_date: null,
    })
  }

  /**
   * Update an existing location
   */
  async updateLocation(id: string, data: UpdateLocationInput): Promise<Location> {
    // Verify location exists
    const existing = await this.locationDAO.findById(id)
    if (!existing) {
      throw new Error('Location not found')
    }

    // Validate manager if provided
    if (data.manager_id !== undefined) {
      if (data.manager_id !== null) {
        const manager = await this.userDAO.findById(data.manager_id)
        if (!manager) {
          throw new Error('Manager not found')
        }
        if (manager.role !== 'manager' && manager.role !== 'admin') {
          throw new Error('User must be a manager or admin to be assigned as location manager')
        }
      }
    }

    // If status is being changed to closed, set closed_date
    const updateData: UpdateLocationInput = { ...data }
    if (data.status === 'permanently_closed' && !data.closed_date) {
      updateData.closed_date = new Date().toISOString().split('T')[0]
    }

    return this.locationDAO.updateLocation(id, updateData)
  }

  /**
   * Soft delete a location
   * CRITICAL: Never hard delete - use soft delete only
   */
  async deleteLocation(id: string): Promise<void> {
    // Verify location exists
    const existing = await this.locationDAO.findById(id)
    if (!existing) {
      throw new Error('Location not found')
    }

    // Check if location has active tickets or assets
    // This is a business rule - you may want to prevent deletion if there are active dependencies
    const stats = await this.getLocationStats(id)
    if (stats.open_tickets > 0) {
      throw new Error('Cannot delete location with open tickets. Close all tickets first.')
    }

    await this.locationDAO.softDelete(id)
  }

  /**
   * Assign or change location manager
   */
  async assignManager(locationId: string, managerId: string | null): Promise<Location> {
    // Verify location exists
    const location = await this.locationDAO.findById(locationId)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate manager if provided
    if (managerId !== null) {
      const manager = await this.userDAO.findById(managerId)
      if (!manager) {
        throw new Error('Manager not found')
      }
      if (manager.role !== 'manager' && manager.role !== 'admin') {
        throw new Error('User must be a manager or admin to be assigned as location manager')
      }
    }

    return this.locationDAO.assignManager(locationId, managerId)
  }

  /**
   * Get location statistics
   */
  async getLocationStats(locationId: string): Promise<LocationStats> {
    const [ticketStats, assetStats] = await Promise.all([
      this.locationDAO.getTicketStats(locationId),
      this.locationDAO.getAssetStats(locationId),
    ])

    return {
      ticket_count: ticketStats.totalTickets,
      open_tickets: ticketStats.openTickets,
      high_priority_tickets: ticketStats.highPriorityTickets,
      asset_count: assetStats.totalAssets,
      total_assets: assetStats.totalAssets,
      critical_assets: assetStats.criticalAssets,
    }
  }

  /**
   * Check if tenant is within location limit
   */
  async checkWithinTenantLimit(): Promise<boolean> {
    const tenantId = await this.locationDAO.getTenantId()
    const tenant = await this.tenantDAO.findById(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const currentCount = await this.locationDAO.count()
    return currentCount < tenant.max_locations
  }

  /**
   * Get remaining location slots for tenant
   */
  async getRemainingLocationSlots(): Promise<number> {
    const tenantId = await this.locationDAO.getTenantId()
    const tenant = await this.tenantDAO.findById(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const currentCount = await this.locationDAO.count()
    return Math.max(0, tenant.max_locations - currentCount)
  }
}
