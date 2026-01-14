import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import type { Database, ApprovalStatus } from '@/types/database'

type CostApproval = Database['public']['Tables']['cost_approvals']['Row']
type CostApprovalInsert = Database['public']['Tables']['cost_approvals']['Insert']
type CostApprovalUpdate = Database['public']['Tables']['cost_approvals']['Update']

export interface CostApprovalWithRelations extends CostApproval {
  ticket?: {
    id: string
    ticket_number: number
    title: string
  } | null
  requester?: {
    id: string
    full_name: string
    email: string
  } | null
  reviewer?: {
    id: string
    full_name: string
    email: string
  } | null
}

/**
 * Cost Approval Data Access Object
 * NOTE: cost_approvals table does NOT have tenant_id or deleted_at
 * This is an audit table - records are never deleted
 */
export class CostApprovalDAO {
  /**
   * Find approval by ID with relations
   */
  async findById(id: string): Promise<CostApprovalWithRelations | null> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('cost_approvals')
      .select(`
        *,
        ticket:tickets (
          id,
          ticket_number,
          title
        ),
        requester:users!requested_by (
          id,
          full_name,
          email
        ),
        reviewer:users!reviewed_by (
          id,
          full_name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return data as CostApprovalWithRelations
  }

  /**
   * Find approvals by ticket ID
   */
  async findByTicketId(ticketId: string): Promise<CostApproval[]> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('cost_approvals')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('requested_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find pending approvals (for managers/admins)
   */
  async findPending(): Promise<CostApprovalWithRelations[]> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('cost_approvals')
      .select(`
        *,
        ticket:tickets (
          id,
          ticket_number,
          title
        ),
        requester:users!requested_by (
          id,
          full_name,
          email
        )
      `)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as CostApprovalWithRelations[]
  }

  /**
   * Find approvals by status
   */
  async findByStatus(status: ApprovalStatus): Promise<CostApproval[]> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('cost_approvals')
      .select('*')
      .eq('status', status)
      .order('requested_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Get latest approval for a ticket
   */
  async findLatestByTicketId(ticketId: string): Promise<CostApproval | null> {
    const supabase = await getPooledSupabaseClient()

    const { data, error } = await supabase
      .from('cost_approvals')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('requested_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return data as CostApproval
  }

  /**
   * Create cost approval request
   */
  async create(data: CostApprovalInsert): Promise<CostApproval> {
    const supabase = await getPooledSupabaseClient()

    // Use any-typed query to bypass strict Supabase typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('cost_approvals') as any
    const result = await query
      .insert(data)
      .select()
      .single()

    if (result.error) throw new Error(result.error.message)
    if (!result.data) throw new Error('Failed to create cost approval')

    return result.data as CostApproval
  }

  /**
   * Update cost approval
   */
  async update(id: string, data: CostApprovalUpdate): Promise<CostApproval> {
    const supabase = await getPooledSupabaseClient()

    // Use any-typed query to bypass strict Supabase typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from('cost_approvals') as any
    const result = await query
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (result.error) throw new Error(result.error.message)
    if (!result.data) throw new Error('Approval not found or update failed')

    return result.data as CostApproval
  }

  /**
   * Count pending approvals
   */
  async countPending(): Promise<number> {
    const supabase = await getPooledSupabaseClient()

    const { count, error } = await supabase
      .from('cost_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (error) throw new Error(error.message)
    return count ?? 0
  }
}
