import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Database } from '@/types/database'

// Types
interface Ticket {
  id: string
  ticket_number: string
  title: string
  description: string
  status: string
  priority: string
  category_id: string
  location_id: string
  asset_id?: string | null
  submitted_by: string
  assignee_id?: string | null
  vendor_id?: string | null
  estimated_completion?: string | null
  actual_completion?: string | null
  created_at: string
  updated_at: string
  // Joined fields (populated by API)
  location?: {
    id: string
    name: string
    address?: string | null
  }
  asset?: {
    id: string
    asset_name: string
    asset_tag?: string | null
  }
  submitted_by_user?: {
    id: string
    full_name: string
  }
  assignee?: {
    id: string
    full_name: string
  }
  vendor?: {
    id: string
    vendor_name: string
  }
  status_history?: Array<{
    id: string
    status: string
    changed_at: string
    changed_by: {
      id: string
      full_name: string
    }
    notes?: string | null
  }>
}

interface TicketFilters {
  status?: string
  priority?: string
  category_id?: string
  location_id?: string
  assignee_id?: string
}

export interface CreateTicketData {
  title: string
  description: string
  category_id: string
  priority: string
  location_id: string
  asset_id?: string | null
}

interface UpdateTicketData {
  title?: string
  description?: string
  priority?: string
}

interface StatusActionData {
  action: string
  reason?: string
  notes?: string
}

interface AssignmentData {
  assignee_id?: string
  vendor_id?: string
}

interface CommentData {
  comment: string
  is_internal: boolean
}

interface AttachmentData {
  file: File
  attachment_type: 'photo' | 'invoice' | 'quote' | 'other'
}

interface ApprovalRequestData {
  estimated_cost: number
  vendor_quote_path?: string
  notes: string
}

interface ApprovalActionData {
  action: 'approve' | 'deny'
  reason?: string
}

// Query Keys
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (filters?: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  comments: (id: string) => [...ticketKeys.detail(id), 'comments'] as const,
  attachments: (id: string) => [...ticketKeys.detail(id), 'attachments'] as const,
  approval: (id: string) => [...ticketKeys.detail(id), 'approval'] as const,
}

// Queries
export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.priority) params.append('priority', filters.priority)
      if (filters?.category_id) params.append('category_id', filters.category_id)
      if (filters?.location_id) params.append('location_id', filters.location_id)
      if (filters?.assignee_id) params.append('assignee_id', filters.assignee_id)

      const response = await api.get<{ tickets: Ticket[] }>(
        `/api/tickets?${params.toString()}`
      )
      return response.tickets
    },
  })
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ ticket: Ticket }>(`/api/tickets/${id}`)
      return response.ticket
    },
    enabled: !!id,
  })
}

export function useTicketComments(id: string, includeInternal = false) {
  return useQuery({
    queryKey: [...ticketKeys.comments(id), includeInternal],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (includeInternal) params.append('include_internal', 'true')

      const response = await api.get<{ comments: Database['public']['Tables']['ticket_comments']['Row'][] }>(
        `/api/tickets/${id}/comments?${params.toString()}`
      )
      return response.comments
    },
    enabled: !!id,
  })
}

export function useTicketAttachments(id: string) {
  return useQuery({
    queryKey: ticketKeys.attachments(id),
    queryFn: async () => {
      const response = await api.get<{ attachments: Database['public']['Tables']['ticket_attachments']['Row'][] }>(
        `/api/tickets/${id}/attachments`
      )
      return response.attachments
    },
    enabled: !!id,
  })
}

export function useTicketApproval(id: string) {
  return useQuery({
    queryKey: ticketKeys.approval(id),
    queryFn: async () => {
      const response = await api.get<{ approval: Database['public']['Tables']['cost_approvals']['Row'] | null }>(
        `/api/tickets/${id}/approval`
      )
      return response.approval
    },
    enabled: !!id,
  })
}

// Mutations
export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const response = await api.post<{ ticket: Ticket }>('/api/tickets', data)
      return response.ticket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateTicketData) => {
      const response = await api.patch<{ ticket: Ticket }>(`/api/tickets/${id}`, data)
      return response.ticket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useTicketStatusAction(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StatusActionData) => {
      const response = await api.patch<{ ticket: Ticket }>(
        `/api/tickets/${id}/status`,
        data
      )
      return response.ticket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useAssignTicket(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AssignmentData) => {
      const response = await api.post<{ ticket: Ticket }>(
        `/api/tickets/${id}/assign`,
        data
      )
      return response.ticket
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useAddComment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CommentData) => {
      const response = await api.post(`/api/tickets/${id}/comments`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(id) })
    },
  })
}

export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: AttachmentData) => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('attachment_type', data.attachment_type)

      const response = await api.upload(
        `/api/tickets/${id}/attachments`,
        formData
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(id) })
    },
  })
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/api/tickets/${ticketId}/attachments?attachment_id=${attachmentId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(ticketId) })
    },
  })
}

export function useRequestApproval(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApprovalRequestData) => {
      const response = await api.post(`/api/tickets/${id}/approval`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.approval(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
    },
  })
}

export function useApprovalAction(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ApprovalActionData) => {
      const response = await api.patch(`/api/tickets/${id}/approval`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.approval(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() })
    },
  })
}

export function useCheckDuplicates() {
  return useMutation({
    mutationFn: async (data: {
      location_id: string
      asset_id: string | null
      title: string
    }) => {
      const response = await api.post<{
        has_duplicates: boolean
        duplicates: Ticket[]
      }>('/api/tickets/check-duplicate', data)
      return response
    },
  })
}
