import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '@/services/budget.service'
import { ZodError } from 'zod'
import { budgetChartFiltersSchema } from '@/lib/validations/budget'
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const service = new BudgetService()
    const { searchParams } = new URL(request.url)

    const rawParams = {
      fiscal_year: searchParams.get('fiscal_year'),
    }

    const params = budgetChartFiltersSchema.parse({
      fiscal_year: rawParams.fiscal_year ? parseInt(rawParams.fiscal_year) : undefined,
    })

    const fiscalYear = params.fiscal_year || service.getCurrentFiscalYear()
    const data = await service.getUtilizationByLocation(fiscalYear)

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error fetching location utilization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location utilization data' },
      { status: 500 }
    )
  }
}
