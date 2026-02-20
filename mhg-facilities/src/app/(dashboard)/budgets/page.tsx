'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChartSkeleton } from '@/components/ui/chart-skeleton'
import {
  BudgetSummaryCards,
  BudgetAlertsBanner,
  BudgetTable,
  BudgetFilters,
  DeleteBudgetDialog,
} from '@/components/budgets'

// Dynamically import heavy chart components (Recharts ~96KB)
const SpendByCategoryChart = dynamic(
  () => import('@/components/budgets/charts/spend-by-category-chart').then(mod => ({ default: mod.SpendByCategoryChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Spend by Category" variant="pie" />,
  }
)

const LocationUtilizationChart = dynamic(
  () => import('@/components/budgets/charts/location-utilization-chart').then(mod => ({ default: mod.LocationUtilizationChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Utilization by Location" variant="horizontal-bar" />,
  }
)

const MonthlyTrendChart = dynamic(
  () => import('@/components/budgets/charts/monthly-trend-chart').then(mod => ({ default: mod.MonthlyTrendChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Monthly Spend Trend" variant="line" />,
  }
)

const YoYComparisonChart = dynamic(
  () => import('@/components/budgets/charts/yoy-comparison-chart').then(mod => ({ default: mod.YoYComparisonChart })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Year-over-Year Comparison" variant="bar" />,
  }
)
import {
  useBudgets,
  useBudgetSummary,
  useBudgetAlerts,
  useCategorySpend,
  useLocationSpend,
  useMonthlyTrend,
  useYoYComparison,
  useDeleteBudget,
  useCurrentFiscalYear,
  useFiscalYearOptions,
  type BudgetFilters as BudgetFiltersType,
} from '@/hooks/use-budgets'
import { useLocations } from '@/hooks/use-locations'
import type { BudgetWithSpend, AlertLevel } from '@/services/budget.service'

export default function BudgetsPage() {
  const router = useRouter()
  const currentFiscalYear = useCurrentFiscalYear()
  const fiscalYearOptions = useFiscalYearOptions()

  // Filter state
  const [filters, setFilters] = useState<BudgetFiltersType>({
    fiscal_year: currentFiscalYear,
    with_spend: true,
  })

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetWithSpend | null>(null)

  // Data queries
  const { data: budgets, isLoading: budgetsLoading } = useBudgets(filters)
  const { data: summary, isLoading: summaryLoading } = useBudgetSummary(filters.fiscal_year)
  const { data: alerts, isLoading: alertsLoading } = useBudgetAlerts(filters.fiscal_year)
  const { data: categorySpend, isLoading: categoryLoading } = useCategorySpend({
    fiscal_year: filters.fiscal_year,
    location_id: filters.location_id ?? undefined,
  })
  const { data: locationSpend, isLoading: locationLoading } = useLocationSpend(filters.fiscal_year)
  const { data: monthlyTrend, isLoading: trendLoading } = useMonthlyTrend({
    fiscal_year: filters.fiscal_year,
    location_id: filters.location_id ?? undefined,
  })
  const { data: yoyData, isLoading: yoyLoading } = useYoYComparison({
    fiscal_year: filters.fiscal_year,
    location_id: filters.location_id ?? undefined,
  })

  // Locations for filter
  const { data: locationsData } = useLocations()
  const locations = (locationsData || []).map(loc => ({ id: loc.id, name: loc.name }))

  // Mutations
  const deleteBudget = useDeleteBudget()

  const handleFiscalYearChange = (year: number) => {
    setFilters((prev) => ({ ...prev, fiscal_year: year }))
  }

  const handleLocationChange = (locationId: string | undefined) => {
    setFilters((prev) => ({ ...prev, location_id: locationId }))
  }

  const handleAlertLevelChange = (level: AlertLevel | 'all') => {
    setFilters((prev) => ({ ...prev, alert_level: level }))
  }

  const handleClearFilters = () => {
    setFilters({
      fiscal_year: currentFiscalYear,
      with_spend: true,
    })
  }

  const handleDeleteClick = (budget: BudgetWithSpend) => {
    setBudgetToDelete(budget)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return

    try {
      await deleteBudget.mutateAsync(budgetToDelete.id)
      toast.success('Budget deleted', {
        description: `The budget for ${budgetToDelete.category} has been deleted.`,
      })
      setDeleteDialogOpen(false)
      setBudgetToDelete(null)
    } catch {
      toast.error('Error', {
        description: 'Failed to delete the budget. Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Budgets</h1>
        <Button
          className="w-full md:w-auto"
          onClick={() => router.push('/budgets/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Budget
        </Button>
      </div>

      {/* Alerts Banner */}
      <BudgetAlertsBanner
        alerts={alerts}
        isLoading={alertsLoading}
        onViewDetails={() => setFilters((prev) => ({ ...prev, alert_level: 'over' }))}
      />

      {/* Summary Cards */}
      <BudgetSummaryCards summary={summary} isLoading={summaryLoading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SpendByCategoryChart
          data={categorySpend}
          isLoading={categoryLoading}
        />
        <LocationUtilizationChart
          data={locationSpend}
          isLoading={locationLoading}
        />
        <MonthlyTrendChart
          data={monthlyTrend}
          isLoading={trendLoading}
          totalBudget={summary?.total_budget}
        />
        <YoYComparisonChart
          data={yoyData}
          isLoading={yoyLoading}
        />
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Budget Items</CardTitle>
            <BudgetFilters
              fiscalYear={filters.fiscal_year || currentFiscalYear}
              fiscalYearOptions={fiscalYearOptions}
              onFiscalYearChange={handleFiscalYearChange}
              locationId={filters.location_id}
              locations={locations}
              onLocationChange={handleLocationChange}
              alertLevel={filters.alert_level}
              onAlertLevelChange={handleAlertLevelChange}
              onClearFilters={handleClearFilters}
            />
          </div>
        </CardHeader>
        <CardContent>
          <BudgetTable
            budgets={budgets}
            isLoading={budgetsLoading}
            onDelete={handleDeleteClick}
          />
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteBudgetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        budgetCategory={budgetToDelete?.category ?? undefined}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteBudget.isPending}
      />
    </div>
  )
}
