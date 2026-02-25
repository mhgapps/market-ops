import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { PMTemplateService } from "@/services/pm-template.service";
import { updatePMTemplateSchema } from "@/lib/validations/pm";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await context.params;

    const service = new PMTemplateService();
    const template = await service.getTemplateById(id);

    if (!template) {
      return NextResponse.json(
        { error: "PM template not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ template });
  } catch (error: unknown) {
    console.error("Error fetching PM template:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error) || "Failed to fetch PM template",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await context.params;

    const body = await request.json();
    const validated = updatePMTemplateSchema.parse(body);

    const service = new PMTemplateService();
    const template = await service.updateTemplate(id, validated);

    return NextResponse.json({ template });
  } catch (error: unknown) {
    console.error("Error updating PM template:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error) || "Failed to update PM template",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { id } = await context.params;

    const service = new PMTemplateService();
    await service.deleteTemplate(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting PM template:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : String(error) || "Failed to delete PM template",
      },
      { status: 500 },
    );
  }
}
