import { ZodError } from "zod";
import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth/api-auth";
import { PMScheduleService } from "@/services/pm-schedule.service";
import { createPMScheduleSchema, pmFiltersSchema } from "@/lib/validations/pm";

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const service = new PMScheduleService();

    // Check if stats are requested
    if (searchParams.get("stats") === "true") {
      const stats = await service.getPMStats();
      return NextResponse.json({ stats });
    }

    const filters = pmFiltersSchema.parse({
      asset_id: searchParams.get("asset_id") || undefined,
      location_id: searchParams.get("location_id") || undefined,
      frequency: searchParams.get("frequency") || undefined,
      is_active:
        searchParams.get("is_active") === "true"
          ? true
          : searchParams.get("is_active") === "false"
            ? false
            : undefined,
    });

    const schedules = await service.getAllSchedules(filters);

    return NextResponse.json({ schedules });
  } catch (error: unknown) {
    console.error("Error fetching PM schedules:", error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch PM schedules" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const validated = createPMScheduleSchema.parse(body);

    const service = new PMScheduleService();
    const schedule = await service.createSchedule({
      ...validated,
    });

    return NextResponse.json({ schedule }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating PM schedule:", error);

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
            : String(error) || "Failed to create PM schedule",
      },
      { status: 500 },
    );
  }
}
