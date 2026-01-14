import { TenantDAO } from '@/dao/tenant.dao'
import type { Tenant, TenantPlan } from '@/types/database'
import type { TenantBranding } from '@/types'

interface CreateTenantInput {
  name: string
  ownerEmail: string
  plan?: TenantPlan
}

/**
 * Tenant Service - Business logic for tenant operations
 */
export class TenantService {
  constructor(private tenantDAO = new TenantDAO()) {}

  /**
   * Generate a URL-friendly slug from a name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }

  /**
   * Create a new tenant with unique slug
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const { name, ownerEmail, plan = 'free' } = input

    // Generate unique slug
    const baseSlug = this.generateSlug(name)
    let slug = baseSlug
    let suffix = 0

    while (!(await this.tenantDAO.checkSlugAvailable(slug))) {
      suffix++
      slug = `${baseSlug}-${suffix}`
    }

    // Create tenant with default settings
    const tenant = await this.tenantDAO.create({
      name,
      slug,
      owner_email: ownerEmail,
      plan,
      status: plan === 'free' ? 'trial' : 'active',
      trial_ends_at:
        plan === 'free'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : null,
      max_users: this.getPlanLimits(plan).maxUsers,
      max_locations: this.getPlanLimits(plan).maxLocations,
      storage_limit_gb: this.getPlanLimits(plan).storageGb,
      features: this.getPlanFeatures(plan),
      branding: {
        primary_color: '#3B82F6',
        secondary_color: '#1E40AF',
        logo_url: null,
        favicon_url: null,
      },
    })

    return tenant
  }

  /**
   * Get tenant by slug
   */
  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantDAO.findBySlug(slug)
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(id: string): Promise<Tenant | null> {
    return this.tenantDAO.findById(id)
  }

  /**
   * Update tenant branding
   */
  async updateTenantBranding(tenantId: string, branding: Partial<TenantBranding>): Promise<Tenant> {
    const tenant = await this.tenantDAO.findById(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const currentBranding = (tenant.branding as unknown as TenantBranding) ?? {}
    const updatedBranding = {
      ...currentBranding,
      ...branding,
    }

    return this.tenantDAO.updateSettings(tenantId, { branding: updatedBranding })
  }

  /**
   * Check if tenant is within resource limits
   */
  async isWithinLimits(
    tenantId: string,
    resource: 'users' | 'locations'
  ): Promise<boolean> {
    const tenant = await this.tenantDAO.findById(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    if (resource === 'users') {
      const userCount = await this.tenantDAO.getUserCount(tenantId)
      return userCount < tenant.max_users
    }

    if (resource === 'locations') {
      const locationCount = await this.tenantDAO.getLocationCount(tenantId)
      return locationCount < tenant.max_locations
    }

    return true
  }

  /**
   * Get remaining resource capacity
   */
  async getRemainingCapacity(
    tenantId: string
  ): Promise<{ users: number; locations: number }> {
    const tenant = await this.tenantDAO.findById(tenantId)
    if (!tenant) {
      throw new Error('Tenant not found')
    }

    const [userCount, locationCount] = await Promise.all([
      this.tenantDAO.getUserCount(tenantId),
      this.tenantDAO.getLocationCount(tenantId),
    ])

    return {
      users: Math.max(0, tenant.max_users - userCount),
      locations: Math.max(0, tenant.max_locations - locationCount),
    }
  }

  /**
   * Check if tenant trial has expired
   */
  isTrialExpired(tenant: Tenant): boolean {
    if (tenant.status !== 'trial' || !tenant.trial_ends_at) {
      return false
    }
    return new Date(tenant.trial_ends_at) < new Date()
  }

  /**
   * Get plan limits
   */
  private getPlanLimits(plan: TenantPlan): {
    maxUsers: number
    maxLocations: number
    storageGb: number
  } {
    switch (plan) {
      case 'free':
        return { maxUsers: 5, maxLocations: 3, storageGb: 5 }
      case 'starter':
        return { maxUsers: 15, maxLocations: 10, storageGb: 25 }
      case 'professional':
        return { maxUsers: 50, maxLocations: 50, storageGb: 100 }
      case 'enterprise':
        return { maxUsers: 500, maxLocations: 500, storageGb: 500 }
      default:
        return { maxUsers: 5, maxLocations: 3, storageGb: 5 }
    }
  }

  /**
   * Get plan features
   */
  private getPlanFeatures(plan: TenantPlan): Record<string, boolean> {
    const baseFeatures = {
      compliance_tracking: true,
      preventive_maintenance: true,
      vendor_portal: false,
      budget_tracking: false,
      emergency_module: false,
      api_access: false,
      sso: false,
      custom_domain: false,
    }

    switch (plan) {
      case 'free':
        return baseFeatures
      case 'starter':
        return {
          ...baseFeatures,
          vendor_portal: true,
          budget_tracking: true,
        }
      case 'professional':
        return {
          ...baseFeatures,
          vendor_portal: true,
          budget_tracking: true,
          emergency_module: true,
          api_access: true,
        }
      case 'enterprise':
        return {
          compliance_tracking: true,
          preventive_maintenance: true,
          vendor_portal: true,
          budget_tracking: true,
          emergency_module: true,
          api_access: true,
          sso: true,
          custom_domain: true,
        }
      default:
        return baseFeatures
    }
  }
}
