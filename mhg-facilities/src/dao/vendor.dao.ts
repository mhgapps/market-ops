import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type Vendor = Database['public']['Tables']['vendors']['Row']
type _VendorInsert = Database['public']['Tables']['vendors']['Insert']
type _VendorUpdate = Database['public']['Tables']['vendors']['Update']

export interface VendorWithStats extends Vendor {
  average_rating?: number | null
  total_ratings?: number
  total_tickets?: number
  active_tickets?: number
}

export interface VendorFilters {
  is_active?: boolean
  is_preferred?: boolean
  service_category?: string
  insurance_expiring_days?: number
  contract_expiring_days?: number
  search?: string
  page?: number
  pageSize?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export class VendorDAO extends BaseDAO<'vendors'> {
  constructor() {
    super('vendors')
  }

  /**
   * Find all vendors with optional filters
   */
  async findWithFilters(filters?: VendorFilters): Promise<Vendor[]> {
    const { supabase, tenantId } = await this.getClient()

    let query = supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (filters) {
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.is_preferred !== undefined) {
        query = query.eq('is_preferred', filters.is_preferred)
      }
      if (filters.service_category) {
        query = query.contains('service_categories', [filters.service_category])
      }
      if (filters.insurance_expiring_days !== undefined) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + filters.insurance_expiring_days)
        query = query
          .lte('insurance_expiration', futureDate.toISOString().split('T')[0])
          .gte('insurance_expiration', new Date().toISOString().split('T')[0])
      }
      if (filters.contract_expiring_days !== undefined) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + filters.contract_expiring_days)
        query = query
          .lte('contract_expiration', futureDate.toISOString().split('T')[0])
          .gte('contract_expiration', new Date().toISOString().split('T')[0])
      }
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return (data as Vendor[]) ?? []
  }

  /**
   * Find all vendors with pagination and filters
   * Returns paginated results with total count
   */
  async findWithFiltersPaginated(filters?: VendorFilters): Promise<PaginatedResult<Vendor>> {
    const { supabase, tenantId } = await this.getClient()

    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build base query conditions for both count and data queries
    let countQuery = supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    let dataQuery = supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Apply filters to both queries
    if (filters?.is_active !== undefined) {
      countQuery = countQuery.eq('is_active', filters.is_active)
      dataQuery = dataQuery.eq('is_active', filters.is_active)
    }
    if (filters?.is_preferred !== undefined) {
      countQuery = countQuery.eq('is_preferred', filters.is_preferred)
      dataQuery = dataQuery.eq('is_preferred', filters.is_preferred)
    }
    if (filters?.service_category) {
      countQuery = countQuery.contains('service_categories', [filters.service_category])
      dataQuery = dataQuery.contains('service_categories', [filters.service_category])
    }
    if (filters?.insurance_expiring_days !== undefined) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.insurance_expiring_days)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      countQuery = countQuery
        .lte('insurance_expiration', futureDateStr)
        .gte('insurance_expiration', todayStr)
      dataQuery = dataQuery
        .lte('insurance_expiration', futureDateStr)
        .gte('insurance_expiration', todayStr)
    }
    if (filters?.contract_expiring_days !== undefined) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.contract_expiring_days)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      countQuery = countQuery
        .lte('contract_expiration', futureDateStr)
        .gte('contract_expiration', todayStr)
      dataQuery = dataQuery
        .lte('contract_expiration', futureDateStr)
        .gte('contract_expiration', todayStr)
    }
    if (filters?.search) {
      const searchPattern = `name.ilike.%${filters.search}%,contact_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      countQuery = countQuery.or(searchPattern)
      dataQuery = dataQuery.or(searchPattern)
    }

    // Apply ordering and pagination to data query
    dataQuery = dataQuery
      .order('name', { ascending: true })
      .range(from, to)

    // Execute both queries in parallel
    const [countResult, dataResult] = await Promise.all([
      countQuery,
      dataQuery,
    ])

    if (countResult.error) throw new Error(countResult.error.message)
    if (dataResult.error) throw new Error(dataResult.error.message)

    const total = countResult.count ?? 0
    const totalPages = Math.ceil(total / pageSize)

    return {
      data: (dataResult.data ?? []) as Vendor[],
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  /**
   * Find active vendors
   */
  async findActive(): Promise<Vendor[]> {
    return this.findWithFilters({ is_active: true })
  }

  /**
   * Find preferred vendors
   */
  async findPreferred(): Promise<Vendor[]> {
    return this.findWithFilters({ is_preferred: true, is_active: true })
  }

  /**
   * Find vendors by service category
   */
  async findByServiceCategory(category: string): Promise<Vendor[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .contains('service_categories', [category])
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Vendor[]) ?? []
  }

  /**
   * Find vendor by name (case-insensitive)
   */
  async findByName(name: string): Promise<Vendor | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .ilike('name', name)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as Vendor
  }

  /**
   * Find vendors with expiring insurance
   */
  async findInsuranceExpiring(daysAhead: number): Promise<Vendor[]> {
    const { supabase, tenantId } = await this.getClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .gte('insurance_expiration', today.toISOString().split('T')[0])
      .lte('insurance_expiration', futureDate.toISOString().split('T')[0])
      .order('insurance_expiration', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Vendor[]) ?? []
  }

  /**
   * Find vendors with expiring contracts
   */
  async findContractExpiring(daysAhead: number): Promise<Vendor[]> {
    const { supabase, tenantId } = await this.getClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .gte('contract_expiration', today.toISOString().split('T')[0])
      .lte('contract_expiration', futureDate.toISOString().split('T')[0])
      .order('contract_expiration', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Vendor[]) ?? []
  }

  /**
   * Search vendors by name, contact, or email
   */
  async search(query: string): Promise<Vendor[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .or(`name.ilike.%${query}%,contact_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data as Vendor[]) ?? []
  }

  /**
   * Count vendors by active status
   */
  async countByStatus(isActive: boolean): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', isActive)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Get vendor statistics
   */
  async getStats(): Promise<VendorStats> {
    const { supabase, tenantId } = await this.getClient()

    // Total count
    const { count: totalCount, error: totalError } = await supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (totalError) throw new Error(totalError.message)

    // Active count
    const activeCount = await this.countByStatus(true)

    // Preferred count
    const { count: preferredCount, error: preferredError } = await supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_preferred', true)
      .eq('is_active', true)
      .is('deleted_at', null)

    if (preferredError) throw new Error(preferredError.message)

    // Insurance expiring soon
    const insuranceExpiring = await this.findInsuranceExpiring(30)

    // Contract expiring soon
    const contractExpiring = await this.findContractExpiring(30)

    return {
      total: totalCount ?? 0,
      active: activeCount,
      inactive: (totalCount ?? 0) - activeCount,
      preferred: preferredCount ?? 0,
      insurance_expiring_30_days: insuranceExpiring.length,
      contract_expiring_30_days: contractExpiring.length,
    }
  }
}

export interface VendorStats {
  total: number
  active: number
  inactive: number
  preferred: number
  insurance_expiring_30_days: number
  contract_expiring_30_days: number
}
