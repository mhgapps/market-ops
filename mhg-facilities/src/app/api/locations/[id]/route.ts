import { NextRequest, NextResponse } from "next/server";
import { LocationService } from "@/services/location.service";
import { requireAuth, requireAdmin } from "@/lib/auth/api-auth";
import { updateLocationSchema } from "@/lib/validations/location";

/**
 * GET /api/locations/[id]
 * Get a specific location by ID
 * Requires authentication
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const locationService = new LocationService();

    // Check if requesting location with manager details
    const { searchParams } = new URL(request.url);
    const withManager = searchParams.get("withManager") === "true";

    const location = withManager
      ? await locationService.getLocationWithManager(id)
      : await locationService.getLocationById(id);

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error in GET /api/locations/[id]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch location",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/locations/[id]
 * Update a location
 * Requires admin role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateLocationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const locationService = new LocationService();
    const location = await locationService.updateLocation(id, validation.data);

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error in PATCH /api/locations/[id]:", error);

    if (error instanceof Error) {
      if (error.message === "Location not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (
        error.message.includes("Manager not found") ||
        error.message.includes("manager")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update location",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/locations/[id]
 * Soft delete a location
 * Requires admin role
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const locationService = new LocationService();
    await locationService.deleteLocation(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/locations/[id]:", error);

    if (error instanceof Error) {
      if (error.message === "Location not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("Cannot delete location")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete location",
      },
      { status: 500 },
    );
  }
}
