import { NextRequest, NextResponse } from "next/server";
import { LocationService } from "@/services/location.service";
import { requireAuth, requireAdmin } from "@/lib/auth/api-auth";
import { createLocationSchema } from "@/lib/validations/location";

/**
 * GET /api/locations
 * Get all locations for the current tenant
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const locationService = new LocationService();

    // Check if requesting locations with stats
    const { searchParams } = new URL(request.url);
    const withStats = searchParams.get("withStats") === "true";

    const locations = withStats
      ? await locationService.getLocationsWithStats()
      : await locationService.getAllLocations();

    console.log("[GET /api/locations] Found locations:", locations.length);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error in GET /api/locations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch locations",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/locations
 * Create a new location
 * Requires admin role
 */
export async function POST(request: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();

    // Validate request body
    const validation = createLocationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const locationService = new LocationService();

    // Check tenant limits
    const withinLimit = await locationService.checkWithinTenantLimit();
    if (!withinLimit) {
      return NextResponse.json(
        {
          error:
            "Location limit reached for your plan. Please upgrade to add more locations.",
        },
        { status: 403 },
      );
    }

    const location = await locationService.createLocation(validation.data);

    return NextResponse.json({ location }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/locations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create location",
      },
      { status: 500 },
    );
  }
}
