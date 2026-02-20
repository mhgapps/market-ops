import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { PMScheduleService } from '@/services/pm-schedule.service';
import { updatePMScheduleSchema } from '@/lib/validations/pm';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const service = new PMScheduleService();
    const schedule = await service.getScheduleById(id);

    if (!schedule) {
      return NextResponse.json({ error: 'PM schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching PM schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PM schedule' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const body = await request.json();
    const validated = updatePMScheduleSchema.parse(body);

    const service = new PMScheduleService();
    const schedule = await service.updateSchedule(id, validated);

    return NextResponse.json({ schedule });
  } catch (error: unknown) {
    console.error('Error updating PM schedule:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to update PM schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const service = new PMScheduleService();
    await service.deleteSchedule(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting PM schedule:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to delete PM schedule' },
      { status: 500 }
    );
  }
}
