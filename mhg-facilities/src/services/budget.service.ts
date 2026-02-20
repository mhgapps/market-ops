import { BudgetDAO } from '@/dao/budget.dao'
import type { Database } from '@/types/database-extensions'

type Budget = Database['public']['Tables']['budgets']['Row']

// ============================================================
// TYPES
// ============================================================

export interface CreateBudgetInput {
  location_id?: string | null
  category?: string | null
  fiscal_year: number
  annual_budget: number
  notes?: string | null
}

export interface UpdateBudgetInput {
  location_id?: string | null
  category?: string | null
  fiscal_year?: number
  annual_budget?: number
  notes?: string | null
}

export type AlertLevel = 'none' | 'warning' | 'danger' | 'over'

export interface BudgetWithSpend extends Budget {
  calculated_spent: number
  remaining: number
  utilization_percentage: number
  alert_level: AlertLevel
  location?: {
    id: string
    name: string
  } | null
}

export interface BudgetSummaryEnriched {
  total_budget: number
  total_spent: number
  total_remaining: number
  utilization_percentage: number
  alert_level: AlertLevel
  budget_count: number
  over_budget_count: number
  warning_count: number   // 80-90%
  danger_count: number    // 90-100%
}

export interface CategorySpend {
  category: string
  spent: number
  budget: number
  percentage: number
}

export interface LocationSpend {
  location_id: string
  location_name: string
  spent: number
  budget: number
  percentage: number
}

export interface MonthlyTrend {
  month: string  // 'Jan', 'Feb', etc.
  month_number: number
  spent: number
  cumulative_spent: number
}

export interface YoYComparison {
  category: string
  current_year_spent: number
  previous_year_spent: number
  change_percentage: number
  change_amount: number
}

export interface BudgetForecast {
  budget_id: string
  category: string | null
  location_name: string | null
  annual_budget: number
  current_spent: number
  monthly_average: number
  projected_year_end: number
  will_exceed: boolean
  projected_excess: number
  confidence: 'low' | 'medium' | 'high'
}

export interface AlertSummary {
  over_budget: BudgetWithSpend[]
  danger: BudgetWithSpend[]
  warning: BudgetWithSpend[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * Budget Service - Business logic for budget management
 *
 * KEY DESIGN: Spend is calculated dynamically from ticket actual_cost,
 * NOT stored in the database. This ensures accuracy without sync issues.
 */
export class BudgetService {
  constructor(private budgetDAO = new BudgetDAO()) {}

  // ============================================================
  // HELPER METHODS
  // ============================================================

  /**
   * Get alert level based on utilization percentage
   */
  private getAlertLevel(utilization: number): AlertLevel {
    if (utilization >= 100) return 'over'
    if (utilization >= 90) return 'danger'
    if (utilization >= 80) return 'warning'
    return 'none'
  }

  /**
   * Get current fiscal year (Calendar Year: Jan-Dec)
   */
  getCurrentFiscalYear(): number {
    return new Date().getFullYear()
  }

  /**
   * Get current month (1-12)
   */
  private getCurrentMonth(): number {
    return new Date().getMonth() + 1
  }

  // ============================================================
  // BASIC CRUD OPERATIONS
  // ============================================================

  /**
   * Get all budgets for the current tenant
   */
  async getAllBudgets(): Promise<Budget[]> {
    return this.budgetDAO.findAll()
  }

  /**
   * Get budget by ID (raw, without calculated spend)
   */
  async getBudgetById(id: string): Promise<Budget | null> {
    return this.budgetDAO.findById(id)
  }

  /**
   * Get budgets by fiscal year (raw, without calculated spend)
   */
  async getBudgetsByFiscalYear(fiscalYear: number): Promise<Budget[]> {
    return this.budgetDAO.findByFiscalYear(fiscalYear)
  }

  /**
   * Get budgets by location
   */
  async getBudgetsByLocation(locationId: string): Promise<Budget[]> {
    return this.budgetDAO.findByLocation(locationId)
  }

  /**
   * Create new budget
   */
  async createBudget(data: CreateBudgetInput): Promise<Budget> {
    // Check if budget already exists for this location/category/year
    const existing = await this.budgetDAO.findByLocationCategoryYear(
      data.location_id || null,
      data.category || 'total',
      data.fiscal_year
    )

    if (existing) {
      throw new Error(
        `Budget already exists for ${data.category || 'total'} in fiscal year ${data.fiscal_year}`
      )
    }

    return this.budgetDAO.create({
      location_id: data.location_id || null,
      category: data.category || 'total',
      fiscal_year: data.fiscal_year,
      annual_budget: data.annual_budget,
      spent_amount: 0, // Always start at 0, actual spend is calculated dynamically
      notes: data.notes || null,
    })
  }

  /**
   * Update budget
   */
  async updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    const existing = await this.budgetDAO.findById(id)
    if (!existing) {
      throw new Error('Budget not found')
    }

    // Don't allow updating spent_amount through this method
    // Spend is calculated dynamically from tickets
    return this.budgetDAO.update(id, {
      location_id: data.location_id,
      category: data.category,
      fiscal_year: data.fiscal_year,
      annual_budget: data.annual_budget,
      notes: data.notes,
    })
  }

  /**
   * Delete budget (soft delete)
   */
  async deleteBudget(id: string): Promise<void> {
    const existing = await this.budgetDAO.findById(id)
    if (!existing) {
      throw new Error('Budget not found')
    }

    await this.budgetDAO.softDelete(id)
  }

  // ============================================================
  // ENRICHED BUDGET QUERIES (with calculated spend)
  // ============================================================

  /**
   * Get single budget with calculated spend
   */
  async getBudgetWithSpend(id: string): Promise<BudgetWithSpend | null> {
    const budget = await this.budgetDAO.findById(id)
    if (!budget) return null

    const calculated_spent = await this.budgetDAO.calculateSpendForBudget(
      budget.location_id,
      budget.category,
      budget.fiscal_year
    )

    const annual = Number(budget.annual_budget)
    const remaining = annual - calculated_spent
    const utilization_percentage = annual > 0 ? Math.round((calculated_spent / annual) * 100) : 0

    return {
      ...budget,
      calculated_spent,
      remaining,
      utilization_percentage,
      alert_level: this.getAlertLevel(utilization_percentage),
    }
  }

  /**
   * Get budgets by fiscal year with calculated spend
   */
  async getBudgetsByFiscalYearWithSpend(fiscalYear: number): Promise<BudgetWithSpend[]> {
    const budgets = await this.budgetDAO.findByFiscalYearWithLocation(fiscalYear)

    // Calculate spend for each budget in parallel
    const enrichedBudgets = await Promise.all(
      budgets.map(async (budget) => {
        const calculated_spent = await this.budgetDAO.calculateSpendForBudget(
          budget.location_id,
          budget.category,
          budget.fiscal_year
        )

        const annual = Number(budget.annual_budget)
        const remaining = annual - calculated_spent
        const utilization_percentage = annual > 0 ? Math.round((calculated_spent / annual) * 100) : 0

        return {
          ...budget,
          calculated_spent,
          remaining,
          utilization_percentage,
          alert_level: this.getAlertLevel(utilization_percentage),
        } as BudgetWithSpend
      })
    )

    return enrichedBudgets
  }

  /**
   * Get enriched budget summary for fiscal year
   */
  async getBudgetSummaryEnriched(fiscalYear: number): Promise<BudgetSummaryEnriched> {
    const budgets = await this.getBudgetsByFiscalYearWithSpend(fiscalYear)

    const total_budget = budgets.reduce((sum, b) => sum + Number(b.annual_budget), 0)
    const total_spent = budgets.reduce((sum, b) => sum + b.calculated_spent, 0)
    const total_remaining = total_budget - total_spent
    const utilization_percentage = total_budget > 0
      ? Math.round((total_spent / total_budget) * 100)
      : 0

    return {
      total_budget,
      total_spent,
      total_remaining,
      utilization_percentage,
      alert_level: this.getAlertLevel(utilization_percentage),
      budget_count: budgets.length,
      over_budget_count: budgets.filter(b => b.alert_level === 'over').length,
      warning_count: budgets.filter(b => b.alert_level === 'warning').length,
      danger_count: budgets.filter(b => b.alert_level === 'danger').length,
    }
  }

  // ============================================================
  // CHART DATA METHODS
  // ============================================================

  /**
   * Get spend by category for pie chart
   */
  async getSpendByCategory(fiscalYear: number, locationId?: string): Promise<CategorySpend[]> {
    // Get raw spend by category from tickets
    const spendData = await this.budgetDAO.getSpendByCategory(fiscalYear, locationId)

    // Get budgets to find budget amounts per category
    const budgets = await this.budgetDAO.findByFiscalYear(fiscalYear)

    // Build category spend with budget info
    return spendData.map(({ category_name, spent }) => {
      // Find matching budget (by category name)
      const matchingBudget = budgets.find(b =>
        b.category?.toLowerCase() === category_name.toLowerCase() &&
        (!locationId || b.location_id === locationId)
      )

      const budget = matchingBudget ? Number(matchingBudget.annual_budget) : 0

      return {
        category: category_name,
        spent,
        budget,
        percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      }
    })
  }

  /**
   * Get budget utilization by location for bar chart
   */
  async getUtilizationByLocation(fiscalYear: number): Promise<LocationSpend[]> {
    // Get raw spend by location from tickets
    const spendData = await this.budgetDAO.getSpendByLocation(fiscalYear)

    // Get budgets to find budget amounts per location
    const budgets = await this.budgetDAO.findByFiscalYear(fiscalYear)

    // Build location spend with budget info
    return spendData.map(({ location_id, location_name, spent }) => {
      // Sum all budgets for this location (could have multiple categories)
      const locationBudgets = budgets.filter(b => b.location_id === location_id)
      const budget = locationBudgets.reduce((sum, b) => sum + Number(b.annual_budget), 0)

      return {
        location_id,
        location_name,
        spent,
        budget,
        percentage: budget > 0 ? Math.round((spent / budget) * 100) : 0,
      }
    })
  }

  /**
   * Get monthly spend trend for line chart
   */
  async getMonthlySpendTrend(fiscalYear: number, locationId?: string): Promise<MonthlyTrend[]> {
    const monthlyData = await this.budgetDAO.getMonthlySpend(fiscalYear, locationId)

    let cumulative = 0
    return monthlyData.map(({ month, spent }) => {
      cumulative += spent
      return {
        month: MONTH_NAMES[month - 1],
        month_number: month,
        spent,
        cumulative_spent: cumulative,
      }
    })
  }

  /**
   * Get year-over-year comparison with structured response
   */
  async getYoYComparison(currentYear: number): Promise<{
    current_year: number
    previous_year: number
    categories: YoYComparison[]
    total_current: number
    total_previous: number
    total_change_percentage: number
  }> {
    const previousYear = currentYear - 1

    // Get spend by category for both years
    const [currentSpend, previousSpend] = await Promise.all([
      this.budgetDAO.getSpendByCategory(currentYear),
      this.budgetDAO.getSpendByCategory(previousYear),
    ])

    // Build comparison map
    const categorySet = new Set<string>()
    currentSpend.forEach(c => categorySet.add(c.category_name))
    previousSpend.forEach(c => categorySet.add(c.category_name))

    const currentMap = new Map(currentSpend.map(c => [c.category_name, c.spent]))
    const previousMap = new Map(previousSpend.map(c => [c.category_name, c.spent]))

    const categories = Array.from(categorySet).map(category => {
      const current_year_spent = currentMap.get(category) || 0
      const previous_year_spent = previousMap.get(category) || 0
      const change_amount = current_year_spent - previous_year_spent
      const change_percentage = previous_year_spent > 0
        ? Math.round((change_amount / previous_year_spent) * 100)
        : current_year_spent > 0 ? 100 : 0

      return {
        category,
        current_year_spent,
        previous_year_spent,
        change_percentage,
        change_amount,
      }
    }).sort((a, b) => b.current_year_spent - a.current_year_spent)

    // Calculate totals
    const total_current = categories.reduce((sum, c) => sum + c.current_year_spent, 0)
    const total_previous = categories.reduce((sum, c) => sum + c.previous_year_spent, 0)
    const total_change_percentage = total_previous > 0
      ? Math.round(((total_current - total_previous) / total_previous) * 100)
      : total_current > 0 ? 100 : 0

    return {
      current_year: currentYear,
      previous_year: previousYear,
      categories,
      total_current,
      total_previous,
      total_change_percentage,
    }
  }

  // ============================================================
  // FORECASTING METHODS
  // ============================================================

  /**
   * Get forecast for all budgets in fiscal year
   */
  async getForecastsForYear(fiscalYear: number): Promise<BudgetForecast[]> {
    const budgets = await this.getBudgetsByFiscalYearWithSpend(fiscalYear)
    const currentMonth = this.getCurrentMonth()

    // Only forecast for current year
    const isCurrentYear = fiscalYear === this.getCurrentFiscalYear()

    return budgets.map(budget => {
      const monthsElapsed = isCurrentYear ? currentMonth : 12
      const monthly_average = monthsElapsed > 0 ? budget.calculated_spent / monthsElapsed : 0
      const projected_year_end = isCurrentYear ? monthly_average * 12 : budget.calculated_spent
      const will_exceed = projected_year_end > Number(budget.annual_budget)
      const projected_excess = will_exceed ? projected_year_end - Number(budget.annual_budget) : 0

      // Confidence based on months of data
      let confidence: 'low' | 'medium' | 'high' = 'low'
      if (monthsElapsed >= 6) confidence = 'high'
      else if (monthsElapsed >= 3) confidence = 'medium'

      return {
        budget_id: budget.id,
        category: budget.category,
        location_name: budget.location?.name || null,
        annual_budget: Number(budget.annual_budget),
        current_spent: budget.calculated_spent,
        monthly_average: Math.round(monthly_average * 100) / 100,
        projected_year_end: Math.round(projected_year_end * 100) / 100,
        will_exceed,
        projected_excess: Math.round(projected_excess * 100) / 100,
        confidence,
      }
    })
  }

  /**
   * Get forecast for a single budget
   */
  async getBudgetForecast(budgetId: string): Promise<BudgetForecast | null> {
    const budget = await this.getBudgetWithSpend(budgetId)
    if (!budget) return null

    const currentMonth = this.getCurrentMonth()
    const isCurrentYear = budget.fiscal_year === this.getCurrentFiscalYear()

    const monthsElapsed = isCurrentYear ? currentMonth : 12
    const monthly_average = monthsElapsed > 0 ? budget.calculated_spent / monthsElapsed : 0
    const projected_year_end = isCurrentYear ? monthly_average * 12 : budget.calculated_spent
    const will_exceed = projected_year_end > Number(budget.annual_budget)
    const projected_excess = will_exceed ? projected_year_end - Number(budget.annual_budget) : 0

    let confidence: 'low' | 'medium' | 'high' = 'low'
    if (monthsElapsed >= 6) confidence = 'high'
    else if (monthsElapsed >= 3) confidence = 'medium'

    return {
      budget_id: budget.id,
      category: budget.category,
      location_name: budget.location?.name || null,
      annual_budget: Number(budget.annual_budget),
      current_spent: budget.calculated_spent,
      monthly_average: Math.round(monthly_average * 100) / 100,
      projected_year_end: Math.round(projected_year_end * 100) / 100,
      will_exceed,
      projected_excess: Math.round(projected_excess * 100) / 100,
      confidence,
    }
  }

  // ============================================================
  // ALERT METHODS
  // ============================================================

  /**
   * Get budgets at specific threshold levels
   */
  async getBudgetsAtThreshold(
    fiscalYear: number,
    threshold: 'warning' | 'danger' | 'over'
  ): Promise<BudgetWithSpend[]> {
    const budgets = await this.getBudgetsByFiscalYearWithSpend(fiscalYear)
    return budgets.filter(b => b.alert_level === threshold)
  }

  /**
   * Get alert summary for dashboard
   */
  async getAlertSummary(fiscalYear: number): Promise<{
    over_budget: BudgetWithSpend[]
    danger: BudgetWithSpend[]
    warning: BudgetWithSpend[]
  }> {
    const budgets = await this.getBudgetsByFiscalYearWithSpend(fiscalYear)

    return {
      over_budget: budgets.filter(b => b.alert_level === 'over'),
      danger: budgets.filter(b => b.alert_level === 'danger'),
      warning: budgets.filter(b => b.alert_level === 'warning'),
    }
  }

  /**
   * Get budgets for current fiscal year (with spend)
   */
  async getCurrentFiscalYearBudgetsWithSpend(): Promise<BudgetWithSpend[]> {
    const currentFY = this.getCurrentFiscalYear()
    return this.getBudgetsByFiscalYearWithSpend(currentFY)
  }

  /**
   * Get all ticket categories (for dropdown/autocomplete)
   */
  async getAvailableCategories(fiscalYear?: number): Promise<string[]> {
    const fy = fiscalYear || this.getCurrentFiscalYear()
    return this.budgetDAO.getTicketCategoriesWithSpend(fy)
  }
}
