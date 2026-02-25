import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type {
  OverviewStats,
  TicketStats,
  TrendData,
  StatusCount,
  PriorityCount,
  AssetStats,
  ComplianceStats,
  PMStats,
  ActivityItem,
} from "@/services/dashboard.service";

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  tickets: (days?: number, includeBreakdown?: boolean) =>
    [...dashboardKeys.all, "tickets", days, includeBreakdown] as const,
  assets: (includeBreakdown?: boolean) =>
    [...dashboardKeys.all, "assets", includeBreakdown] as const,
  compliance: (includeBreakdown?: boolean) =>
    [...dashboardKeys.all, "compliance", includeBreakdown] as const,
  pm: (includeOverdue?: boolean) =>
    [...dashboardKeys.all, "pm", includeOverdue] as const,
  activity: (limit?: number) =>
    [...dashboardKeys.all, "activity", limit] as const,
};

// Overview stats
export function useOverviewStats() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      return api.get<OverviewStats>("/api/dashboard/overview");
    },
  });
}

// Ticket stats
export function useTicketStats(
  days: number = 30,
  includeBreakdown: boolean = false,
) {
  return useQuery({
    queryKey: dashboardKeys.tickets(days, includeBreakdown),
    queryFn: async () => {
      const params = new URLSearchParams({
        days: days.toString(),
        breakdown: includeBreakdown.toString(),
      });
      return api.get<{
        stats: TicketStats;
        trend: TrendData[];
        byStatus?: StatusCount[];
        byPriority?: PriorityCount[];
      }>(`/api/dashboard/tickets?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

// Asset stats
export function useAssetStats(includeBreakdown: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.assets(includeBreakdown),
    queryFn: async () => {
      const params = new URLSearchParams({
        breakdown: includeBreakdown.toString(),
      });
      return api.get<{
        stats: AssetStats;
        byStatus?: StatusCount[];
        expiringWarranties?: unknown[];
      }>(`/api/dashboard/assets?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

// Compliance stats
export function useComplianceStats(includeBreakdown: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.compliance(includeBreakdown),
    queryFn: async () => {
      const params = new URLSearchParams({
        breakdown: includeBreakdown.toString(),
      });
      return api.get<{
        stats: ComplianceStats;
        byStatus?: StatusCount[];
        upcomingExpirations?: unknown[];
      }>(`/api/dashboard/compliance?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

// PM stats
export function usePMStats(includeOverdue: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.pm(includeOverdue),
    queryFn: async () => {
      const params = new URLSearchParams({
        include_overdue: includeOverdue.toString(),
      });
      return api.get<{
        stats: PMStats;
        overdue?: unknown[];
      }>(`/api/dashboard/pm?${params.toString()}`);
    },
    staleTime: 30 * 1000,
  });
}

// Activity feed
export function useRecentActivity(limit: number = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });
      return api.get<{ activities: ActivityItem[] }>(
        `/api/dashboard/activity?${params.toString()}`,
      );
    },
  });
}
