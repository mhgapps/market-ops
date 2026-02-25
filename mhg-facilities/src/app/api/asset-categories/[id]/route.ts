import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { AssetCategoryService } from "@/services/asset-category.service";
import { updateAssetCategorySchema } from "@/lib/validations/assets-vendors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/asset-categories/[id]
 * Get asset category by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const service = new AssetCategoryService();
    const category = await service.getCategoryById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching asset category:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset category" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/asset-categories/[id]
 * Update asset category
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateAssetCategorySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const service = new AssetCategoryService();
    // Convert null to undefined for service layer
    const updateData = {
      ...validationResult.data,
      parent_category_id:
        validationResult.data.parent_category_id === null
          ? undefined
          : validationResult.data.parent_category_id,
    };
    const category = await service.updateCategory(id, updateData);

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating asset category:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("already exists")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("circular reference")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to update asset category" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/asset-categories/[id]
 * Soft delete asset category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await params;

    const service = new AssetCategoryService();
    await service.deleteCategory(id);

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset category:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("child categories")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to delete asset category" },
      { status: 500 },
    );
  }
}
