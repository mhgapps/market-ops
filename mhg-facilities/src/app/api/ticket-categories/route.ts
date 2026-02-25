import { NextRequest, NextResponse } from "next/server";
import { TicketCategoryService } from "@/services/ticket-category.service";
import { requireAuth } from "@/lib/auth/api-auth";
import { createCategorySchema } from "@/lib/validations/ticket";

/**
 * GET /api/ticket-categories
 * Get all ticket categories
 */
export async function GET(_request: NextRequest) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const service = new TicketCategoryService();
    const categories = await service.getAllCategories();

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch categories",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/ticket-categories
 * Create a new ticket category
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only managers and admins can create categories
    if (user.role !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only managers and admins can create categories" },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = createCategorySchema.parse(body);

    const service = new TicketCategoryService();
    const category = await service.createCategory(validatedData);

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create category",
      },
      { status: 500 },
    );
  }
}
