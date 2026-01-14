import { BudgetDAO } from '@/dao/budget.dao'
import type { Database } from '@/types/database-extensions'

type Budget = Database['public']['Tables']['budgets']['Row']

interface CreateBudgetInput {
  location_id?: string | null
  category?: string | null
  fiscal_year: number
  annual_budget: number
  spent_amount?: number
  notes?: string | null
}

interface UpdateBudgetInput {
  location_id?: string | null
  category?: string | null
  fiscal_year?: number
  annual_budget?: number
  spent_amount?: number
  notes?: string | null
}

interface BudgetSummary {
  total_budget: number
  total_spent: number
  total_remaining: number
  utilization_percentage: number
}

/**
 * Budget Service - Business logic for budget management
 * Handles fiscal year budgets, spending tracking, and budget reporting
 */
export class BudgetService {
  constructor(private budgetDAO = new BudgetDAO()) {}

  /**
   * Get all budgets for the current tenant
   */
  async getAllBudgets(): Promise<Budget[]> {
    return this.budgetDAO.findAll()
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(id: string): Promise<Budget | null> {
    return this.budgetDAO.findById(id)
  }

  /**
   * Get budgets by fiscal year
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
   * Get budget for specific location, category, and fiscal year
   */
  async getBudgetByLocationCategoryYear(
    locationId: string | null,
    category: string,
    fiscalYear: number
  ): Promise<Budget | null> {
    return this.budgetDAO.findByLocationCategoryYear(locationId, category, fiscalYear)
  }

  /**
   * Create new budget
   */
  async createBudget(data: CreateBudgetInput): Promise<Budget> {
    // Check if budget already exists for this location/category/year
    const existing = await this.budgetDAO.findByLocationCategoryYear(
      data.location_id || null,
      data.category || 'general',
      data.fiscal_year
    )

    if (existing) {
      throw new Error(
        `Budget already exists for ${data.category || 'general'} in fiscal year ${data.fiscal_year}`
      )
    }

    return this.budgetDAO.create({
      location_id: data.location_id || null,
      category: data.category || 'general',
      fiscal_year: data.fiscal_year,
      annual_budget: data.annual_budget,
      spent_amount: data.spent_amount || 0,
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

    return this.budgetDAO.update(id, data)
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

  /**
   * Update spent amount
   */
  async updateSpentAmount(id: string, amount: number): Promise<Budget> {
    const existing = await this.budgetDAO.findById(id)
    if (!existing) {
      throw new Error('Budget not found')
    }

    if (amount < 0) {
      throw new Error('Spent amount cannot be negative')
    }

    return this.budgetDAO.updateSpentAmount(id, amount)
  }

  /**
   * Add to spent amount
   */
  async addToSpentAmount(id: string, amount: number): Promise<Budget> {
    const existing = await this.budgetDAO.findById(id)
    if (!existing) {
      throw new Error('Budget not found')
    }

    if (amount < 0) {
      throw new Error('Amount to add cannot be negative')
    }

    const newSpentAmount = (existing.spent_amount || 0) + amount
    return this.budgetDAO.updateSpentAmount(id, newSpentAmount)
  }

  /**
   * Get budget summary for fiscal year
   */
  async getBudgetSummary(fiscalYear: number): Promise<BudgetSummary> {
    const summary = await this.budgetDAO.getBudgetSummary(fiscalYear)

    return {
      ...summary,
      utilization_percentage:
        summary.total_budget > 0
          ? Math.round((summary.total_spent / summary.total_budget) * 100)
          : 0,
    }
  }

  /**
   * Get budget utilization for a specific budget
   */
  async getBudgetUtilization(id: string): Promise<{
    budget: Budget
    utilization_percentage: number
    remaining: number
    over_budget: boolean
  }> {
    const budget = await this.budgetDAO.findById(id)
    if (!budget) {
      throw new Error('Budget not found')
    }

    const spent = budget.spent_amount || 0
    const annual = budget.annual_budget
    const remaining = annual - spent
    const utilizationPercentage = annual > 0 ? Math.round((spent / annual) * 100) : 0

    return {
      budget,
      utilization_percentage: utilizationPercentage,
      remaining,
      over_budget: spent > annual,
    }
  }

  /**
   * Get current fiscal year
   */
  getCurrentFiscalYear(): number {
    const now = new Date()
    const month = now.getMonth() + 1 // 1-12

    // Fiscal year starts in July (month 7)
    // Jan-Jun = previous calendar year is fiscal year
    // Jul-Dec = current calendar year is fiscal year
    return month >= 7 ? now.getFullYear() : now.getFullYear() - 1
  }

  /**
   * Get budgets for current fiscal year
   */
  async getCurrentFiscalYearBudgets(): Promise<Budget[]> {
    const currentFY = this.getCurrentFiscalYear()
    return this.budgetDAO.findByFiscalYear(currentFY)
  }

  /**
   * Get budgets that are over budget
   */
  async getOverBudgetItems(fiscalYear?: number): Promise<Budget[]> {
    const fy = fiscalYear || this.getCurrentFiscalYear()
    const budgets = await this.budgetDAO.findByFiscalYear(fy)

    return budgets.filter((b) => (b.spent_amount || 0) > b.annual_budget)
  }

  /**
   * Get budgets nearing limit (>90% utilized)
   */
  async getNearingLimitBudgets(fiscalYear?: number): Promise<Budget[]> {
    const fy = fiscalYear || this.getCurrentFiscalYear()
    const budgets = await this.budgetDAO.findByFiscalYear(fy)

    return budgets.filter((b) => {
      const spent = b.spent_amount || 0
      const utilizationPercentage = b.annual_budget > 0 ? (spent / b.annual_budget) * 100 : 0
      return utilizationPercentage >= 90 && utilizationPercentage < 100
    })
  }
}
