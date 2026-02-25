import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";

// Types
// Import Ticket from database types
type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];

// Extended Ticket type with relations
export interface Ticket extends TicketRow {
  // Joined fields (populated by API)
  location?: {
    id: string;
    name: string;
    address?: string | null;
  };
  asset?: {
    id: string;
    name: string;
    qr_code?: string | null;
  };
  submitted_by_user?: {
    id: string;
    full_name: string;
  };
  assignee?: {
    id: string;
    full_name: string;
  };
  vendor?: {
    id: string;
    name: string;
  };
  status_history?: Array<{
    id: string;
    status: string;
    changed_at: string;
    changed_by: {
      id: string;
      full_name: string;
    };
    notes?: string | null;
  }>;
}

interface TicketFilters {
  status?: string;
  priority?: string;
  category_id?: string;
  location_id?: string;
  assignee_id?: string;
  page?: number;
  pageSize?: number;
  is_emergency?: boolean;
  search?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateTicketData {
  title: string;
  description: string;
  category_id: string;
  priority: string;
  location_id: string;
  asset_id?: string | null;
  is_emergency?: boolean;
}

interface UpdateTicketData {
  title?: string;
  description?: string;
  priority?: string;
}

interface StatusActionData {
  action: string;
  reason?: string;
  notes?: string;
  cost?: number;
  new_status?: string;
}

interface AssignmentData {
  assignee_id?: string;
  vendor_id?: string;
}

interface CommentData {
  comment: string;
  is_internal: boolean;
}

interface AttachmentData {
  file: File;
  attachment_type: "photo" | "invoice" | "quote" | "other";
}

// Query Keys
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (filters?: TicketFilters) => [...ticketKeys.lists(), filters] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  comments: (id: string) => [...ticketKeys.detail(id), "comments"] as const,
  attachments: (id: string) =>
    [...ticketKeys.detail(id), "attachments"] as const,
};

// Cache settings for React Query
const STALE_TIME = 30000; // Data fresh for 30 seconds
const GC_TIME = 300000; // Keep in cache for 5 minutes

// Queries
export function useTickets(filters?: TicketFilters) {
  return useQuery({
    queryKey: ticketKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.category_id)
        params.append("category_id", filters.category_id);
      if (filters?.location_id)
        params.append("location_id", filters.location_id);
      if (filters?.assignee_id)
        params.append("assignee_id", filters.assignee_id);
      if (filters?.page) params.append("page", filters.page.toString());
      if (filters?.pageSize)
        params.append("pageSize", filters.pageSize.toString());
      if (filters?.is_emergency !== undefined)
        params.append("is_emergency", filters.is_emergency.toString());
      if (filters?.search) params.append("search", filters.search);

      const response = await api.get<PaginatedResponse<Ticket>>(
        `/api/tickets?${params.toString()}`,
      );
      return response;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ ticket: Ticket }>(`/api/tickets/${id}`);
      return response.ticket;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useTicketComments(id: string, includeInternal = false) {
  return useQuery({
    queryKey: [...ticketKeys.comments(id), includeInternal],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (includeInternal) params.append("include_internal", "true");

      const response = await api.get<{
        comments: Database["public"]["Tables"]["ticket_comments"]["Row"][];
      }>(`/api/tickets/${id}/comments?${params.toString()}`);
      return response.comments;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

export function useTicketAttachments(id: string) {
  return useQuery({
    queryKey: ticketKeys.attachments(id),
    queryFn: async () => {
      const response = await api.get<{
        attachments: Database["public"]["Tables"]["ticket_attachments"]["Row"][];
      }>(`/api/tickets/${id}/attachments`);
      return response.attachments;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// Mutations
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTicketData) => {
      const response = await api.post<{ ticket: Ticket }>("/api/tickets", data);
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useUpdateTicket(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTicketData) => {
      const response = await api.patch<{ ticket: Ticket }>(
        `/api/tickets/${id}`,
        data,
      );
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useTicketStatusAction(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StatusActionData) => {
      const response = await api.patch<{ ticket: Ticket }>(
        `/api/tickets/${id}/status`,
        data,
      );
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAssignTicket(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignmentData) => {
      const response = await api.post<{ ticket: Ticket }>(
        `/api/tickets/${id}/assign`,
        data,
      );
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
}

export function useAddComment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CommentData) => {
      const response = await api.post(`/api/tickets/${id}/comments`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(id) });
    },
  });
}

export function useUploadAttachment(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AttachmentData) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("attachment_type", data.attachment_type);

      const response = await api.upload(
        `/api/tickets/${id}/attachments`,
        formData,
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.attachments(id) });
    },
  });
}

export function useDeleteAttachment(ticketId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(
        `/api/tickets/${ticketId}/attachments?attachment_id=${attachmentId}`,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ticketKeys.attachments(ticketId),
      });
    },
  });
}

export function useCheckDuplicates() {
  return useMutation({
    mutationFn: async (data: {
      location_id: string;
      asset_id: string | null;
      title: string;
    }) => {
      const response = await api.post<{
        has_duplicates: boolean;
        duplicates: Ticket[];
      }>("/api/tickets/check-duplicate", data);
      return response;
    },
  });
}

// ============================================================
// EMERGENCY TICKET HOOKS
// ============================================================

export interface EmergencyStats {
  active: number;
  resolved_30_days: number;
  total_30_days: number;
}

export interface CreateEmergencyData {
  title: string;
  description: string;
  location_id: string;
  priority?: "high" | "critical";
}

// Query keys for emergencies
export const emergencyKeys = {
  all: ["emergencies"] as const,
  stats: () => [...emergencyKeys.all, "stats"] as const,
  active: () => [...emergencyKeys.all, "active"] as const,
};

/**
 * Get emergency statistics for dashboard
 */
export function useEmergencyStats() {
  return useQuery({
    queryKey: emergencyKeys.stats(),
    queryFn: async () => {
      const response = await api.get<{ stats: EmergencyStats }>(
        "/api/tickets/emergencies/stats",
      );
      return response.stats;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Get active emergencies (tickets with is_emergency=true and not closed)
 */
export function useActiveEmergencies() {
  return useQuery({
    queryKey: emergencyKeys.active(),
    queryFn: async () => {
      const response = await api.get<{ tickets: Ticket[] }>(
        "/api/tickets/emergencies/active",
      );
      return response.tickets;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Create an emergency ticket
 */
export function useCreateEmergency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmergencyData) => {
      const response = await api.post<{ ticket: Ticket }>("/api/tickets", {
        ...data,
        is_emergency: true,
        priority: data.priority ?? "critical",
      });
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
}

/**
 * Contain an emergency (mark as contained/in_progress)
 */
export function useContainEmergency(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.patch<{ ticket: Ticket }>(
        `/api/tickets/${id}/status`,
        { action: "contain" },
      );
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
}

/**
 * Resolve an emergency (mark as resolved/closed)
 */
export function useResolveEmergency(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resolutionNotes: string) => {
      const response = await api.patch<{ ticket: Ticket }>(
        `/api/tickets/${id}/status`,
        { action: "resolve", notes: resolutionNotes },
      );
      return response.ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all });
    },
  });
}
