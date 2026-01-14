import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import type { Database } from '@/types/database-extensions'
import type { SupabaseClient } from '@supabase/supabase-js'

type TableName = keyof Database['public']['Tables']

// Helper type for query results
interface QueryResult<T> {
  data: T | null
  error: { message: string; code?: string } | null
}

interface CountResult {
  count: number | null
  error: { message: string; code?: string } | null
}

/**
 * Base DAO with tenant isolation and soft delete support
 * CRITICAL: All queries MUST filter by tenant_id
 * CRITICAL: Only soft deletes allowed (deleted_at column)
 *
 * Note: We use `as unknown as X` pattern for Supabase generic queries.
 * This is necessary because Supabase's type system doesn't work well
 * with generic table names. Type safety is maintained at the concrete
 * DAO implementation level.
 */
export abstract class BaseDAO<T extends TableName> {
  constructor(protected tableName: T) {}

  // Get tenant-scoped client
  protected async getClient(): Promise<{
    supabase: SupabaseClient<Database>
    tenantId: string
  }> {
    const supabase = await getPooledSupabaseClient()
    const tenant = await getTenantContext()

    if (!tenant) {
      throw new Error('Tenant context required for database operations')
    }

    return { supabase, tenantId: tenant.id }
  }

  // Find all records for current tenant
  async findAll(): Promise<Database['public']['Tables'][T]['Row'][]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = (await supabase
      .from(this.tableName as string)
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })) as unknown as QueryResult<
      Database['public']['Tables'][T]['Row'][]
    >

    if (error) throw new Error(error.message)
    return data ?? []
  }

  // Find by ID with tenant isolation
  async findById(id: string): Promise<Database['public']['Tables'][T]['Row'] | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = (await supabase
      .from(this.tableName as string)
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()) as unknown as QueryResult<Database['public']['Tables'][T]['Row']>

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }
    return data
  }

  // Create with automatic tenant_id
  async create(
    insertData: Partial<Database['public']['Tables'][T]['Insert']>
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const { supabase, tenantId } = await this.getClient()

    // Use any-typed query builder to bypass Supabase's strict generic typing
    // Type safety is maintained at concrete DAO implementation level
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from(this.tableName as string) as any
    const result = await query
      .insert({ ...insertData, tenant_id: tenantId })
      .select()
      .single()

    if (result.error) throw new Error(result.error.message)
    if (!result.data) throw new Error('Failed to create record')
    return result.data as Database['public']['Tables'][T]['Row']
  }

  // Update with tenant isolation
  async update(
    id: string,
    updateData: Partial<Database['public']['Tables'][T]['Update']>
  ): Promise<Database['public']['Tables'][T]['Row']> {
    const { supabase, tenantId } = await this.getClient()

    // Use any-typed query builder to bypass Supabase's strict generic typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from(this.tableName as string) as any
    const result = await query
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (result.error) throw new Error(result.error.message)
    if (!result.data) throw new Error('Record not found or update failed')
    return result.data as Database['public']['Tables'][T]['Row']
  }

  // CRITICAL: Soft delete only - NEVER use hard delete
  async softDelete(id: string): Promise<void> {
    const { supabase, tenantId } = await this.getClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from(this.tableName as string) as any
    const result = await query
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (result.error) throw new Error(result.error.message)
  }

  // Check if record exists
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id)
    return record !== null
  }

  // Count records for current tenant
  async count(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const result = (await supabase
      .from(this.tableName as string)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)) as unknown as CountResult

    if (result.error) throw new Error(result.error.message)
    return result.count ?? 0
  }
}
