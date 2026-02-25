import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { PMTemplateService } from "@/services/pm-template.service";
import { createPMTemplateSchema } from "@/lib/validations/pm";

export async function GET(_request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const service = new PMTemplateService();
    const templates = await service.getAllTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching PM templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch PM templates" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const validated = createPMTemplateSchema.parse(body);

    const service = new PMTemplateService();
    const template = await service.createTemplate({
      ...validated,
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating PM template:", error);

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
            : String(error) || "Failed to create PM template",
      },
      { status: 500 },
    );
  }
}
