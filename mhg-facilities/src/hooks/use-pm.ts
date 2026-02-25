import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";

// Types
interface PMCompletion {
  id: string;
  scheduled_date: string;
  completed_date: string | null;
  completed_by: string | null;
}

interface PMSchedule {
  id: string;
  tenant_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  asset_id: string | null;
  asset_name?: string | null;
  location_id: string | null;
  location_name?: string | null;
  frequency:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "semi_annually"
    | "annually";
  day_of_week: number | null;
  day_of_month: number | null;
  month_of_year: number | null;
  assigned_to: string | null;
  assigned_to_name?: string | null;
  vendor_id: string | null;
  vendor_name?: string | null;
  estimated_cost: number | null;
  is_active: boolean;
  next_due_date: string | null;
  last_generated_at: string | null;
  created_at: string;
  updated_at: string;
  completions?: PMCompletion[];
}

interface PMTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  checklist: Record<string, unknown> | null;
  estimated_duration_hours: number | null;
  default_vendor_id: string | null;
}

interface PMStats {
  total: number;
  active: number;
  due_today: number;
  overdue: number;
  completed_this_month: number;
}

interface PMCalendarItem {
  id: string;
  name: string;
  asset_name: string | null;
  location_name: string | null;
  frequency:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "semi_annually"
    | "annually";
  next_due_date: string | null;
}

interface CreatePMScheduleInput {
  template_id?: string | null;
  name: string;
  description?: string | null;
  asset_id?: string | null;
  location_id?: string | null;
  frequency:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "semi_annually"
    | "annually";
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  assigned_to?: string | null;
  vendor_id?: string | null;
  estimated_cost?: number | null;
}

interface UpdatePMScheduleInput {
  template_id?: string | null;
  name?: string;
  description?: string | null;
  asset_id?: string | null;
  location_id?: string | null;
  frequency?:
    | "daily"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "quarterly"
    | "semi_annually"
    | "annually";
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  assigned_to?: string | null;
  vendor_id?: string | null;
  estimated_cost?: number | null;
  is_active?: boolean;
}

interface PMFilters {
  asset_id?: string;
  location_id?: string;
  frequency?: string;
  priority?: "low" | "medium" | "high" | "critical";
  is_active?: boolean;
}

// Query keys
export const pmKeys = {
  all: ["pm"] as const,
  schedules: () => [...pmKeys.all, "schedules"] as const,
  schedule: (filters?: PMFilters) => [...pmKeys.schedules(), filters] as const,
  scheduleDetail: (id: string) => [...pmKeys.schedules(), id] as const,
  stats: () => [...pmKeys.all, "stats"] as const,
  calendar: (month: number, year: number) =>
    [...pmKeys.all, "calendar", month, year] as const,
  due: () => [...pmKeys.all, "due"] as const,
  templates: () => [...pmKeys.all, "templates"] as const,
};

// Hooks

export function usePMSchedules(filters?: PMFilters) {
  return useQuery({
    queryKey: pmKeys.schedule(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.asset_id) params.set("asset_id", filters.asset_id);
      if (filters?.location_id) params.set("location_id", filters.location_id);
      if (filters?.frequency) params.set("frequency", filters.frequency);
      if (filters?.is_active !== undefined)
        params.set("is_active", String(filters.is_active));

      const response = await api.get<{ schedules: PMSchedule[] }>(
        `/api/pm-schedules?${params.toString()}`,
      );
      return response.schedules;
    },
  });
}

export function usePMSchedule(id: string) {
  return useQuery({
    queryKey: pmKeys.scheduleDetail(id),
    queryFn: async () => {
      const response = await api.get<{ schedule: PMSchedule }>(
        `/api/pm-schedules/${id}`,
      );
      return response.schedule;
    },
    enabled: !!id,
  });
}

export function usePMStats() {
  return useQuery({
    queryKey: pmKeys.stats(),
    queryFn: async () => {
      const response = await api.get<{ stats: PMStats }>(
        "/api/pm-schedules?stats=true",
      );
      return response.stats;
    },
  });
}

export function usePMCalendar(month: number, year: number) {
  return useQuery({
    queryKey: pmKeys.calendar(month, year),
    queryFn: async () => {
      const response = await api.get<{ calendar: PMCalendarItem[] }>(
        `/api/pm-schedules/calendar?month=${month}&year=${year}`,
      );
      return response.calendar;
    },
  });
}

export function useDuePMSchedules() {
  return useQuery({
    queryKey: pmKeys.due(),
    queryFn: async () => {
      const response = await api.get<{ schedules: PMSchedule[] }>(
        "/api/pm-schedules/due",
      );
      return response.schedules;
    },
  });
}

export function useCreatePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePMScheduleInput) => {
      const response = await api.post<{ schedule: PMSchedule }>(
        "/api/pm-schedules",
        data,
      );
      return response.schedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useUpdatePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePMScheduleInput;
    }) => {
      const response = await api.patch<{ schedule: PMSchedule }>(
        `/api/pm-schedules/${id}`,
        data,
      );
      return response.schedule;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({
        queryKey: pmKeys.scheduleDetail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useDeletePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/pm-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useActivatePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ schedule: PMSchedule }>(
        `/api/pm-schedules/${id}`,
        { is_active: true },
      );
      return response.schedule;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: pmKeys.scheduleDetail(id) });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useDeactivatePMSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ schedule: PMSchedule }>(
        `/api/pm-schedules/${id}`,
        { is_active: false },
      );
      return response.schedule;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: pmKeys.scheduleDetail(id) });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useMarkPMComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      scheduleId,
      ticketId,
      userId,
      checklistResults,
    }: {
      scheduleId: string;
      ticketId: string;
      userId: string;
      checklistResults?: Record<string, unknown>;
    }) => {
      const response = await api.post<{ completion: unknown }>(
        `/api/pm-schedules/${scheduleId}/complete`,
        {
          ticket_id: ticketId,
          user_id: userId,
          checklist_results: checklistResults,
        },
      );
      return response.completion;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({
        queryKey: pmKeys.scheduleDetail(variables.scheduleId),
      });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

export function useGeneratePMTickets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<{ tickets: unknown[]; count: number }>(
        "/api/pm-schedules/generate",
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pmKeys.schedules() });
      queryClient.invalidateQueries({ queryKey: pmKeys.stats() });
    },
  });
}

// PM Template Hooks

export function usePMTemplates() {
  return useQuery({
    queryKey: ["pm-templates"],
    queryFn: async () => {
      const response = await api.get<{ templates: PMTemplate[] }>(
        "/api/pm-templates",
      );
      return response.templates;
    },
  });
}

export function usePMTemplate(id: string | null) {
  return useQuery({
    queryKey: ["pm-templates", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await api.get<{ template: PMTemplate }>(
        `/api/pm-templates/${id}`,
      );
      return response.template;
    },
    enabled: !!id,
  });
}

export function useCreatePMTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PMTemplate>) => {
      const response = await api.post<{ template: PMTemplate }>(
        "/api/pm-templates",
        data,
      );
      return response.template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
    },
  });
}

export function useUpdatePMTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<PMTemplate>;
    }) => {
      const response = await api.patch<{ template: PMTemplate }>(
        `/api/pm-templates/${id}`,
        data,
      );
      return response.template;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
      queryClient.invalidateQueries({
        queryKey: ["pm-templates", variables.id],
      });
    },
  });
}

export function useDeletePMTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/pm-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pm-templates"] });
    },
  });
}
