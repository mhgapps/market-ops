import { BaseDAO } from './base.dao'
import type { Database, TicketStatus, TicketPriority } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']
type TicketUpdate = Database['public']['Tables']['tickets']['Update']

export interface TicketWithRelations extends Ticket {
  category?: {
    id: string
    name: string
    name_es: string | null
  } | null
  location?: {
    id: string
    name: string
    address: string | null
  } | null
  asset?: {
    id: string
    name: string
    asset_tag: string | null
  } | null
  submitted_by_user?: {
    id: string
    full_name: string
    email: string
  } | null
  assigned_to_user?: {
    id: string
    full_name: string
    email: string
  } | null
  vendor?: {
    id: string
    company_name: string
    contact_name: string | null
  } | null
  comments_count?: number
  attachments_count?: number
}

/**
 * Ticket Data Access Object
 * Provides database operations for tickets with tenant isolation
 */
export class TicketDAO extends BaseDAO<'tickets'> {
  constructor() {
    super('tickets')
  }

  /**
   * Find tickets by status (single or multiple)
   */
  async findByStatus(status: TicketStatus | TicketStatus[]): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()
    const statuses = Array.isArray(status) ? status : [status]

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', statuses)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find tickets by location
   */
  async findByLocation(locationId: string): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find tickets assigned to a user
   */
  async findByAssignee(userId: string): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('assigned_to', userId)
      .is('deleted_at', null)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find tickets submitted by a user
   */
  async findBySubmitter(userId: string): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('submitted_by', userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find ticket with all related data
   */
  async findWithRelations(id: string): Promise<TicketWithRelations | null> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        *,
        category:ticket_categories (
          id,
          name,
          name_es
        ),
        location:locations (
          id,
          name,
          address
        ),
        asset:assets (
          id,
          name,
          asset_tag
        ),
        submitted_by_user:users!submitted_by (
          id,
          full_name,
          email
        ),
        assigned_to_user:users!assigned_to (
          id,
          full_name,
          email
        ),
        vendor:vendors (
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

    // Get counts separately
    const [commentsCount, attachmentsCount] = await Promise.all([
      this.getCommentsCount(id),
      this.getAttachmentsCount(id),
    ])

    return {
      ...(data as Record<string, unknown>),
      comments_count: commentsCount,
      attachments_count: attachmentsCount,
    } as TicketWithRelations
  }

  /**
   * Find recent tickets (default 10)
   */
  async findRecent(limit = 10): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find overdue tickets (past due_date and not closed)
   */
  async findOverdue(): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('status', 'in', '(closed,rejected)')
      .not('due_date', 'is', null)
      .lt('due_date', now)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find tickets by priority
   */
  async findByPriority(priority: TicketPriority): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('priority', priority)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Search tickets by title or description
   * Uses PostgreSQL text search (ilike)
   */
  async search(query: string): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()
    const searchPattern = `%${query}%`

    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Check for potential duplicate tickets
   * Finds tickets with similar title at same location within last 7 days
   */
  async checkDuplicate(
    locationId: string,
    assetId: string | null,
    title: string
  ): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    // Simple word-based similarity check
    const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const searchPattern = `%${titleWords.join('%')}%`

    let query = supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .ilike('title', searchPattern)
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // If asset specified, prioritize tickets for same asset
    if (assetId) {
      query = query.eq('asset_id', assetId)
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Get next ticket number for tenant
   */
  async getNextTicketNumber(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('ticket_number')
      .eq('tenant_id', tenantId)
      .order('ticket_number', { ascending: false })
      .limit(1)

    if (error) throw new Error(error.message)

    const maxNumber = (data as Array<{ ticket_number: number }> | null)?.[0]?.ticket_number ?? 0
    return maxNumber + 1
  }

  /**
   * Create ticket with explicit types
   */
  async createTicket(data: Omit<TicketInsert, 'tenant_id' | 'created_at' | 'updated_at' | 'deleted_at'>): Promise<Ticket> {
    return this.create(data)
  }

  /**
   * Update ticket with explicit types
   */
  async updateTicket(id: string, data: Partial<TicketUpdate>): Promise<Ticket> {
    return this.update(id, data)
  }

  /**
   * Helper: Get comments count for a ticket
   */
  private async getCommentsCount(ticketId: string): Promise<number> {
    const { supabase } = await this.getClient()

    const { count, error } = await supabase
      .from('ticket_comments')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Helper: Get attachments count for a ticket
   */
  private async getAttachmentsCount(ticketId: string): Promise<number> {
    const { supabase } = await this.getClient()

    const { count, error } = await supabase
      .from('ticket_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('ticket_id', ticketId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }
}
