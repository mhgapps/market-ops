import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type { Database } from "@/types/database";
import type {
  BudgetWithSpend,
  BudgetSummaryEnriched,
  BudgetForecast,
  AlertSummary,
  AlertLevel,
} from "@/services/budget.service";
import type { SpendByCategory, SpendByMonth } from "@/dao/budget.dao";

// Types
type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

export interface Budget extends BudgetRow {
  location?: {
    id: string;
    name: string;
  } | null;
}

// Types for YoY comparison data
export interface YoYCategoryData {
  category: string;
  current_year_spent: number;
  previous_year_spent: number;
  change_percentage: number;
  change_amount: number;
}

export interface YoYComparisonData {
  current_year: number;
  previous_year: number;
  categories: YoYCategoryData[];
  total_current: number;
  total_previous: number;
  total_change_percentage: number;
}

// Types for location utilization
export interface LocationUtilization {
  location_id: string;
  location_name: string;
  budget: number;
  spent: number;
  utilization_percentage: number;
  alert_level: AlertLevel;
}

// Types for monthly trend
export interface MonthlyTrendData extends SpendByMonth {
  month_name: string;
  cumulative_spend: number;
  budget_pace: number;
}

// Filter types
export interface BudgetFilters {
  fiscal_year?: number;
  location_id?: string;
  category?: string;
  alert_level?: AlertLevel | "all";
  with_spend?: boolean;
}

export interface BudgetChartFilters {
  fiscal_year?: number;
  location_id?: string;
}

// Create/Update types
export interface CreateBudgetData {
  location_id?: string | null;
  category: string;
  fiscal_year: number;
  annual_budget: number;
  notes?: string | null;
}

export interface UpdateBudgetData {
  location_id?: string | null;
  category?: string;
  fiscal_year?: number;
  annual_budget?: number;
  notes?: string | null;
}

// Query Keys
export const budgetKeys = {
  all: ["budgets"] as const,
  lists: () => [...budgetKeys.all, "list"] as const,
  list: (filters?: BudgetFilters) => [...budgetKeys.lists(), filters] as const,
  details: () => [...budgetKeys.all, "detail"] as const,
  detail: (id: string) => [...budgetKeys.details(), id] as const,
  summary: (fiscalYear?: number) =>
    [...budgetKeys.all, "summary", fiscalYear] as const,
  charts: () => [...budgetKeys.all, "charts"] as const,
  categorySpend: (filters?: BudgetChartFilters) =>
    [...budgetKeys.charts(), "category", filters] as const,
  locationSpend: (fiscalYear?: number) =>
    [...budgetKeys.charts(), "location", fiscalYear] as const,
  monthlyTrend: (filters?: BudgetChartFilters) =>
    [...budgetKeys.charts(), "trend", filters] as const,
  yoyComparison: (filters?: BudgetChartFilters) =>
    [...budgetKeys.charts(), "yoy", filters] as const,
  forecasts: (fiscalYear?: number) =>
    [...budgetKeys.all, "forecasts", fiscalYear] as const,
  alerts: (fiscalYear?: number) =>
    [...budgetKeys.all, "alerts", fiscalYear] as const,
};

// Cache settings
const STALE_TIME = 60000; // Data fresh for 1 minute (budgets change less frequently)
const GC_TIME = 300000; // Keep in cache for 5 minutes

// ============================================================
// QUERIES
// ============================================================

/**
 * Fetch budgets list with optional filters
 * Use with_spend=true to get calculated spend data
 */
export function useBudgets(filters?: BudgetFilters) {
  return useQuery({
    queryKey: budgetKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fiscal_year)
        params.append("fiscal_year", filters.fiscal_year.toString());
      if (filters?.location_id)
        params.append("location_id", filters.location_id);
      if (filters?.category) params.append("category", filters.category);
      if (filters?.alert_level)
        params.append("alert_level", filters.alert_level);
      if (filters?.with_spend) params.append("with_spend", "true");

      const response = await api.get<{ budgets: BudgetWithSpend[] }>(
        `/api/budgets?${params.toString()}`,
      );
      return response.budgets;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch single budget by ID
 */
export function useBudget(id: string, withSpend = false) {
  return useQuery({
    queryKey: budgetKeys.detail(id),
    queryFn: async () => {
      const params = withSpend ? "?with_spend=true" : "";
      const response = await api.get<{ budget: BudgetWithSpend }>(
        `/api/budgets/${id}${params}`,
      );
      return response.budget;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch budget summary stats (totals, utilization, alerts count)
 */
export function useBudgetSummary(fiscalYear?: number) {
  return useQuery({
    queryKey: budgetKeys.summary(fiscalYear),
    queryFn: async () => {
      const params = fiscalYear ? `?fiscal_year=${fiscalYear}` : "";
      const response = await api.get<{ summary: BudgetSummaryEnriched }>(
        `/api/budgets/summary${params}`,
      );
      return response.summary;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch spend by category for pie chart
 */
export function useCategorySpend(filters?: BudgetChartFilters) {
  return useQuery({
    queryKey: budgetKeys.categorySpend(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fiscal_year)
        params.append("fiscal_year", filters.fiscal_year.toString());
      if (filters?.location_id)
        params.append("location_id", filters.location_id);

      const response = await api.get<{ data: SpendByCategory[] }>(
        `/api/budgets/charts/category?${params.toString()}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch utilization by location for bar chart
 */
export function useLocationSpend(fiscalYear?: number) {
  return useQuery({
    queryKey: budgetKeys.locationSpend(fiscalYear),
    queryFn: async () => {
      const params = fiscalYear ? `?fiscal_year=${fiscalYear}` : "";
      const response = await api.get<{ data: LocationUtilization[] }>(
        `/api/budgets/charts/location${params}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch monthly spend trend for line chart
 */
export function useMonthlyTrend(filters?: BudgetChartFilters) {
  return useQuery({
    queryKey: budgetKeys.monthlyTrend(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fiscal_year)
        params.append("fiscal_year", filters.fiscal_year.toString());
      if (filters?.location_id)
        params.append("location_id", filters.location_id);

      const response = await api.get<{ data: MonthlyTrendData[] }>(
        `/api/budgets/charts/trend?${params.toString()}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch year-over-year comparison data
 */
export function useYoYComparison(filters?: BudgetChartFilters) {
  return useQuery({
    queryKey: budgetKeys.yoyComparison(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fiscal_year)
        params.append("fiscal_year", filters.fiscal_year.toString());
      if (filters?.location_id)
        params.append("location_id", filters.location_id);

      const response = await api.get<{ data: YoYComparisonData }>(
        `/api/budgets/charts/yoy?${params.toString()}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch budget forecasts for the year
 */
export function useBudgetForecasts(fiscalYear?: number) {
  return useQuery({
    queryKey: budgetKeys.forecasts(fiscalYear),
    queryFn: async () => {
      const params = fiscalYear ? `?fiscal_year=${fiscalYear}` : "";
      const response = await api.get<{ data: BudgetForecast[] }>(
        `/api/budgets/forecasts${params}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

/**
 * Fetch alert summary (budgets at 80/90/100%+ thresholds)
 */
export function useBudgetAlerts(fiscalYear?: number) {
  return useQuery({
    queryKey: budgetKeys.alerts(fiscalYear),
    queryFn: async () => {
      const params = fiscalYear ? `?fiscal_year=${fiscalYear}` : "";
      const response = await api.get<{ data: AlertSummary }>(
        `/api/budgets/alerts${params}`,
      );
      return response.data;
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  });
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Create a new budget
 */
export function useCreateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      const response = await api.post<{ budget: Budget }>("/api/budgets", data);
      return response.budget;
    },
    onSuccess: () => {
      // Invalidate all budget queries to refresh the data
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

/**
 * Update an existing budget
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBudgetData;
    }) => {
      const response = await api.patch<{ budget: Budget }>(
        `/api/budgets/${id}`,
        data,
      );
      return response.budget;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific budget and lists
      queryClient.invalidateQueries({
        queryKey: budgetKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: budgetKeys.summary() });
    },
  });
}

/**
 * Delete a budget
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/budgets/${id}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate all budget queries
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
}

// ============================================================
// UTILITY HOOKS
// ============================================================

/**
 * Get current fiscal year (calendar year)
 */
export function useCurrentFiscalYear(): number {
  return new Date().getFullYear();
}

/**
 * Get available fiscal years for dropdown (current ± 2 years)
 */
export function useFiscalYearOptions(): number[] {
  const currentYear = useCurrentFiscalYear();
  return [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];
}
