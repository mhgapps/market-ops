import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database-extensions'

type Budget = Database['public']['Tables']['budgets']['Row']
type _BudgetInsert = Database['public']['Tables']['budgets']['Insert']
type _BudgetUpdate = Database['public']['Tables']['budgets']['Update']

// Types for spend calculation
export interface SpendByCategory {
  category_name: string
  spent: number
}

export interface SpendByMonth {
  month: number  // 1-12
  year: number
  spent: number
}

export interface SpendByLocation {
  location_id: string
  location_name: string
  spent: number
}

export interface BudgetWithLocation extends Budget {
  location?: {
    id: string
    name: string
  } | null
}

export class BudgetDAO extends BaseDAO<'budgets'> {
  constructor() {
    super('budgets')
  }

  /**
   * Find budgets by fiscal year
   */
  async findByFiscalYear(fiscalYear: number): Promise<Budget[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('fiscal_year', fiscalYear)
      .is('deleted_at', null)
      .order('category', { ascending: true })

    if (error) {
      throw new Error(`Failed to find budgets by fiscal year: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find budgets by location
   */
  async findByLocation(locationId: string): Promise<Budget[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .order('fiscal_year', { ascending: false })

    if (error) {
      throw new Error(`Failed to find budgets by location: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find budget by location, category, and fiscal year
   */
  async findByLocationCategoryYear(
    locationId: string | null,
    category: string,
    fiscalYear: number
  ): Promise<Budget | null> {
    const { supabase, tenantId } = await this.getClient()

    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category', category)
      .eq('fiscal_year', fiscalYear)
      .is('deleted_at', null)

    if (locationId) {
      query = query.eq('location_id', locationId)
    } else {
      query = query.is('location_id', null)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find budget: ${error.message}`)
    }

    return data
  }

  /**
   * Update spent amount
   */
  async updateSpentAmount(id: string, amount: number): Promise<Budget> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        spent_amount: amount,
        updated_at: new Date().toISOString()
      } as never)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update spent amount: ${error.message}`)
    }

    return data
  }

  /**
   * Get budget summary for fiscal year (uses stored spent_amount - legacy)
   * @deprecated Use service layer method that calculates from tickets instead
   */
  async getBudgetSummary(fiscalYear: number): Promise<{
    total_budget: number
    total_spent: number
    total_remaining: number
  }> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('annual_budget, spent_amount')
      .eq('tenant_id', tenantId)
      .eq('fiscal_year', fiscalYear)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to get budget summary: ${error.message}`)
    }

    const budgets = (data || []) as Budget[]
    const total_budget = budgets.reduce((sum, b) => sum + (Number(b.annual_budget) || 0), 0)
    const total_spent = budgets.reduce((sum, b) => sum + (Number(b.spent_amount) || 0), 0)

    return {
      total_budget,
      total_spent,
      total_remaining: total_budget - total_spent,
    }
  }

  /**
   * Find budgets with location data for fiscal year
   */
  async findByFiscalYearWithLocation(fiscalYear: number): Promise<BudgetWithLocation[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        location:locations (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('fiscal_year', fiscalYear)
      .is('deleted_at', null)
      .order('category', { ascending: true })

    if (error) {
      throw new Error(`Failed to find budgets with location: ${error.message}`)
    }

    return (data || []) as BudgetWithLocation[]
  }

  // ============================================================
  // SPEND CALCULATION METHODS (from tickets)
  // ============================================================

  /**
   * Calculate actual spend from completed tickets for a specific budget
   * This queries tickets table to get real spend data
   *
   * @param locationId - Location to filter by (null = tenant-wide, sum all locations)
   * @param category - Category name to filter by (null or 'total' = all categories)
   * @param fiscalYear - Calendar year (Jan 1 - Dec 31)
   */
  async calculateSpendForBudget(
    locationId: string | null,
    category: string | null,
    fiscalYear: number
  ): Promise<number> {
    const { supabase, tenantId } = await this.getClient()

    // Fiscal year is calendar year (Jan 1 - Dec 31)
    const startDate = `${fiscalYear}-01-01T00:00:00Z`
    const endDate = `${fiscalYear + 1}-01-01T00:00:00Z`

    // Build query for completed tickets with actual_cost
    let query = supabase
      .from('tickets')
      .select(`
        actual_cost,
        category:ticket_categories (
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .not('actual_cost', 'is', null)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)
      .is('deleted_at', null)

    // Location filter (null = tenant-wide, sum all locations)
    if (locationId !== null) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to calculate spend: ${error.message}`)
    }

    // Filter by category if specified (and not 'total')
    type TicketWithCategory = {
      actual_cost: number | null
      category: { name: string } | null
    }

    let tickets = (data || []) as TicketWithCategory[]
    if (category && category.toLowerCase() !== 'total') {
      tickets = tickets.filter(t =>
        t.category?.name?.toLowerCase() === category.toLowerCase()
      )
    }

    // Sum actual_cost
    return tickets.reduce((sum, t) => sum + (Number(t.actual_cost) || 0), 0)
  }

  /**
   * Get spend broken down by category for a fiscal year
   * Used for pie charts
   */
  async getSpendByCategory(fiscalYear: number, locationId?: string | null): Promise<SpendByCategory[]> {
    const { supabase, tenantId } = await this.getClient()

    const startDate = `${fiscalYear}-01-01T00:00:00Z`
    const endDate = `${fiscalYear + 1}-01-01T00:00:00Z`

    let query = supabase
      .from('tickets')
      .select(`
        actual_cost,
        category:ticket_categories (
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .not('actual_cost', 'is', null)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)
      .is('deleted_at', null)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get spend by category: ${error.message}`)
    }

    // Aggregate by category
    type TicketWithCategory = {
      actual_cost: number | null
      category: { name: string } | null
    }

    const categoryMap = new Map<string, number>()
    const tickets = (data || []) as TicketWithCategory[]

    tickets.forEach(t => {
      const categoryName = t.category?.name || 'Uncategorized'
      const current = categoryMap.get(categoryName) || 0
      categoryMap.set(categoryName, current + (Number(t.actual_cost) || 0))
    })

    return Array.from(categoryMap.entries())
      .map(([category_name, spent]) => ({ category_name, spent }))
      .sort((a, b) => b.spent - a.spent)
  }

  /**
   * Get monthly spend for trend charts
   * Returns spend aggregated by month for the given fiscal year
   */
  async getMonthlySpend(fiscalYear: number, locationId?: string | null): Promise<SpendByMonth[]> {
    const { supabase, tenantId } = await this.getClient()

    const startDate = `${fiscalYear}-01-01T00:00:00Z`
    const endDate = `${fiscalYear + 1}-01-01T00:00:00Z`

    let query = supabase
      .from('tickets')
      .select('actual_cost, completed_at')
      .eq('tenant_id', tenantId)
      .not('actual_cost', 'is', null)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)
      .is('deleted_at', null)

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to get monthly spend: ${error.message}`)
    }

    // Aggregate by month
    type TicketWithDate = {
      actual_cost: number | null
      completed_at: string | null
    }

    const monthMap = new Map<number, number>()
    const tickets = (data || []) as TicketWithDate[]

    tickets.forEach(t => {
      if (t.completed_at) {
        const month = new Date(t.completed_at).getMonth() + 1 // 1-12
        const current = monthMap.get(month) || 0
        monthMap.set(month, current + (Number(t.actual_cost) || 0))
      }
    })

    // Return all 12 months (even if 0)
    const result: SpendByMonth[] = []
    for (let month = 1; month <= 12; month++) {
      result.push({
        month,
        year: fiscalYear,
        spent: monthMap.get(month) || 0,
      })
    }

    return result
  }

  /**
   * Get spend by location for comparison charts
   * Returns total spend per location for the fiscal year
   */
  async getSpendByLocation(fiscalYear: number): Promise<SpendByLocation[]> {
    const { supabase, tenantId } = await this.getClient()

    const startDate = `${fiscalYear}-01-01T00:00:00Z`
    const endDate = `${fiscalYear + 1}-01-01T00:00:00Z`

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        actual_cost,
        location:locations (
          id,
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .not('actual_cost', 'is', null)
      .not('completed_at', 'is', null)
      .not('location_id', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to get spend by location: ${error.message}`)
    }

    // Aggregate by location
    type TicketWithLocation = {
      actual_cost: number | null
      location: { id: string; name: string } | null
    }

    const locationMap = new Map<string, { name: string; spent: number }>()
    const tickets = (data || []) as TicketWithLocation[]

    tickets.forEach(t => {
      if (t.location) {
        const current = locationMap.get(t.location.id) || { name: t.location.name, spent: 0 }
        current.spent += Number(t.actual_cost) || 0
        locationMap.set(t.location.id, current)
      }
    })

    return Array.from(locationMap.entries())
      .map(([location_id, { name, spent }]) => ({
        location_id,
        location_name: name,
        spent,
      }))
      .sort((a, b) => b.spent - a.spent)
  }

  /**
   * Get all distinct categories with tickets in a fiscal year
   * Useful for building budget category dropdowns
   */
  async getTicketCategoriesWithSpend(fiscalYear: number): Promise<string[]> {
    const { supabase, tenantId } = await this.getClient()

    const startDate = `${fiscalYear}-01-01T00:00:00Z`
    const endDate = `${fiscalYear + 1}-01-01T00:00:00Z`

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        category:ticket_categories (
          name
        )
      `)
      .eq('tenant_id', tenantId)
      .not('actual_cost', 'is', null)
      .not('completed_at', 'is', null)
      .gte('completed_at', startDate)
      .lt('completed_at', endDate)
      .is('deleted_at', null)

    if (error) {
      throw new Error(`Failed to get ticket categories: ${error.message}`)
    }

    type TicketWithCategory = {
      category: { name: string } | null
    }

    const categories = new Set<string>()
    const tickets = (data || []) as TicketWithCategory[]

    tickets.forEach(t => {
      if (t.category?.name) {
        categories.add(t.category.name)
      }
    })

    return Array.from(categories).sort()
  }
}
