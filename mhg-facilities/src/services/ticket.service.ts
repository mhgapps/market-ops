import { TicketDAO, type TicketFilters, type PaginatedResult } from '@/dao/ticket.dao'
import { TicketCategoryDAO } from '@/dao/ticket-category.dao'
import { UserDAO } from '@/dao/user.dao'
import { LocationDAO } from '@/dao/location.dao'
import { CostApprovalService } from './cost-approval.service'
import { NotificationService } from './notification.service'
import type { Database, TicketStatus, TicketPriority } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']

export interface CreateTicketInput {
  title: string
  description?: string | null
  category_id?: string | null
  location_id: string
  asset_id?: string | null
  priority?: TicketPriority
  is_emergency?: boolean
  submitted_by: string
}

export interface UpdateTicketInput {
  title?: string
  description?: string
  category_id?: string
  priority?: TicketPriority
  due_date?: string
}

// Re-export TicketFilters and PaginatedResult for consumers
export type { TicketFilters, PaginatedResult } from '@/dao/ticket.dao'

export interface TicketStats {
  total: number
  by_status: Record<TicketStatus, number>
  by_priority: Record<TicketPriority, number>
  overdue: number
  pending_approval: number
}

/**
 * Ticket Service
 * Handles business logic for ticket lifecycle management
 *
 * Status Flow:
 * submitted → acknowledged → [needs_approval → approved] → in_progress → completed → verified → closed
 * Any status can go to: rejected, on_hold
 */
export class TicketService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private categoryDAO = new TicketCategoryDAO(),
    private userDAO = new UserDAO(),
    private locationDAO = new LocationDAO(),
    private costApprovalService = new CostApprovalService(),
    private notificationService = new NotificationService()
  ) {}

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Get all tickets with optional filters
   * PERFORMANCE: All filtering is done at the database level, not in memory
   * @param filters Optional filters for status, priority, location, assignee, etc.
   * @param limit Maximum number of records to return (default: 100)
   */
  async getAllTickets(filters?: TicketFilters, limit = 100): Promise<Ticket[]> {
    return this.ticketDAO.findAllWithFilters(filters, limit)
  }

  /**
   * Get all tickets with pagination
   * Returns paginated results with total count
   * @param filters Optional filters including page and pageSize
   */
  async getAllTicketsPaginated(filters?: TicketFilters) {
    return this.ticketDAO.findAllWithFiltersPaginated(filters)
  }

  /**
   * Get ticket by ID with all relations
   */
  async getTicketById(id: string) {
    const ticket = await this.ticketDAO.findWithRelations(id)
    if (!ticket) {
      throw new Error('Ticket not found')
    }
    return ticket
  }

  /**
   * Get tickets for a specific location
   */
  async getTicketsByLocation(locationId: string) {
    return this.ticketDAO.findByLocation(locationId)
  }

  /**
   * Get tickets submitted or assigned to a user
   */
  async getMyTickets(userId: string) {
    const [submitted, assigned] = await Promise.all([
      this.ticketDAO.findBySubmitter(userId),
      this.ticketDAO.findByAssignee(userId),
    ])

    // Combine and deduplicate
    const ticketMap = new Map<string, Ticket>()
    submitted.forEach(t => ticketMap.set(t.id, t))
    assigned.forEach(t => ticketMap.set(t.id, t))

    return Array.from(ticketMap.values())
  }

  /**
   * Get ticket statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all tickets into memory
   */
  async getTicketStats(): Promise<TicketStats> {
    // Fetch all counts in parallel using COUNT queries
    const [
      total,
      statusCounts,
      priorityCounts,
      overdueCount,
    ] = await Promise.all([
      this.ticketDAO.countTotal(),
      this.ticketDAO.getStatusCounts(),
      this.ticketDAO.getPriorityCounts(),
      this.ticketDAO.countOverdue(),
    ])

    const stats: TicketStats = {
      total,
      by_status: {
        submitted: statusCounts['submitted'] || 0,
        acknowledged: statusCounts['acknowledged'] || 0,
        needs_approval: statusCounts['needs_approval'] || 0,
        approved: statusCounts['approved'] || 0,
        in_progress: statusCounts['in_progress'] || 0,
        completed: statusCounts['completed'] || 0,
        verified: statusCounts['verified'] || 0,
        closed: statusCounts['closed'] || 0,
        rejected: statusCounts['rejected'] || 0,
        on_hold: statusCounts['on_hold'] || 0,
      },
      by_priority: {
        low: priorityCounts['low'] || 0,
        medium: priorityCounts['medium'] || 0,
        high: priorityCounts['high'] || 0,
        critical: priorityCounts['critical'] || 0,
      },
      overdue: overdueCount,
      pending_approval: statusCounts['needs_approval'] || 0,
    }

    return stats
  }

  // ============================================================
  // COMMANDS
  // ============================================================

  /**
   * Create new ticket
   */
  async createTicket(data: CreateTicketInput): Promise<Ticket> {
    // Validate location exists
    const location = await this.locationDAO.findById(data.location_id)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate category if provided
    if (data.category_id) {
      const category = await this.categoryDAO.findById(data.category_id)
      if (!category) {
        throw new Error('Category not found')
      }
    }

    // Validate submitter exists
    const submitter = await this.userDAO.findById(data.submitted_by)
    if (!submitter) {
      throw new Error('Submitter user not found')
    }

    // Get next ticket number
    const ticketNumber = await this.ticketDAO.getNextTicketNumber()

    // Create ticket
    const ticket = await this.ticketDAO.createTicket({
      ticket_number: ticketNumber,
      title: data.title,
      description: data.description ?? null,
      category_id: data.category_id ?? null,
      location_id: data.location_id,
      asset_id: data.asset_id ?? null,
      priority: data.priority ?? 'medium',
      status: 'submitted',
      submitted_by: data.submitted_by,
      is_emergency: data.is_emergency ?? false,
    })

    return ticket
  }

  /**
   * Update ticket basic info
   */
  async updateTicket(id: string, data: UpdateTicketInput): Promise<Ticket> {
    // Verify ticket exists
    await this.getTicketById(id)

    // Validate category if provided
    if (data.category_id) {
      const category = await this.categoryDAO.findById(data.category_id)
      if (!category) {
        throw new Error('Category not found')
      }
    }

    return this.ticketDAO.updateTicket(id, data)
  }

  // ============================================================
  // STATUS TRANSITIONS
  // ============================================================

  /**
   * Acknowledge ticket (submitted → acknowledged)
   */
  async acknowledgeTicket(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    if (ticket.status !== 'submitted') {
      throw new Error('Only submitted tickets can be acknowledged')
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    })
  }

  /**
   * Assign ticket to staff member
   */
  async assignTicket(id: string, assigneeId: string, assignerId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    // Validate assignee exists and is staff
    const assignee = await this.userDAO.findById(assigneeId)
    if (!assignee) {
      throw new Error('Assignee not found')
    }

    if (assignee.role !== 'staff' && assignee.role !== 'manager' && assignee.role !== 'admin') {
      throw new Error('Can only assign to staff, manager, or admin users')
    }

    // Valid states for assignment
    const validStates: TicketStatus[] = ['acknowledged', 'approved']
    if (!validStates.includes(ticket.status)) {
      throw new Error(`Cannot assign ticket in ${ticket.status} status`)
    }

    const updatedTicket = await this.ticketDAO.updateTicket(id, {
      assigned_to: assigneeId,
    })

    // Send notification to assignee (async, don't await)
    const assigner = await this.userDAO.findById(assignerId)
    if (assigner) {
      this.notificationService
        .notifyTicketAssignment({
          ticket: updatedTicket,
          assignedBy: assigner,
          assignee,
        })
        .catch((err) => console.error('Failed to send ticket assignment notification:', err))
    }

    return updatedTicket
  }

  /**
   * Assign ticket to vendor
   */
  async assignToVendor(id: string, vendorId: string, assignerId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    // Valid states for vendor assignment
    const validStates: TicketStatus[] = ['acknowledged', 'approved']
    if (!validStates.includes(ticket.status)) {
      throw new Error(`Cannot assign ticket to vendor in ${ticket.status} status`)
    }

    return this.ticketDAO.updateTicket(id, {
      vendor_id: vendorId,
      assigned_to: null, // Clear staff assignment when assigning to vendor
    })
  }

  /**
   * Start work on ticket (acknowledged/approved → in_progress)
   */
  async startWork(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    // Must be assigned to this user or user must be admin/manager
    const user = await this.userDAO.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const isAssigned = ticket.assigned_to === userId
    const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin'

    if (!isAssigned && !isManagerOrAdmin) {
      throw new Error('You are not assigned to this ticket')
    }

    // Valid states for starting work
    const validStates: TicketStatus[] = ['acknowledged', 'approved']
    if (!validStates.includes(ticket.status)) {
      throw new Error(`Cannot start work on ticket in ${ticket.status} status`)
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'in_progress',
      started_at: new Date().toISOString(),
    })
  }

  /**
   * Complete ticket (in_progress → completed)
   */
  async completeTicket(id: string, userId: string, actualCost?: number): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    if (ticket.status !== 'in_progress') {
      throw new Error('Only in-progress tickets can be completed')
    }

    // Must be assigned to this user or user must be admin/manager
    const user = await this.userDAO.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    const isAssigned = ticket.assigned_to === userId
    const isManagerOrAdmin = user.role === 'manager' || user.role === 'admin'

    if (!isAssigned && !isManagerOrAdmin) {
      throw new Error('You are not assigned to this ticket')
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      actual_cost: actualCost ?? null,
    })
  }

  /**
   * Verify completion (completed → verified)
   * Only managers/admins can verify
   */
  async verifyCompletion(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    if (ticket.status !== 'completed') {
      throw new Error('Only completed tickets can be verified')
    }

    // Verify user is manager or admin
    const user = await this.userDAO.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'manager' && user.role !== 'admin') {
      throw new Error('Only managers and admins can verify ticket completion')
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'verified',
      verified_at: new Date().toISOString(),
    })
  }

  /**
   * Close ticket (verified → closed)
   * Final state - ticket is archived
   */
  async closeTicket(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    if (ticket.status !== 'verified') {
      throw new Error('Only verified tickets can be closed')
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
  }

  /**
   * Reject ticket
   * Can reject from submitted or acknowledged
   */
  async rejectTicket(id: string, userId: string, reason: string): Promise<Ticket> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }

    const ticket = await this.getTicketById(id)

    // Can only reject from early stages
    const validStates: TicketStatus[] = ['submitted', 'acknowledged']
    if (!validStates.includes(ticket.status)) {
      throw new Error(`Cannot reject ticket in ${ticket.status} status`)
    }

    // Verify user is manager or admin
    const user = await this.userDAO.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'manager' && user.role !== 'admin') {
      throw new Error('Only managers and admins can reject tickets')
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'rejected',
      // Store reason in description or we could add a rejection_reason field
    })
  }

  /**
   * Put ticket on hold
   */
  async putOnHold(id: string, userId: string, reason: string): Promise<Ticket> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Hold reason is required')
    }

    const ticket = await this.getTicketById(id)

    // Can put on hold from most active states
    const validStates: TicketStatus[] = ['acknowledged', 'in_progress']
    if (!validStates.includes(ticket.status)) {
      throw new Error(`Cannot put ticket on hold in ${ticket.status} status`)
    }

    return this.ticketDAO.updateTicket(id, {
      status: 'on_hold',
    })
  }

  /**
   * Resume ticket from hold
   * Returns to previous appropriate state
   */
  async resumeFromHold(id: string, userId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)

    if (ticket.status !== 'on_hold') {
      throw new Error('Only on-hold tickets can be resumed')
    }

    // Determine appropriate status to return to
    // If was in_progress and still assigned, return to in_progress
    // Otherwise return to acknowledged
    const newStatus: TicketStatus =
      ticket.started_at && ticket.assigned_to ? 'in_progress' : 'acknowledged'

    return this.ticketDAO.updateTicket(id, {
      status: newStatus,
    })
  }

  // ============================================================
  // DUPLICATE DETECTION
  // ============================================================

  /**
   * Check for potential duplicate tickets
   */
  async checkForDuplicates(
    locationId: string,
    assetId: string | null,
    title: string
  ): Promise<Ticket[]> {
    return this.ticketDAO.checkDuplicate(locationId, assetId, title)
  }

  /**
   * Mark ticket as duplicate of another
   */
  async markAsDuplicate(id: string, originalTicketId: string): Promise<Ticket> {
    const ticket = await this.getTicketById(id)
    const original = await this.getTicketById(originalTicketId)

    if (ticket.id === original.id) {
      throw new Error('Cannot mark ticket as duplicate of itself')
    }

    return this.ticketDAO.updateTicket(id, {
      is_duplicate: true,
      merged_into_ticket_id: originalTicketId,
      status: 'closed',
      closed_at: new Date().toISOString(),
    })
  }

  /**
   * Merge multiple tickets into one target ticket
   */
  async mergeTickets(targetId: string, sourceIds: string[]): Promise<Ticket> {
    const target = await this.getTicketById(targetId)

    // Mark all source tickets as duplicates
    await Promise.all(
      sourceIds.map(sourceId => this.markAsDuplicate(sourceId, targetId))
    )

    return target
  }
}
