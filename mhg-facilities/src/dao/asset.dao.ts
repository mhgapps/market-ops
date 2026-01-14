import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type Asset = Database['public']['Tables']['assets']['Row']
type AssetInsert = Database['public']['Tables']['assets']['Insert']
type AssetUpdate = Database['public']['Tables']['assets']['Update']

export interface AssetWithRelations extends Asset {
  category?: {
    id: string
    name: string
    default_lifespan_years: number | null
  } | null
  location?: {
    id: string
    name: string
    address: string | null
  } | null
  vendor?: {
    id: string
    vendor_name: string
  } | null
}

export interface AssetFilters {
  category_id?: string
  location_id?: string
  vendor_id?: string
  status?: string
  warranty_expiring_days?: number // Assets with warranty expiring within X days
  search?: string // Search by name, serial number, model
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
        location:locations(id, name, address),
        vendor:vendors(id, vendor_name)
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
        location:locations(id, name, address),
        vendor:vendors(id, vendor_name)
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
        location:locations(id, name, address),
        vendor:vendors(id, vendor_name)
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
        location:locations(id, name, address),
        vendor:vendors(id, vendor_name)
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
        location:locations(id, name, address),
        vendor:vendors(id, vendor_name)
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
}

export interface AssetStats {
  total: number
  by_status: Record<string, number>
  warranty_expiring_30_days: number
}
