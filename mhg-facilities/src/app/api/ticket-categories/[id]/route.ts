import { NextRequest, NextResponse } from "next/server";
import { TicketCategoryService } from "@/services/ticket-category.service";
import { requireAuth } from "@/lib/auth/api-auth";
import { updateCategorySchema } from "@/lib/validations/ticket";

/**
 * GET /api/ticket-categories/[id]
 * Get a ticket category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id } = await params;
    const service = new TicketCategoryService();
    const category = await service.getCategoryById(id);

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch category",
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/ticket-categories/[id]
 * Update a ticket category
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers and admins can update categories
    if (user.role !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only managers and admins can update categories" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body - allow nullable fields
    const validatedData = updateCategorySchema.parse(body);

    const service = new TicketCategoryService();
    const category = await service.updateCategory(id, validatedData);

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update category",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/ticket-categories/[id]
 * Delete a ticket category (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers and admins can delete categories
    if (user.role !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only managers and admins can delete categories" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const service = new TicketCategoryService();
    await service.deleteCategory(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof Error && error.message.includes("Cannot delete")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete category",
      },
      { status: 500 },
    );
  }
}
