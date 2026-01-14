import { NextRequest, NextResponse } from 'next/server';

import { PMScheduleService } from '@/services/pm-schedule.service';

export async function POST(_request: NextRequest) {
  try {

    const service = new PMScheduleService();
    const tickets = await service.generateTickets();

    return NextResponse.json({ tickets, count: tickets.length }, { status: 201 });
  } catch (error) {
    console.error('Error generating PM tickets:', error);
    return NextResponse.json(
      { error: 'Failed to generate PM tickets' },
      { status: 500 }
    );
  }
}
