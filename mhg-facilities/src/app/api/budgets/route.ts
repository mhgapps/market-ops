import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '@/services/budget.service'
import { ZodError } from 'zod'
import {
  createBudgetSchema,
  budgetFiltersSchema,
} from '@/lib/validations/budget'
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const service = new BudgetService()
    const { searchParams } = new URL(request.url)

    // Parse query params
    const rawParams = {
      fiscal_year: searchParams.get('fiscal_year'),
      location_id: searchParams.get('location_id'),
      category: searchParams.get('category'),
      alert_level: searchParams.get('alert_level'),
      with_spend: searchParams.get('with_spend'),
    }

    // Convert string params to proper types
    const params = budgetFiltersSchema.parse({
      fiscal_year: rawParams.fiscal_year ? parseInt(rawParams.fiscal_year) : undefined,
      location_id: rawParams.location_id || undefined,
      category: rawParams.category || undefined,
      alert_level: rawParams.alert_level || undefined,
      with_spend: rawParams.with_spend === 'true',
    })

    const fiscalYear = params.fiscal_year || service.getCurrentFiscalYear()

    // If with_spend is true, return enriched budgets with calculated spend
    if (params.with_spend) {
      const budgets = await service.getBudgetsByFiscalYearWithSpend(fiscalYear)

      // Apply filters
      let filtered = budgets

      if (params.location_id) {
        filtered = filtered.filter(b => b.location_id === params.location_id)
      }

      if (params.category) {
        filtered = filtered.filter(
          b => b.category?.toLowerCase() === params.category?.toLowerCase()
        )
      }

      if (params.alert_level) {
        filtered = filtered.filter(b => b.alert_level === params.alert_level)
      }

      return NextResponse.json({ budgets: filtered })
    }

    // Standard fetch without spend calculation
    let budgets
    if (params.location_id) {
      budgets = await service.getBudgetsByLocation(params.location_id)
    } else {
      budgets = await service.getBudgetsByFiscalYear(fiscalYear)
    }

    return NextResponse.json({ budgets })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json()
    const validated = createBudgetSchema.parse(body)

    const service = new BudgetService()
    const budget = await service.createBudget(validated)

    return NextResponse.json({ budget }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: 'Failed to create budget' },
      { status: 500 }
    )
  }
}
