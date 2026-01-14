import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { CostApprovalDAO, CostApprovalWithRelations } from '@/dao/cost-approval.dao'

/**
 * GET /api/approvals
 * Get cost approvals with optional status filter
 * Only accessible by managers and admins
 */
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth()
    if (error) return error
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can view approvals list
    if (user.role !== 'manager' && user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json({ approvals: [] }) // Return empty for non-authorized users
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const dao = new CostApprovalDAO()

    // Fetch approvals based on status filter
    // findPending returns CostApprovalWithRelations which includes ticket and requester
    let approvals: CostApprovalWithRelations[]
    if (status === 'pending') {
      approvals = await dao.findPending()
    } else {
      // Default to pending if no status specified or other status
      approvals = await dao.findPending()
    }

    // Transform to match the expected format for the frontend
    const transformedApprovals = approvals.map(approval => ({
      id: approval.id,
      ticket_id: approval.ticket_id,
      estimated_cost: approval.estimated_cost,
      status: approval.status,
      requested_by: approval.requester ? {
        id: approval.requester.id,
        full_name: approval.requester.full_name,
      } : { id: approval.requested_by || '', full_name: 'Unknown' },
      created_at: approval.requested_at,
      ticket: approval.ticket ? {
        id: approval.ticket.id,
        ticket_number: String(approval.ticket.ticket_number),
        title: approval.ticket.title,
        status: 'pending', // We don't have status in the join, default value
      } : null,
    }))

    return NextResponse.json({ approvals: transformedApprovals })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}
