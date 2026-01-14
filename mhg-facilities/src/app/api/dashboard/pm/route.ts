import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeOverdue = searchParams.get('include_overdue') === 'true';

    const service = new DashboardService();

    const stats = await service.getPMStats();

    const response: Record<string, unknown> = {
      stats,
    };

    if (includeOverdue) {
      const overdue = await service.getOverduePM();
      response.overdue = overdue;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard PM error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PM stats' },
      { status: 500 }
    );
  }
}
