import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { VendorService } from "@/services/vendor.service";
import { updateVendorSchema } from "@/lib/validations/assets-vendors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/vendors/[id]
 * Get vendor by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const service = new VendorService();
    const vendor = await service.getVendorById(id);

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/vendors/[id]
 * Update vendor
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateVendorSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const service = new VendorService();
    // Convert null to undefined for service layer
    const updateData = Object.fromEntries(
      Object.entries(validationResult.data).map(([key, value]) => [
        key,
        value === null ? undefined : value,
      ]),
    );
    const vendor = await service.updateVendor(id, updateData);

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("Invalid email")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes("start date cannot be after")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/vendors/[id]
 * Soft delete vendor
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const service = new VendorService();
    await service.deleteVendor(id);

    return NextResponse.json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 },
    );
  }
}
