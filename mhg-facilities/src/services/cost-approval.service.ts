import { CostApprovalDAO } from '@/dao/cost-approval.dao'
import { TicketDAO } from '@/dao/ticket.dao'
import type { Database } from '@/types/database'

type CostApproval = Database['public']['Tables']['cost_approvals']['Row']

export interface RequestApprovalInput {
  ticket_id: string
  estimated_cost: number
  vendor_quote_path?: string
  requested_by: string
  notes?: string
}

/**
 * Cost Approval Service
 * Handles business logic for cost approval workflow
 */
export class CostApprovalService {
  constructor(
    private approvalDAO = new CostApprovalDAO(),
    private ticketDAO = new TicketDAO()
  ) {}

  /**
   * Request cost approval for a ticket
   */
  async requestApproval(input: RequestApprovalInput): Promise<CostApproval> {
    const { ticket_id, estimated_cost, vendor_quote_path, requested_by, notes } = input

    // Validate estimated cost
    if (estimated_cost <= 0) {
      throw new Error('Estimated cost must be greater than zero')
    }

    // Verify ticket exists
    const ticket = await this.ticketDAO.findById(ticket_id)
    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Check if there's already a pending approval for this ticket
    const existingApproval = await this.approvalDAO.findLatestByTicketId(ticket_id)
    if (existingApproval && existingApproval.status === 'pending') {
      throw new Error('This ticket already has a pending cost approval request')
    }

    // Create approval request
    const approval = await this.approvalDAO.create({
      ticket_id,
      estimated_cost,
      vendor_quote_path: vendor_quote_path ?? null,
      requested_by,
      notes: notes ?? null,
      status: 'pending',
    })

    // Update ticket status to needs_approval
    await this.ticketDAO.updateTicket(ticket_id, {
      status: 'needs_approval',
      requires_approval: true,
      estimated_cost,
    })

    return approval
  }

  /**
   * Approve cost request
   */
  async approveRequest(approvalId: string, approverId: string): Promise<CostApproval> {
    const approval = await this.approvalDAO.findById(approvalId)
    if (!approval) {
      throw new Error('Approval request not found')
    }

    if (approval.status !== 'pending') {
      throw new Error('This approval request has already been reviewed')
    }

    if (!approval.ticket_id) {
      throw new Error('Approval has no associated ticket')
    }

    // Update approval
    const updatedApproval = await this.approvalDAO.update(approvalId, {
      status: 'approved',
      reviewed_by: approverId,
      reviewed_at: new Date().toISOString(),
    })

    // Update ticket status and approved cost
    await this.ticketDAO.updateTicket(approval.ticket_id, {
      status: 'approved',
      approved_cost: approval.estimated_cost,
      approved_at: new Date().toISOString(),
    })

    return updatedApproval
  }

  /**
   * Deny cost request
   */
  async denyRequest(
    approvalId: string,
    approverId: string,
    reason: string
  ): Promise<CostApproval> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Denial reason is required')
    }

    const approval = await this.approvalDAO.findById(approvalId)
    if (!approval) {
      throw new Error('Approval request not found')
    }

    if (approval.status !== 'pending') {
      throw new Error('This approval request has already been reviewed')
    }

    if (!approval.ticket_id) {
      throw new Error('Approval has no associated ticket')
    }

    // Update approval
    const updatedApproval = await this.approvalDAO.update(approvalId, {
      status: 'denied',
      reviewed_by: approverId,
      reviewed_at: new Date().toISOString(),
      denial_reason: reason.trim(),
    })

    // Update ticket status back to acknowledged
    // Staff will need to revise and resubmit
    await this.ticketDAO.updateTicket(approval.ticket_id, {
      status: 'acknowledged',
      requires_approval: false,
    })

    return updatedApproval
  }

  /**
   * Get all pending approval requests
   */
  async getPendingApprovals() {
    return this.approvalDAO.findPending()
  }

  /**
   * Get approval history for a ticket
   */
  async getApprovalHistory(ticketId: string) {
    return this.approvalDAO.findByTicketId(ticketId)
  }

  /**
   * Get pending approval count (for badges/notifications)
   */
  async getPendingCount(): Promise<number> {
    return this.approvalDAO.countPending()
  }

  /**
   * Get approval by ID
   */
  async getApprovalById(approvalId: string) {
    const approval = await this.approvalDAO.findById(approvalId)
    if (!approval) {
      throw new Error('Approval not found')
    }
    return approval
  }
}
