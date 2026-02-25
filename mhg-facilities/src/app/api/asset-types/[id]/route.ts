import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { AssetTypeService } from "@/services/asset-type.service";
import { updateAssetTypeSchema } from "@/lib/validations/assets-vendors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/asset-types/[id]
 * Get asset type by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const service = new AssetTypeService();
    const assetType = await service.getTypeById(id);

    if (!assetType) {
      return NextResponse.json(
        { error: "Asset type not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ assetType });
  } catch (error) {
    console.error("Error fetching asset type:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset type" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/asset-types/[id]
 * Update asset type
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const validationResult = updateAssetTypeSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const service = new AssetTypeService();
    const assetType = await service.updateType(id, validationResult.data);

    return NextResponse.json({ assetType });
  } catch (error) {
    console.error("Error updating asset type:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update asset type" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/asset-types/[id]
 * Soft delete asset type
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const service = new AssetTypeService();
    await service.deleteType(id);

    return NextResponse.json({ message: "Asset type deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset type:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete asset type" },
      { status: 500 },
    );
  }
}
