import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '@/services/budget.service'
import { z, ZodError } from 'zod'
import { optionalNullableUuid } from '@/lib/validations/shared'

const createBudgetSchema = z.object({
  location_id: optionalNullableUuid(),
  category: z.string().optional().nullable(),
  fiscal_year: z.number().int(),
  annual_budget: z.number().positive(),
  spent_amount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    const service = new BudgetService()
    const { searchParams } = new URL(request.url)

    const fiscalYear = searchParams.get('fiscal_year')
    const locationId = searchParams.get('location_id')

    let budgets
    if (fiscalYear) {
      budgets = await service.getBudgetsByFiscalYear(parseInt(fiscalYear))
    } else if (locationId) {
      budgets = await service.getBudgetsByLocation(locationId)
    } else {
      budgets = await service.getAllBudgets()
    }

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
