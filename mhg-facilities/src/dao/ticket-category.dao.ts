import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type TicketCategory = Database['public']['Tables']['ticket_categories']['Row']
type TicketCategoryInsert = Database['public']['Tables']['ticket_categories']['Insert']
type TicketCategoryUpdate = Database['public']['Tables']['ticket_categories']['Update']

interface TicketCategoryWithDefaults extends TicketCategory {
  default_assignee?: {
    id: string
    full_name: string
    email: string
  } | null
  preferred_vendor?: {
    id: string
    company_name: string
    contact_name: string
  } | null
}

/**
 * Ticket Category Data Access Object
 * Provides database operations for ticket categories with tenant isolation
 */
export class TicketCategoryDAO extends BaseDAO<'ticket_categories'> {
  constructor() {
    super('ticket_categories')
  }

  /**
   * Find all categories with default assignee and preferred vendor details
   */
  async findWithDefaults(): Promise<TicketCategoryWithDefaults[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('ticket_categories')
      .select(`
        *,
        default_assignee:users!default_assignee_id (
          id,
          full_name,
          email
        ),
        preferred_vendor:vendors!preferred_vendor_id (
          id,
          company_name,
          contact_name
        )
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as TicketCategoryWithDefaults[]
  }

  /**
   * Find category by ID with defaults
   */
  async findByIdWithDefaults(id: string): Promise<TicketCategoryWithDefaults | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('ticket_categories')
      .select(`
        *,
        default_assignee:users!default_assignee_id (
          id,
          full_name,
          email
        ),
        preferred_vendor:vendors!preferred_vendor_id (
          id,
          company_name,
          contact_name
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }

    return data as TicketCategoryWithDefaults
  }

  /**
   * Find categories that require approval above threshold
   */
  async findWithApprovalThreshold(): Promise<TicketCategory[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('approval_threshold', 'is', null)
      .is('deleted_at', null)
      .order('approval_threshold', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find categories by priority level
   */
  async findByPriority(priority: Database['public']['Tables']['ticket_categories']['Row']['default_priority']): Promise<TicketCategory[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('ticket_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('default_priority', priority)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Create category with explicit types
   */
  async createCategory(data: Omit<TicketCategoryInsert, 'tenant_id' | 'created_at' | 'deleted_at'>): Promise<TicketCategory> {
    return this.create(data)
  }

  /**
   * Update category with explicit types
   */
  async updateCategory(id: string, data: Partial<TicketCategoryUpdate>): Promise<TicketCategory> {
    return this.update(id, data)
  }
}
