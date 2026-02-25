import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { PMScheduleService } from "@/services/pm-schedule.service";
import { completePMScheduleSchema } from "@/lib/validations/pm";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    const { id } = await context.params;

    const body = await request.json();
    const validated = completePMScheduleSchema.parse(body);

    const service = new PMScheduleService();
    const completion = await service.markCompleted(
      id,
      validated.ticket_id,
      user.id,
      validated.checklist_results || undefined,
    );

    return NextResponse.json({ completion }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error completing PM schedule:", error);

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
            : String(error) || "Failed to complete PM schedule",
      },
      { status: 500 },
    );
  }
}
