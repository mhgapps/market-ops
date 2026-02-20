import { NextRequest, NextResponse } from 'next/server'
import { BudgetService } from '@/services/budget.service'
import { ZodError } from 'zod'
import { updateBudgetSchema } from '@/lib/validations/budget'
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const service = new BudgetService()

    // Check if with_spend param is requested
    const { searchParams } = new URL(request.url)
    const withSpend = searchParams.get('with_spend') === 'true'

    if (withSpend) {
      const budget = await service.getBudgetWithSpend(id)
      if (!budget) {
        return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
      }
      return NextResponse.json({ budget })
    }

    const budget = await service.getBudgetById(id)

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const body = await request.json()
    const validated = updateBudgetSchema.parse(body)

    const service = new BudgetService()
    const budget = await service.updateBudget(id, validated)

    return NextResponse.json({ budget })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params
    const service = new BudgetService()
    await service.deleteBudget(id)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget' },
      { status: 500 }
    )
  }
}
