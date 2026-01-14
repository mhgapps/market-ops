import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api-client';

// Types
interface ComplianceDocument {
  id: string;
  name: string;
  document_type_id: string | null;
  document_type_name?: string | null;
  location_id: string | null;
  location_name?: string | null;
  location_ids: string[] | null;
  issue_date: string | null;
  expiration_date: string;
  issuing_authority: string | null;
  document_number: string | null;
  file_path: string | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'conditional' | 'failed_inspection' | 'suspended';
  is_conditional: boolean | null;
  conditional_requirements: string | null;
  conditional_deadline: string | null;
  failed_inspection_date: string | null;
  corrective_action_required: string | null;
  reinspection_date: string | null;
  renewal_submitted_date: string | null;
  renewal_cost: number | null;
  renewal_assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ComplianceDocumentType {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  default_alert_days: number[] | null;
  renewal_checklist: Record<string, unknown> | null;
  is_location_specific: boolean | null;
}

interface ComplianceStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  conditional: number;
  failed_inspection: number;
}

interface ComplianceCalendarItem {
  id: string;
  name: string;
  status: string;
  expiration_date: string;
  document_type_id: string | null;
}

interface CreateComplianceDocInput {
  name: string;
  document_type_id?: string | null;
  location_id?: string | null;
  location_ids?: string[] | null;
  issue_date?: string | null;
  expiration_date: string;
  issuing_authority?: string | null;
  document_number?: string | null;
  file_path?: string | null;
  renewal_cost?: number | null;
  renewal_assigned_to?: string | null;
  notes?: string | null;
}

interface UpdateComplianceDocInput {
  name?: string;
  document_type_id?: string | null;
  location_id?: string | null;
  location_ids?: string[] | null;
  issue_date?: string | null;
  expiration_date?: string;
  issuing_authority?: string | null;
  document_number?: string | null;
  file_path?: string | null;
  status?: string;
  renewal_cost?: number | null;
  renewal_assigned_to?: string | null;
  notes?: string | null;
}

interface ComplianceFilters {
  location_id?: string;
  document_type_id?: string;
  status?: string;
  search?: string;
}

// Query keys
export const complianceKeys = {
  all: ['compliance'] as const,
  lists: () => [...complianceKeys.all, 'list'] as const,
  list: (filters?: ComplianceFilters) => [...complianceKeys.lists(), filters] as const,
  details: () => [...complianceKeys.all, 'detail'] as const,
  detail: (id: string) => [...complianceKeys.details(), id] as const,
  stats: () => [...complianceKeys.all, 'stats'] as const,
  calendar: (month: number, year: number) => [...complianceKeys.all, 'calendar', month, year] as const,
  expiring: (days: number) => [...complianceKeys.all, 'expiring', days] as const,
  types: () => [...complianceKeys.all, 'types'] as const,
};

// Hooks

export function useComplianceDocuments(filters?: ComplianceFilters) {
  return useQuery({
    queryKey: complianceKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.location_id) params.set('location_id', filters.location_id);
      if (filters?.document_type_id) params.set('document_type_id', filters.document_type_id);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);

      const response = await api.get<{ documents: ComplianceDocument[] }>(
        `/api/compliance?${params.toString()}`
      );
      return response.documents;
    },
  });
}

export function useComplianceDocument(id: string) {
  return useQuery({
    queryKey: complianceKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ document: ComplianceDocument }>(
        `/api/compliance/${id}`
      );
      return response.document;
    },
    enabled: !!id,
  });
}

export function useComplianceStats() {
  return useQuery({
    queryKey: complianceKeys.stats(),
    queryFn: async () => {
      const response = await api.get<{ stats: ComplianceStats }>(
        '/api/compliance?stats=true'
      );
      return response.stats;
    },
  });
}

export function useComplianceCalendar(month: number, year: number) {
  return useQuery({
    queryKey: complianceKeys.calendar(month, year),
    queryFn: async () => {
      const response = await api.get<{ calendar: ComplianceCalendarItem[] }>(
        `/api/compliance/calendar?month=${month}&year=${year}`
      );
      return response.calendar;
    },
  });
}

export function useExpiringDocuments(days = 90) {
  return useQuery({
    queryKey: complianceKeys.expiring(days),
    queryFn: async () => {
      const response = await api.get<{ documents: ComplianceDocument[] }>(
        `/api/compliance/expiring?days=${days}`
      );
      return response.documents;
    },
  });
}

export function useComplianceTypes() {
  return useQuery({
    queryKey: complianceKeys.types(),
    queryFn: async () => {
      const response = await api.get<{ types: ComplianceDocumentType[] }>(
        '/api/compliance-types'
      );
      return response.types;
    },
  });
}

export function useCreateComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateComplianceDocInput) => {
      const response = await api.post<{ document: ComplianceDocument }>(
        '/api/compliance',
        data
      );
      return response.document;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useUpdateComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateComplianceDocInput }) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}`,
        data
      );
      return response.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useDeleteComplianceDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/compliance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useMarkAsRenewed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newExpirationDate }: { id: string; newExpirationDate: string }) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}/status`,
        { action: 'renew', new_expiration_date: newExpirationDate }
      );
      return response.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useMarkAsConditional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      requirements,
      deadline,
    }: {
      id: string;
      requirements: string;
      deadline: string;
    }) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}/status`,
        { action: 'conditional', requirements, deadline }
      );
      return response.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useMarkAsFailedInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      correctiveAction,
      reinspectionDate,
    }: {
      id: string;
      correctiveAction: string;
      reinspectionDate: string;
    }) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}/status`,
        { action: 'failed_inspection', corrective_action: correctiveAction, reinspection_date: reinspectionDate }
      );
      return response.document;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useClearConditional() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}/status`,
        { action: 'clear_conditional' }
      );
      return response.document;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}

export function useClearFailedInspection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ document: ComplianceDocument }>(
        `/api/compliance/${id}/status`,
        { action: 'clear_failed_inspection' }
      );
      return response.document;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: complianceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: complianceKeys.stats() });
    },
  });
}
