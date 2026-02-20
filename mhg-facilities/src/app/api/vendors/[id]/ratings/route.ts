import { NextResponse, type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/auth/api-auth'
import { VendorRatingService } from '@/services/vendor-rating.service'
import { createVendorRatingSchema } from '@/lib/validations/assets-vendors'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/vendors/[id]/ratings
 * Get all ratings for a vendor
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await params

    const service = new VendorRatingService()
    const ratings = await service.getVendorRatings(id)
    const stats = await service.getVendorStats(id)

    return NextResponse.json({
      ratings,
      stats,
      total: ratings.length,
    })
  } catch (error) {
    console.error('Error fetching vendor ratings:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch vendor ratings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/vendors/[id]/ratings
 * Create rating for a vendor
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, error: authError } = await requireAuth()
    if (authError) return authError
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 })

    const { id } = await params
    const body = await request.json()

    // Validate input
    const validationResult = createVendorRatingSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new VendorRatingService()
    const rating = await service.createRating({
      vendor_id: id,
      ...validationResult.data,
      rated_by: user.id,
    })

    return NextResponse.json({ rating }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor rating:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('already has a rating')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('must be an integer between 1 and 5')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json(
      { error: 'Failed to create vendor rating' },
      { status: 500 }
    )
  }
}
