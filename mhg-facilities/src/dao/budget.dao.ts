import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database-extensions'

type Budget = Database['public']['Tables']['budgets']['Row']
type BudgetInsert = Database['public']['Tables']['budgets']['Insert']
type BudgetUpdate = Database['public']['Tables']['budgets']['Update']

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
   * Get budget summary for fiscal year
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
}
