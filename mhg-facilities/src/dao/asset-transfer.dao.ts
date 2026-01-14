import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import type { Database } from '@/types/database-extensions'
import type { SupabaseClient } from '@supabase/supabase-js'

type AssetTransfer = Database['public']['Tables']['asset_transfers']['Row']
type AssetTransferInsert = Database['public']['Tables']['asset_transfers']['Insert']

export interface AssetTransferWithRelations extends AssetTransfer {
  asset?: {
    id: string
    name: string
    serial_number: string | null
    qr_code: string | null
  } | null
  from_location?: {
    id: string
    name: string
  } | null
  to_location?: {
    id: string
    name: string
  } | null
  transferred_by_user?: {
    id: string
    full_name: string
  } | null
}

/**
 * DAO for asset_transfers table
 * Note: Asset transfers are immutable audit records (no soft delete)
 */
export class AssetTransferDAO {
  /**
   * Get tenant-scoped client
   */
  private async getClient() {
    const supabase = (await getPooledSupabaseClient()) as SupabaseClient<Database>
    const tenant = await getTenantContext()

    if (!tenant) {
      throw new Error('Tenant context required for database operations')
    }

    return { supabase, tenantId: tenant.id }
  }

  /**
   * Find all transfers for an asset
   */
  async findByAsset(assetId: string): Promise<AssetTransferWithRelations[]> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(id, name, serial_number, qr_code),
        from_location:locations!from_location_id(id, name),
        to_location:locations!to_location_id(id, name),
        transferred_by_user:users(id, full_name)
      `
      )
      .eq('asset_id', assetId)
      .order('transferred_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as AssetTransferWithRelations[]) ?? []
  }

  /**
   * Find transfers from a location
   */
  async findFromLocation(locationId: string): Promise<AssetTransferWithRelations[]> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(id, name, serial_number, qr_code),
        from_location:locations!from_location_id(id, name),
        to_location:locations!to_location_id(id, name),
        transferred_by_user:users(id, full_name)
      `
      )
      .eq('from_location_id', locationId)
      .order('transferred_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as AssetTransferWithRelations[]) ?? []
  }

  /**
   * Find transfers to a location
   */
  async findToLocation(locationId: string): Promise<AssetTransferWithRelations[]> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(id, name, serial_number, qr_code),
        from_location:locations!from_location_id(id, name),
        to_location:locations!to_location_id(id, name),
        transferred_by_user:users(id, full_name)
      `
      )
      .eq('to_location_id', locationId)
      .order('transferred_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as AssetTransferWithRelations[]) ?? []
  }

  /**
   * Find recent transfers (last N days)
   */
  async findRecent(days = 30): Promise<AssetTransferWithRelations[]> {
    const { supabase } = await this.getClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(id, name, serial_number, qr_code),
        from_location:locations!from_location_id(id, name),
        to_location:locations!to_location_id(id, name),
        transferred_by_user:users(id, full_name)
      `
      )
      .gte('transferred_at', cutoffDate.toISOString())
      .order('transferred_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as AssetTransferWithRelations[]) ?? []
  }

  /**
   * Create transfer record
   */
  async create(insertData: Partial<AssetTransferInsert>): Promise<AssetTransfer> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_transfers')
      .insert(insertData as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create transfer record')
    return data as AssetTransfer
  }

  /**
   * Get transfer by ID
   */
  async findById(id: string): Promise<AssetTransferWithRelations | null> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_transfers')
      .select(
        `
        *,
        asset:assets(id, name, serial_number, qr_code),
        from_location:locations!from_location_id(id, name),
        to_location:locations!to_location_id(id, name),
        transferred_by_user:users(id, full_name)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as AssetTransferWithRelations
  }

  /**
   * Count transfers for an asset
   */
  async countByAsset(assetId: string): Promise<number> {
    const { supabase } = await this.getClient()

    const { count, error } = await supabase
      .from('asset_transfers')
      .select('id', { count: 'exact', head: true })
      .eq('asset_id', assetId)

    if (error) throw new Error(error.message)
    return count ?? 0
  }
}
