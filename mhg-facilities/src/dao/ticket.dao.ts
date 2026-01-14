import { BaseDAO } from './base.dao'
import type { Database, TicketStatus, TicketPriority } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']
type TicketInsert = Database['public']['Tables']['tickets']['Insert']
type TicketUpdate = Database['public']['Tables']['tickets']['Update']

export interface TicketFilters {
  status?: TicketStatus[]
  priority?: TicketPriority[]
  location_id?: string
  assigned_to?: string
  submitted_by?: string
  date_from?: string
  date_to?: string
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
    name: string
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
   * Find all tickets with optional filters applied at the database level
   * PERFORMANCE: All filtering happens in the database, not in memory
   * @param filters Optional filters for status, priority, location, assignee, etc.
   * @param limit Maximum number of records to return (default: 100)
   */
  async findAllWithFilters(filters?: TicketFilters, limit = 100): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()

    // Start building the query with tenant isolation and soft delete filter
    let query = supabase
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Apply status filter
    if (filters?.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    // Apply priority filter
    if (filters?.priority && filters.priority.length > 0) {
      query = query.in('priority', filters.priority)
    }

    // Apply location filter
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id)
    }

    // Apply assignee filter
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to)
    }

    // Apply submitter filter
    if (filters?.submitted_by) {
      query = query.eq('submitted_by', filters.submitted_by)
    }

    // Apply date range filters
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to)
    }

    // Apply search filter (searches title and description)
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`
      query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
    }

    // Apply ordering and limit
    query = query
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data, error } = await query

    if (error) throw new Error(error.message)
    return data ?? []
  }

  /**
   * Find all tickets with pagination and filters
   * Returns paginated results with total count
   */
  async findAllWithFiltersPaginated(filters?: TicketFilters): Promise<PaginatedResult<TicketWithRelations>> {
    const { supabase, tenantId } = await this.getClient()

    const page = filters?.page ?? 1
    const pageSize = filters?.pageSize ?? 50
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build base query conditions for both count and data queries
    let countQuery = supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    let dataQuery = supabase
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
        assignee:users!assigned_to (
          id,
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    // Apply status filter
    if (filters?.status && filters.status.length > 0) {
      countQuery = countQuery.in('status', filters.status)
      dataQuery = dataQuery.in('status', filters.status)
    }

    // Apply priority filter
    if (filters?.priority && filters.priority.length > 0) {
      countQuery = countQuery.in('priority', filters.priority)
      dataQuery = dataQuery.in('priority', filters.priority)
    }

    // Apply location filter
    if (filters?.location_id) {
      countQuery = countQuery.eq('location_id', filters.location_id)
      dataQuery = dataQuery.eq('location_id', filters.location_id)
    }

    // Apply assignee filter
    if (filters?.assigned_to) {
      countQuery = countQuery.eq('assigned_to', filters.assigned_to)
      dataQuery = dataQuery.eq('assigned_to', filters.assigned_to)
    }

    // Apply submitter filter
    if (filters?.submitted_by) {
      countQuery = countQuery.eq('submitted_by', filters.submitted_by)
      dataQuery = dataQuery.eq('submitted_by', filters.submitted_by)
    }

    // Apply date range filters
    if (filters?.date_from) {
      countQuery = countQuery.gte('created_at', filters.date_from)
      dataQuery = dataQuery.gte('created_at', filters.date_from)
    }

    if (filters?.date_to) {
      countQuery = countQuery.lte('created_at', filters.date_to)
      dataQuery = dataQuery.lte('created_at', filters.date_to)
    }

    // Apply search filter
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`
      countQuery = countQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
      dataQuery = dataQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`)
    }

    // Apply ordering and pagination to data query
    dataQuery = dataQuery
      .order('created_at', { ascending: false })
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
      data: (dataResult.data ?? []) as TicketWithRelations[],
      total,
      page,
      pageSize,
      totalPages,
    }
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
          name,
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

  // ============================================================
  // COUNT METHODS (for dashboard performance)
  // ============================================================

  /**
   * Count tickets by status (single or multiple statuses)
   */
  async countByStatus(statuses: TicketStatus[]): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .in('status', statuses)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Count tickets NOT in specified statuses
   */
  async countByStatusNot(excludeStatuses: TicketStatus[]): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .not('status', 'in', `(${excludeStatuses.join(',')})`)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Count tickets by priority
   */
  async countByPriority(priority: TicketPriority): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('priority', priority)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Count overdue tickets (past due_date and not closed/rejected)
   */
  async countOverdue(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()
    const now = new Date().toISOString()

    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .not('status', 'in', '(closed,rejected)')
      .not('due_date', 'is', null)
      .lt('due_date', now)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Count total tickets
   */
  async countTotal(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { count, error } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    return count ?? 0
  }

  /**
   * Get counts grouped by status (for charts)
   * Uses efficient COUNT queries instead of loading all tickets into memory
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const statuses: TicketStatus[] = [
      'submitted',
      'acknowledged',
      'needs_approval',
      'approved',
      'in_progress',
      'completed',
      'verified',
      'closed',
      'rejected',
      'on_hold',
    ]

    // Run COUNT queries in parallel for each status
    const countPromises = statuses.map(async (status) => {
      const { count, error } = await supabase
        .from('tickets')
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
   * Get counts grouped by priority (for charts)
   * Uses efficient COUNT queries instead of loading all tickets into memory
   */
  async getPriorityCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const priorities: TicketPriority[] = ['low', 'medium', 'high', 'critical']

    // Run COUNT queries in parallel for each priority
    const countPromises = priorities.map(async (priority) => {
      const { count, error } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('priority', priority)
        .is('deleted_at', null)

      if (error) throw new Error(error.message)
      return { priority, count: count || 0 }
    })

    const results = await Promise.all(countPromises)

    const counts: Record<string, number> = {}
    results.forEach(({ priority, count }) => {
      if (count > 0) {
        counts[priority] = count
      }
    })

    return counts
  }

  /**
   * Get average resolution time in hours for closed tickets
   */
  async getAverageResolutionHours(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('created_at, closed_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'closed')
      .not('closed_at', 'is', null)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) return 0

    // Cast to the expected shape since we're selecting specific columns
    const tickets = data as Array<{ created_at: string; closed_at: string | null }>

    const totalHours = tickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at)
      const closed = new Date(ticket.closed_at!)
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60)
      return sum + hours
    }, 0)

    return Math.round(totalHours / tickets.length)
  }

  /**
   * Count unique locations with tickets
   */
  async countLocationsWithTickets(): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
      .select('location_id')
      .eq('tenant_id', tenantId)
      .not('location_id', 'is', null)
      .is('deleted_at', null)

    if (error) throw new Error(error.message)

    // Count unique location IDs
    const uniqueLocations = new Set(data?.map((t: { location_id: string }) => t.location_id) ?? [])
    return uniqueLocations.size
  }

  /**
   * Get ticket counts per location
   */
  async getLocationTicketCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from('tickets')
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
}
