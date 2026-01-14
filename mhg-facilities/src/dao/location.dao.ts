import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationInsert = Database['public']['Tables']['locations']['Insert']
type LocationUpdate = Database['public']['Tables']['locations']['Update']

interface LocationWithStats extends Location {
  ticket_count: number
  asset_count: number
}

/**
 * Location Data Access Object
 * Provides database operations for facility locations with tenant isolation
 */
export class LocationDAO extends BaseDAO<'locations'> {
  constructor() {
    super('locations')
  }

  /**
   * Find all active locations (not soft-deleted)
   * Inherits tenant isolation from BaseDAO
   */
  async findActive(): Promise<Location[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find locations managed by a specific user
   */
  async findByManager(managerId: string): Promise<Location[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('manager_id', managerId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find locations with related statistics (ticket count, asset count)
   * Uses LEFT JOIN to include locations with zero tickets/assets
   */
  async findWithStats(): Promise<LocationWithStats[]> {
    const { supabase, tenantId } = await this.getClient()

    // Get all locations
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (locationsError) throw new Error(locationsError.message)
    if (!locations) return []

    // For each location, get ticket and asset counts
    const locationsWithStats = await Promise.all(
      locations.map(async (location: Location) => {
        // Get ticket count
        const { count: ticketCount, error: ticketError } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('location_id', location.id)
          .is('deleted_at', null)

        if (ticketError) throw new Error(ticketError.message)

        // Get asset count
        const { count: assetCount, error: assetError } = await supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .eq('location_id', location.id)
          .is('deleted_at', null)

        if (assetError) throw new Error(assetError.message)

        return {
          ...location,
          ticket_count: ticketCount ?? 0,
          asset_count: assetCount ?? 0,
        } as LocationWithStats
      })
    )

    return locationsWithStats
  }

  /**
   * Find location by ID with manager details
   */
  async findByIdWithManager(id: string): Promise<(Location & { manager?: { id: string; full_name: string; email: string } }) | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('locations')
      .select(`
        *,
        manager:users!manager_id (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return data as Location & { manager?: { id: string; full_name: string; email: string } }
  }

  /**
   * Update location's manager
   */
  async assignManager(locationId: string, managerId: string | null): Promise<Location> {
    return this.update(locationId, { manager_id: managerId })
  }

  /**
   * Create location with explicit types
   */
  async createLocation(data: Omit<LocationInsert, 'tenant_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Location> {
    return this.create(data)
  }

  /**
   * Update location with explicit types
   */
  async updateLocation(id: string, data: Partial<LocationUpdate>): Promise<Location> {
    return this.update(id, data)
  }
}
