import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { ComplianceDocumentService } from "@/services/compliance-document.service";
import {
  createComplianceDocSchema,
  complianceFiltersSchema,
} from "@/lib/validations/compliance";

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const service = new ComplianceDocumentService();

    if (searchParams.get("stats") === "true") {
      const stats = await service.getComplianceStats();
      return NextResponse.json({ stats });
    }

    const filters = complianceFiltersSchema.parse({
      location_id: searchParams.get("location_id") || undefined,
      document_type_id: searchParams.get("document_type_id") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const documents = await service.getAllDocuments(filters);

    return NextResponse.json({ documents });
  } catch (error: unknown) {
    console.error("Error fetching compliance documents:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch compliance documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const validated = createComplianceDocSchema.parse(body);

    const service = new ComplianceDocumentService();
    const document = await service.createDocument({
      ...validated,
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating compliance document:", error);

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
            : String(error) || "Failed to create compliance document",
      },
      { status: 500 },
    );
  }
}
