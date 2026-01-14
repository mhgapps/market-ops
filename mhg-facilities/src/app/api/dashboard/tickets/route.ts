import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const includeBreakdown = searchParams.get('breakdown') === 'true';

    const service = new DashboardService();

    const [stats, trend] = await Promise.all([
      service.getTicketStats(),
      service.getTicketTrend(days),
    ]);

    const response: Record<string, unknown> = {
      stats,
      trend,
    };

    if (includeBreakdown) {
      const [byStatus, byPriority] = await Promise.all([
        service.getTicketsByStatus(),
        service.getTicketsByPriority(),
      ]);

      response.byStatus = byStatus;
      response.byPriority = byPriority;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket stats' },
      { status: 500 }
    );
  }
}
