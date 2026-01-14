'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ApprovalStatus } from '@/components/tickets/approval-status'
import { useApprovalAction } from '@/hooks/use-tickets'
import { Loader2, DollarSign, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { Database } from '@/types/database'

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

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get<{ user: Database['public']['Tables']['users']['Row'] }>('/api/auth/me')
      return response.user
    },
  })

  // Fetch pending approvals
  const { data: approvalsData, isLoading } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await api.get<{ approvals: ApprovalWithTicket[] }>(
        '/api/approvals?status=pending'
      )
      return response.approvals
    },
    enabled: currentUser?.role === 'manager' || currentUser?.role === 'admin',
  })

  const approvals = approvalsData || []

  const canApprove = currentUser?.role === 'manager' || currentUser?.role === 'admin'

  if (!canApprove) {
    return (
      <div className="container mx-auto max-w-7xl py-8">
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
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl space-y-6 py-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Approvals</h1>
        <p className="mt-2 text-gray-600">
          Review and approve cost estimates for maintenance tickets
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {approvals.filter((a) => a.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
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
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Cost</p>
                <p className="text-2xl font-bold text-gray-900">
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
                    approvalId={approval.id}
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
function ApprovalStatusCard({
  ticketId,
  approvalId,
  userRole,
}: {
  ticketId: string
  approvalId: string
  userRole: string
}) {
  const approvalAction = useApprovalAction(ticketId)

  // Fetch full approval details
  const { data: approval } = useQuery({
    queryKey: ['approval', approvalId],
    queryFn: async () => {
      const response = await api.get<{ approval: Database['public']['Tables']['cost_approvals']['Row'] }>(
        `/api/tickets/${ticketId}/approval`
      )
      return response.approval
    },
  })

  if (!approval) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

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

  return (
    <ApprovalStatus
      approval={approval as unknown as Parameters<typeof ApprovalStatus>[0]['approval']}
      userRole={(userRole === 'super_admin' ? 'admin' : userRole) as 'admin' | 'manager' | 'staff' | 'user'}
      onApprove={handleApprove}
      onDeny={handleDeny}
      loading={approvalAction.isPending}
    />
  )
}
