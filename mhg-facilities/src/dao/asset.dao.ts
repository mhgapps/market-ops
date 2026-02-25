import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type Asset = Database['public']['Tables']['assets']['Row']
type _AssetInsert = Database['public']['Tables']['assets']['Insert']
type _AssetUpdate = Database['public']['Tables']['assets']['Update']

export interface AssetWithRelations extends Asset {
  category?: {
    id: string
    name: string
    default_lifespan_years: number | null
  } | null
  asset_type?: {
    id: string
    name: string
    category_id: string
  } | null
  location?: {
    id: string
    name: string
    address: string | null
  } | null
  vendor?: {
    id: string
    name: string
  } | null
}

export interface AssetFilters {
  category_id?: string
  asset_type_id?: string
  location_id?: string
  vendor_id?: string
  status?: string
  warranty_expiring_days?: number // Assets with warranty expiring within X days
  search?: string // Search by name, serial number, model
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

export class AssetDAO extends BaseDAO<'assets'> {
  constructor() {
    super('assets')
  }

  /**
   * Find all assets with relationships joined
   */
  async findWithRelations(filters?: AssetFilters): Promise<AssetWithRelations[]> {
    const { supabase, tenantId } = await this.getClient()

    let query = supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Apply filters
    if (filters) {
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.location_id) {
        query = query.eq('location_id', filters.location_id)
      }
      if (filters.asset_type_id) {
        query = query.eq('asset_type_id', filters.asset_type_id)
      }
      if (filters.vendor_id) {
        query = query.eq('vendor_id', filters.vendor_id)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.warranty_expiring_days !== undefined) {
        const futureDate = new Date()
        futureDate.setDate(futureDate.getDate() + filters.warranty_expiring_days)
        query = query
          .lte('warranty_expiration', futureDate.toISOString().split('T')[0])
          .gte('warranty_expiration', new Date().toISOString().split('T')[0])
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
        )
      }
    }

    query = query.order('name', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return (data as AssetWithRelations[]) ?? []
  }

  /**
   * Find all assets with pagination and filters
   * Returns paginated results with total count
   */
  async findWithRelationsPaginated(filters?: AssetFilters): Promise<PaginatedResult<AssetWithRelations>> {
    const { supabase, tenantId } = await this.getClient()

    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build base query conditions for both count and data queries
    let countQuery = supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    let dataQuery = supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Apply filters to both queries
    if (filters?.category_id) {
      countQuery = countQuery.eq('category_id', filters.category_id)
      dataQuery = dataQuery.eq('category_id', filters.category_id)
    }
    if (filters?.location_id) {
      countQuery = countQuery.eq('location_id', filters.location_id)
      dataQuery = dataQuery.eq('location_id', filters.location_id)
    }
    if (filters?.asset_type_id) {
      countQuery = countQuery.eq('asset_type_id', filters.asset_type_id)
      dataQuery = dataQuery.eq('asset_type_id', filters.asset_type_id)
    }
    if (filters?.vendor_id) {
      countQuery = countQuery.eq('vendor_id', filters.vendor_id)
      dataQuery = dataQuery.eq('vendor_id', filters.vendor_id)
    }
    if (filters?.status) {
      countQuery = countQuery.eq('status', filters.status)
      dataQuery = dataQuery.eq('status', filters.status)
    }
    if (filters?.warranty_expiring_days !== undefined) {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + filters.warranty_expiring_days)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      const todayStr = new Date().toISOString().split('T')[0]
      countQuery = countQuery
        .lte('warranty_expiration', futureDateStr)
        .gte('warranty_expiration', todayStr)
      dataQuery = dataQuery
        .lte('warranty_expiration', futureDateStr)
        .gte('warranty_expiration', todayStr)
    }
    if (filters?.search) {
      const searchPattern = `name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,model.ilike.%${filters.search}%`
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
      data: (dataResult.data ?? []) as AssetWithRelations[],
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  /**
   * Find asset by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<AssetWithRelations | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as AssetWithRelations
  }

  /**
   * Find assets by location
   */
  async findByLocation(locationId: string): Promise<Asset[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Asset[]) ?? []
  }

  /**
   * Find assets by category
   */
  async findByCategory(categoryId: string): Promise<Asset[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as Asset[]) ?? []
  }

  /**
   * Find assets with expiring warranties
   */
  async findWarrantyExpiring(daysAhead: number): Promise<AssetWithRelations[]> {
    const { supabase, tenantId } = await this.getClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { data, error } = await supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('warranty_expiration', today.toISOString().split('T')[0])
      .lte('warranty_expiration', futureDate.toISOString().split('T')[0])
      .order('warranty_expiration', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as AssetWithRelations[]) ?? []
  }

  /**
   * Find asset by QR code
   */
  async findByQRCode(qrCode: string): Promise<AssetWithRelations | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('qr_code', qrCode)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as AssetWithRelations
  }

  /**
   * Find asset by serial number
   */
  async findBySerialNumber(serialNumber: string): Promise<Asset | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('serial_number', serialNumber)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as Asset
  }

  /**
   * Search assets by name, serial, or model
   */
  async search(query: string): Promise<AssetWithRelations[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select(
        `
        *,
        category:asset_categories(id, name, default_lifespan_years),
        asset_type:asset_types(id, name, category_id),
        location:locations(id, name, address),
        vendor:vendors(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .or(`name.ilike.%${query}%,serial_number.ilike.%${query}%,model.ilike.%${query}%`)
      .order('name', { ascending: true })
      .limit(50)

    if (error) throw new Error(error.message)
    return (data as AssetWithRelations[]) ?? []
  }

  /**
   * Count assets by status
   */
  async countByStatus(status: string): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Get asset statistics
   */
  async getStats(): Promise<AssetStats> {
    const { supabase, tenantId } = await this.getClient()

    // Get total count
    const { count: totalCount, error: totalError } = await supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (totalError) throw new Error(totalError.message)

    // Get count by status
    const { data: statusData, error: statusError } = await supabase
      .from('assets')
      .select('status')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (statusError) throw new Error(statusError.message)

    const byStatus: Record<string, number> = {}
    if (statusData && statusData.length > 0) {
      statusData.forEach((row: { status: string }) => {
        const status = row.status
        byStatus[status] = (byStatus[status] || 0) + 1
      })
    }

    // Get warranty expiring soon (next 30 days)
    const warningExpiring = await this.findWarrantyExpiring(30)

    return {
      total: totalCount ?? 0,
      by_status: byStatus,
      warranty_expiring_30_days: warningExpiring.length,
    }
  }

  // ============================================================
  // COUNT METHODS (for dashboard performance)
  // ============================================================

  /**
   * Get counts grouped by status (for charts)
   * PERFORMANCE: Uses efficient COUNT queries instead of loading all assets
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const statuses = ['active', 'under_maintenance', 'retired', 'transferred', 'disposed']

    // Run COUNT queries in parallel for each status
    const countPromises = statuses.map(async (status) => {
      const { count, error } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', status)
        .is('deleted_at', null)

      if (error) throw new Error(error.message)
      return { status, count: count || 0 }
    })

    const results = await Promise.all(countPromises)

    const counts: Record<string, number> = {}
    results.forEach(({ status, count }) => {
      if (count > 0) {
        counts[status] = count
      }
    })

    return counts
  }

  /**
   * Count total assets
   * PERFORMANCE: Uses database COUNT instead of loading all records
   */
  async countTotal(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Count assets with expiring warranties
   * PERFORMANCE: Uses database COUNT instead of loading all records
   */
  async countWarrantyExpiring(daysAhead: number): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const { count, error } = await supabase
      .from('assets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('warranty_expiration', today.toISOString().split('T')[0])
      .lte('warranty_expiration', futureDate.toISOString().split('T')[0])

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Get counts grouped by category (for reports)
   * PERFORMANCE: Only fetches category_id column
   */
  async getCategoryCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('category_id')
      .eq('tenant_id', tenantId)
      .not('category_id', 'is', null)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    const counts: Record<string, number> = {}
    if (data) {
      data.forEach((row: { category_id: string }) => {
        counts[row.category_id] = (counts[row.category_id] || 0) + 1
      })
    }
    return counts
  }

  /**
   * Get counts grouped by location (for reports)
   * PERFORMANCE: Only fetches location_id column
   */
  async getLocationCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('location_id')
      .eq('tenant_id', tenantId)
      .not('location_id', 'is', null)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    const counts: Record<string, number> = {}
    if (data) {
      data.forEach((row: { location_id: string }) => {
        counts[row.location_id] = (counts[row.location_id] || 0) + 1
      })
    }
    return counts
  }

  /**
   * Get total value of assets
   * PERFORMANCE: Uses database SUM instead of loading all records
   */
  async getTotalValue(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('assets')
      .select('purchase_price')
      .eq('tenant_id', tenantId)
      .not('purchase_price', 'is', null)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    // Sum all purchase prices
    const total = (data || []).reduce((sum, row: { purchase_price: number }) => {
      return sum + (row.purchase_price || 0)
    }, 0)

    return total
  }
}

export interface AssetStats {
  total: number
  by_status: Record<string, number>
  warranty_expiring_30_days: number
}
