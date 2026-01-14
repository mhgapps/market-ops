'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import {
  useTicket,
  useTicketComments,
  useTicketAttachments,
  useTicketApproval,
  useTicketStatusAction,
  useAssignTicket,
  useAddComment,
  useUploadAttachment,
  useDeleteAttachment,
  useRequestApproval,
  useApprovalAction,
} from '@/hooks/use-tickets'
import { useTicketRealtime } from '@/hooks/use-realtime'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/tickets/status-badge'
import { StatusTimeline } from '@/components/tickets/status-timeline'
import { StatusActions } from '@/components/tickets/status-actions'
import { AssignModal } from '@/components/tickets/assign-modal'
import { AssignVendorModal } from '@/components/tickets/assign-vendor-modal'
import { CommentList } from '@/components/tickets/comment-list'
import { CommentForm } from '@/components/tickets/comment-form'
import { AttachmentGallery } from '@/components/tickets/attachment-gallery'
import { AttachmentUpload } from '@/components/tickets/attachment-upload'
import { CostApprovalForm } from '@/components/tickets/cost-approval-form'
import { ApprovalStatus } from '@/components/tickets/approval-status'
import {
  MapPin,
  Package,
  User,
  Calendar,
  Clock,
  ChevronLeft,
  Users,
  Building2,
  AlertCircle,
} from 'lucide-react'
import { PageLoader } from '@/components/ui/loaders'
import { format } from 'date-fns'
import { useState } from 'react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TicketDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [showApprovalForm, setShowApprovalForm] = useState(false)

  // Subscribe to realtime updates for this specific ticket
  useTicketRealtime(id)

  // Fetch ticket data
  const { data: ticket, isLoading: ticketLoading } = useTicket(id)
  const { data: comments = [] } = useTicketComments(id, true)
  const { data: attachments = [] } = useTicketAttachments(id)
  const { data: approval } = useTicketApproval(id)

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const response = await api.get<{ user: Database['public']['Tables']['users']['Row'] }>('/api/auth/me')
      return response.user
    },
  })

  // Fetch staff members for assignment
  const { data: staffData } = useQuery({
    queryKey: ['staff-members'],
    queryFn: async () => {
      const response = await api.get<{ users: Database['public']['Tables']['users']['Row'][] }>('/api/users?role=staff')
      return response.users
    },
  })

  // Fetch vendors
  const { data: vendorsData } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const response = await api.get<{ vendors: Database['public']['Tables']['vendors']['Row'][] }>('/api/vendors')
      return response.vendors
    },
  })

  // Mutations
  const statusAction = useTicketStatusAction(id)
  const assignTicket = useAssignTicket(id)
  const addComment = useAddComment(id)
  const uploadAttachment = useUploadAttachment(id)
  const deleteAttachment = useDeleteAttachment(id)
  const requestApproval = useRequestApproval(id)
  const approvalAction = useApprovalAction(id)

  const handleStatusAction = async (action: string) => {
    try {
      await statusAction.mutateAsync({ action })
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleAssignStaff = async (staffId: string) => {
    try {
      await assignTicket.mutateAsync({ assignee_id: staffId })
      setShowAssignModal(false)
    } catch (error) {
      console.error('Error assigning staff:', error)
    }
  }

  const handleAssignVendor = async (vendorId: string) => {
    try {
      await assignTicket.mutateAsync({ vendor_id: vendorId })
      setShowVendorModal(false)
    } catch (error) {
      console.error('Error assigning vendor:', error)
    }
  }

  const handleAddComment = async (data: { comment: string; is_internal: boolean }) => {
    try {
      await addComment.mutateAsync(data)
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleUploadAttachment = async (data: {
    file: File
    attachment_type: 'photo' | 'invoice' | 'quote' | 'other'
  }) => {
    try {
      await uploadAttachment.mutateAsync(data)
    } catch (error) {
      console.error('Error uploading attachment:', error)
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
      try {
        await deleteAttachment.mutateAsync(attachmentId)
      } catch (error) {
        console.error('Error deleting attachment:', error)
      }
    }
  }

  const handleRequestApproval = async (data: {
    estimated_cost: number
    vendor_quote_path?: string
    notes: string
  }) => {
    try {
      await requestApproval.mutateAsync(data)
      setShowApprovalForm(false)
    } catch (error) {
      console.error('Error requesting approval:', error)
    }
  }

  const handleApprovalAction = async (action: 'approve' | 'deny', reason?: string) => {
    try {
      await approvalAction.mutateAsync({ action, reason })
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  if (ticketLoading) {
    return <PageLoader />
  }

  if (!ticket) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Ticket not found</h3>
            <p className="mt-2 text-sm text-gray-500">
              The ticket you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button className="mt-6" onClick={() => router.push('/tickets')}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAssigned = !!ticket.assignee_id
  const canManage = currentUser?.role === 'manager' || currentUser?.role === 'admin'
  const isAssignedToCurrentUser = currentUser?.id === ticket.assignee_id

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/tickets')}
          className="mb-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Button>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                #{ticket.ticket_number}
              </h1>
              <StatusBadge status={ticket.status as Database['public']['Enums']['ticket_status']} />
            </div>
            <h2 className="mt-2 text-xl text-gray-700">{ticket.title}</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignModal(true)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Staff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVendorModal(true)}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Assign Vendor
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusActions
                ticketId={ticket.id}
                currentStatus={ticket.status as Database['public']['Enums']['ticket_status']}
                userRole={(currentUser?.role === 'super_admin' ? 'admin' : currentUser?.role || 'user') as 'admin' | 'manager' | 'staff' | 'user'}
                isAssigned={isAssigned}
                onAction={handleStatusAction}
                loading={statusAction.isPending}
              />
              {!isAssigned && ticket.status !== 'submitted' && (
                <p className="mt-2 text-sm text-amber-600">
                  <AlertCircle className="mr-1 inline h-4 w-4" />
                  This ticket must be assigned to a staff member before work can begin.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700">{ticket.description}</p>
            </CardContent>
          </Card>

          {/* Tabs for Comments, Attachments, Approval */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="comments">
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="attachments">
                Attachments ({attachments.length})
              </TabsTrigger>
              <TabsTrigger value="approval">
                Approval {approval && '✓'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4">
              <CommentList
                comments={comments as unknown as Parameters<typeof CommentList>[0]['comments']}
                currentUserId={currentUser?.id}
              />
              <CommentForm
                ticketId={ticket.id}
                userRole={(currentUser?.role === 'super_admin' ? 'admin' : currentUser?.role || 'user') as 'admin' | 'manager' | 'staff' | 'user'}
                onSubmit={handleAddComment}
              />
            </TabsContent>

            <TabsContent value="attachments" className="space-y-4">
              <AttachmentGallery
                attachments={attachments as unknown as Parameters<typeof AttachmentGallery>[0]['attachments']}
                canDelete={canManage || isAssignedToCurrentUser}
                onDelete={handleDeleteAttachment}
              />
              <AttachmentUpload
                ticketId={ticket.id}
                onUpload={handleUploadAttachment}
              />
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              {approval ? (
                <ApprovalStatus
                  approval={approval as unknown as Parameters<typeof ApprovalStatus>[0]['approval']}
                  userRole={(currentUser?.role === 'super_admin' ? 'admin' : currentUser?.role || 'user') as 'admin' | 'manager' | 'staff' | 'user'}
                  onApprove={() => handleApprovalAction('approve')}
                  onDeny={(reason) => handleApprovalAction('deny', reason)}
                  loading={approvalAction.isPending}
                />
              ) : showApprovalForm ? (
                <CostApprovalForm
                  ticketId={ticket.id}
                  ticketTitle={ticket.title}
                  onSubmit={handleRequestApproval}
                  onCancel={() => setShowApprovalForm(false)}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No cost approval requested</p>
                    {canManage && (
                      <Button
                        className="mt-4"
                        onClick={() => setShowApprovalForm(true)}
                      >
                        Request Approval
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Priority</p>
                <Badge
                  variant={
                    ticket.priority === 'critical' || ticket.priority === 'high'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="mt-1"
                >
                  {ticket.priority}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">{ticket.location?.name || 'N/A'}</span>
                </div>

                {ticket.asset && (
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{ticket.asset.asset_name}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Submitted by {ticket.submitted_by_user?.full_name || 'Unknown'}
                  </span>
                </div>

                {ticket.assignee && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Assigned to {ticket.assignee.full_name}
                    </span>
                  </div>
                )}

                {ticket.vendor && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Vendor: {ticket.vendor.name}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    Updated {format(new Date(ticket.updated_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {ticket.status_history && ticket.status_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status History</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline
                  statusHistory={ticket.status_history as unknown as Parameters<typeof StatusTimeline>[0]['statusHistory']}
                  currentStatus={ticket.status as Database['public']['Enums']['ticket_status']}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssignModal
        ticketId={ticket.id}
        ticketTitle={ticket.title}
        open={showAssignModal}
        onOpenChange={setShowAssignModal}
        staffMembers={staffData || []}
        currentAssigneeId={ticket.assignee_id}
        onAssign={handleAssignStaff}
      />

      <AssignVendorModal
        ticketId={ticket.id}
        ticketTitle={ticket.title}
        open={showVendorModal}
        onOpenChange={setShowVendorModal}
        vendors={(vendorsData || []) as unknown as Parameters<typeof AssignVendorModal>[0]['vendors']}
        currentVendorId={ticket.vendor_id}
        onAssign={handleAssignVendor}
      />
    </div>
  )
}
