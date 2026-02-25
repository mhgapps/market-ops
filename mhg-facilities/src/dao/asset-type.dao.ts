import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database-extensions'

type AssetType = Database['public']['Tables']['asset_types']['Row']
type AssetTypeInsert = Database['public']['Tables']['asset_types']['Insert']
type AssetTypeUpdate = Database['public']['Tables']['asset_types']['Update']

export interface AssetTypeWithCategory extends AssetType {
  category?: {
    id: string
    name: string
  } | null
}

export class AssetTypeDAO extends BaseDAO<'asset_types'> {
  constructor() {
    super('asset_types')
  }

  /**
   * Find all types with category info joined
   */
  async findWithCategory(): Promise<AssetTypeWithCategory[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_types')
      .select(
        `
        *,
        category:asset_categories(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as AssetTypeWithCategory[]) ?? []
  }

  /**
   * Find types by category_id (for cascading dropdown)
   */
  async findByCategory(categoryId: string): Promise<AssetTypeWithCategory[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_types')
      .select(
        `
        *,
        category:asset_categories(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('category_id', categoryId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as AssetTypeWithCategory[]) ?? []
  }

  /**
   * Find by name within a category (for duplicate check)
   */
  async findByNameInCategory(
    name: string,
    categoryId: string
  ): Promise<AssetTypeWithCategory | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('asset_types')
      .select(
        `
        *,
        category:asset_categories(id, name)
      `
      )
      .eq('tenant_id', tenantId)
      .eq('category_id', categoryId)
      .ilike('name', name)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }
    return data as AssetTypeWithCategory
  }

  /**
   * Create asset type (override to validate category exists)
   */
  async create(insertData: Partial<AssetTypeInsert>): Promise<AssetType> {
    if (insertData.category_id) {
      const { supabase, tenantId } = await this.getClient()

      const { data, error } = await supabase
        .from('asset_categories')
        .select('id')
        .eq('id', insertData.category_id)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        throw new Error('Category not found')
      }
    }

    return super.create(insertData) as Promise<AssetType>
  }

  /**
   * Update asset type (override to validate category exists)
   */
  async update(
    id: string,
    updateData: Partial<AssetTypeUpdate>
  ): Promise<AssetType> {
    if (updateData.category_id) {
      const { supabase, tenantId } = await this.getClient()

      const { data, error } = await supabase
        .from('asset_categories')
        .select('id')
        .eq('id', updateData.category_id)
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .single()

      if (error || !data) {
        throw new Error('Category not found')
      }
    }

    return super.update(id, updateData) as Promise<AssetType>
  }
}
