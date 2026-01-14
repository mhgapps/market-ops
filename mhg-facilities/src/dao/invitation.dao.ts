import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database-extensions'

type TenantInvitation = Database['public']['Tables']['tenant_invitations']['Row']
type TenantInvitationInsert = Database['public']['Tables']['tenant_invitations']['Insert']
type TenantInvitationUpdate = Database['public']['Tables']['tenant_invitations']['Update']

export class InvitationDAO extends BaseDAO<'tenant_invitations'> {
  constructor() {
    super('tenant_invitations')
  }

  /**
   * Find invitation by token (including expired)
   */
  async findByToken(token: string): Promise<TenantInvitation | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find invitation by token: ${error.message}`)
    }

    return data
  }

  /**
   * Find all pending invitations (not accepted, not expired)
   */
  async findPending(): Promise<TenantInvitation[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .is('accepted_at', null)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find pending invitations: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find invitation by email
   */
  async findByEmail(email: string): Promise<TenantInvitation | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', email.toLowerCase())
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find invitation by email: ${error.message}`)
    }

    return data
  }

  /**
   * Mark invitation as accepted
   */
  async markAccepted(id: string): Promise<TenantInvitation> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark invitation as accepted: ${error.message}`)
    }

    return data
  }
}
