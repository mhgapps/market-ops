import { NextResponse, type NextRequest } from 'next/server'
import { VendorService } from '@/services/vendor.service'
import { createVendorSchema, vendorFilterSchema } from '@/lib/validations/assets-vendors'

// Helper to convert null to undefined
function nullToUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, value === null ? undefined : value])
  ) as T
}

/**
 * GET /api/vendors
 * Get all vendors with optional filters and pagination
 * Query params: is_active, is_preferred, service_category, insurance_expiring_days, contract_expiring_days, page, pageSize
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Parse pagination params
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)

    const rawFilters = {
      is_active: searchParams.get('is_active') || undefined,
      is_preferred: searchParams.get('is_preferred') || undefined,
      service_category: searchParams.get('service_category') || undefined,
      insurance_expiring_days: searchParams.get('insurance_expiring_days') || undefined,
      contract_expiring_days: searchParams.get('contract_expiring_days') || undefined,
      search: searchParams.get('search') || undefined,
      page,
      pageSize,
    }

    // Validate filters
    const validationResult = vendorFilterSchema.safeParse(rawFilters)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new VendorService()
    const result = await service.getAllVendorsPaginated(validationResult.data)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 })
  }
}

/**
 * POST /api/vendors
 * Create new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = createVendorSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const service = new VendorService()
    // Convert null values to undefined for service layer
    const data = nullToUndefined(validationResult.data)
    const vendor = await service.createVendor(data as any)

    return NextResponse.json({ vendor }, { status: 201 })
  } catch (error) {
    console.error('Error creating vendor:', error)

    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('Invalid email')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('start date cannot be after')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 })
  }
}
