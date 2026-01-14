'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApprovalStatus } from '@/components/tickets/approval-status'
import { useApprovalAction } from '@/hooks/use-tickets'
import { DollarSign, AlertCircle } from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import { format } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'

// Cache settings
const STALE_TIME = 30000 // 30 seconds
const GC_TIME = 300000 // 5 minutes

interface ApprovalWithTicket {
  id: string
  ticket_id: string
  estimated_cost: number
  status: 'pending' | 'approved' | 'denied'
  requested_by: {
    id: string
    full_name: string
  }
  created_at: string
  ticket: {
    id: string
    ticket_number: string
    title: string
    status: string
  }
}

export default function ApprovalsPage() {
  const router = useRouter()

  // Use shared auth hook (already cached)
  const { user: currentUser, isLoading: authLoading } = useAuth()

  const canApprove = currentUser?.role === 'manager' || currentUser?.role === 'admin'

  // Fetch pending approvals - runs in parallel with auth since we fetch anyway
  // The API will return empty if user doesn't have permission
  const { data: approvalsData, isLoading: approvalsLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await api.get<{ approvals: ApprovalWithTicket[] }>(
        '/api/approvals?status=pending'
      )
      return response.approvals
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    // Don't wait for auth - let API handle permission check
    enabled: !authLoading,
  })

  const approvals = approvalsData || []
  const isLoading = authLoading || approvalsLoading

  if (!canApprove) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-500">
              Only managers and administrators can view cost approvals.
            </p>
            <Button className="mt-6" onClick={() => router.push('/tickets')}>
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Approvals</h1>
        <p className="mt-2 text-gray-600">
          Review and approve cost estimates for maintenance tickets
        </p>
      </div>

      {/* Stats - Compact on mobile */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex rounded-full bg-amber-100 p-3">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Pending</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">
                  {approvals.filter((a) => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Total Amt</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">
                  $
                  {approvals
                    .reduce((sum, a) => sum + a.estimated_cost, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:pt-6 md:p-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex rounded-full bg-blue-100 p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] md:text-sm font-medium text-gray-600 truncate">Avg. Cost</p>
                <p className="text-base md:text-2xl font-bold text-gray-900">
                  $
                  {approvals.length > 0
                    ? Math.round(
                        approvals.reduce((sum, a) => sum + a.estimated_cost, 0) /
                          approvals.length
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals List */}
      {approvals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No Pending Approvals
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              All cost approvals have been processed.
            </p>
            <Button className="mt-6" onClick={() => router.push('/tickets')}>
              View All Tickets
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {approvals.map((approval) => (
            <Card key={approval.id} className="overflow-hidden">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Ticket #{approval.ticket.ticket_number}
                    </CardTitle>
                    <p className="mt-1 text-sm text-gray-600">
                      {approval.ticket.title}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/tickets/${approval.ticket_id}`)}
                  >
                    View Ticket →
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Estimated Cost
                    </p>
                    <p className="mt-1 text-2xl font-bold text-gray-900">
                      ${approval.estimated_cost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Requested By
                    </p>
                    <p className="mt-1 text-sm text-gray-900">
                      {approval.requested_by.full_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(approval.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Ticket Status
                    </p>
                    <Badge className="mt-1" variant="secondary">
                      {approval.ticket.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6">
                  <ApprovalStatusCard
                    ticketId={approval.ticket_id}
                    approval={approval}
                    userRole={currentUser?.role}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Separate component to handle approval actions with proper query invalidation
// PERFORMANCE: Receives approval data from parent - NO extra API call needed
function ApprovalStatusCard({
  ticketId,
  approval,
  userRole,
}: {
  ticketId: string
  approval: ApprovalWithTicket
  userRole?: string
}) {
  const approvalAction = useApprovalAction(ticketId)

  const handleApprove = async () => {
    try {
      await approvalAction.mutateAsync({ action: 'approve' })
    } catch (error) {
      console.error('Error approving:', error)
    }
  }

  const handleDeny = async (reason: string) => {
    try {
      await approvalAction.mutateAsync({ action: 'deny', reason })
    } catch (error) {
      console.error('Error denying:', error)
    }
  }

  // ApprovalStatus component expects approval with requested_by as object
  const approvalForStatus = {
    id: approval.id,
    estimated_cost: approval.estimated_cost,
    status: approval.status,
    requested_by: approval.requested_by, // Already { id, full_name }
    requested_at: approval.created_at,
    approved_by: null,
    approved_at: null,
    denial_reason: null,
    vendor_quote_path: null,
    notes: null,
  }

  return (
    <ApprovalStatus
      approval={approvalForStatus}
      userRole={(userRole === 'super_admin' ? 'admin' : userRole || 'user') as 'admin' | 'manager' | 'staff' | 'user'}
      onApprove={handleApprove}
      onDeny={handleDeny}
      loading={approvalAction.isPending}
    />
  )
}
