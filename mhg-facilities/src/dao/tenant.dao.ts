import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import type { Tenant, TenantPlan, TenantStatus } from '@/types/database'

type TenantInsert = {
  name: string
  slug: string
  owner_email: string
  plan?: TenantPlan
  status?: TenantStatus
  trial_ends_at?: string | null
  max_users?: number
  max_locations?: number
  storage_limit_gb?: number
  features?: Record<string, unknown>
  branding?: Record<string, unknown>
}

type TenantUpdate = Partial<TenantInsert & { updated_at?: string; deleted_at?: string | null }>

// Helper type for query results
interface QueryResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

/**
 * Tenant DAO - Direct database access for tenants table
 * Note: Tenants don't filter by tenant_id (they ARE the tenant)
 */
export class TenantDAO {
  /**
   * Find tenant by ID
   */
  async findById(id: string): Promise<Tenant | null> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = (await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()) as unknown as QueryResult<Tenant>

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Find tenant by slug (subdomain)
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = (await supabase
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()) as unknown as QueryResult<Tenant>

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Find tenant by owner email
   */
  async findByEmail(email: string): Promise<Tenant | null> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = (await supabase
      .from('tenants')
      .select('*')
      .eq('owner_email', email)
      .is('deleted_at', null)
      .single()) as unknown as QueryResult<Tenant>

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Check if a slug is available
   */
  async checkSlugAvailable(slug: string): Promise<boolean> {
    const supabase = await getPooledSupabaseClient()

    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    return !data
  }

  /**
   * Create a new tenant
   */
  async create(insertData: TenantInsert): Promise<Tenant> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('tenants')
      .insert(insertData as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create tenant')

    return data as Tenant
  }

  /**
   * Update tenant
   */
  async update(id: string, updateData: TenantUpdate): Promise<Tenant> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('tenants')
      .update({ ...updateData, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Tenant not found')

    return data as Tenant
  }

  /**
   * Update tenant settings (features, branding, limits)
   */
  async updateSettings(
    id: string,
    settings: {
      features?: Record<string, boolean>
      branding?: Record<string, string | null>
      max_users?: number
      max_locations?: number
      storage_limit_gb?: number
    }
  ): Promise<Tenant> {
    const updateData: TenantUpdate = {}

    if (settings.features) {
      updateData.features = settings.features
    }
    if (settings.branding) {
      updateData.branding = settings.branding
    }
    if (settings.max_users !== undefined) {
      updateData.max_users = settings.max_users
    }
    if (settings.max_locations !== undefined) {
      updateData.max_locations = settings.max_locations
    }
    if (settings.storage_limit_gb !== undefined) {
      updateData.storage_limit_gb = settings.storage_limit_gb
    }

    return this.update(id, updateData)
  }

  /**
   * Update tenant plan
   */
  async updatePlan(id: string, plan: TenantPlan): Promise<Tenant> {
    return this.update(id, { plan })
  }

  /**
   * Update tenant status
   */
  async updateStatus(id: string, status: TenantStatus): Promise<Tenant> {
    return this.update(id, { status })
  }

  /**
   * Soft delete a tenant
   */
  async softDelete(id: string): Promise<void> {
    const supabase = await getPooledSupabaseClient()

    const { error } = await supabase
      .from('tenants')
      .update({ deleted_at: new Date().toISOString() } as never)
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  /**
   * Get tenant user count
   */
  async getUserCount(tenantId: string): Promise<number> {
    const supabase = await getPooledSupabaseClient()

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Get tenant location count
   */
  async getLocationCount(tenantId: string): Promise<number> {
    const supabase = await getPooledSupabaseClient()

    const { count, error } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }
}
