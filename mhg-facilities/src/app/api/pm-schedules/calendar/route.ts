import { NextRequest, NextResponse } from 'next/server';

import { PMScheduleService } from '@/services/pm-schedule.service';

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Month must be between 1 and 12' }, { status: 400 });
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Year must be between 2000 and 2100' }, { status: 400 });
    }

    const service = new PMScheduleService();
    const calendar = await service.getPMCalendar(month, year);

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error fetching PM calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PM calendar' },
      { status: 500 }
    );
  }
}
