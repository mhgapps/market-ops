import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api-client';
import type {
  OverviewStats,
  TicketStats,
  TrendData,
  StatusCount,
  PriorityCount,
  AssetStats,
  ComplianceStats,
  PMStats,
  LocationTicketCount,
  ActivityItem,
} from '@/services/dashboard.service';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  tickets: (days?: number) => [...dashboardKeys.all, 'tickets', days] as const,
  assets: () => [...dashboardKeys.all, 'assets'] as const,
  compliance: () => [...dashboardKeys.all, 'compliance'] as const,
  pm: () => [...dashboardKeys.all, 'pm'] as const,
  activity: (limit?: number) => [...dashboardKeys.all, 'activity', limit] as const,
};

// Overview stats
export function useOverviewStats() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: async () => {
      return api.get<OverviewStats>('/api/dashboard/overview');
    },
  });
}

// Ticket stats
export function useTicketStats(days: number = 30, includeBreakdown: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.tickets(days),
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
  });
}

// Asset stats
export function useAssetStats(includeBreakdown: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.assets(),
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
  });
}

// Compliance stats
export function useComplianceStats(includeBreakdown: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.compliance(),
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
  });
}

// PM stats
export function usePMStats(includeOverdue: boolean = false) {
  return useQuery({
    queryKey: dashboardKeys.pm(),
    queryFn: async () => {
      const params = new URLSearchParams({
        include_overdue: includeOverdue.toString(),
      });
      return api.get<{
        stats: PMStats;
        overdue?: unknown[];
      }>(`/api/dashboard/pm?${params.toString()}`);
    },
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
        `/api/dashboard/activity?${params.toString()}`
      );
    },
  });
}
