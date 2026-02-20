import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { PMScheduleService } from '@/services/pm-schedule.service';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'today';

    const service = new PMScheduleService();
    let schedules;

    if (type === 'overdue') {
      schedules = await service.getOverdue();
    } else {
      schedules = await service.getDueToday();
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching due PM schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch due PM schedules' },
      { status: 500 }
    );
  }
}
