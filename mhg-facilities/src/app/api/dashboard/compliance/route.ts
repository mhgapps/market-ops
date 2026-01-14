import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeBreakdown = searchParams.get('breakdown') === 'true';
    const expirationDays = parseInt(searchParams.get('expiration_days') || '30');

    const service = new DashboardService();

    const stats = await service.getComplianceStats();

    const response: Record<string, unknown> = {
      stats,
    };

    if (includeBreakdown) {
      const [byStatus, upcomingExpirations] = await Promise.all([
        service.getComplianceByStatus(),
        service.getUpcomingExpirations(expirationDays),
      ]);

      response.byStatus = byStatus;
      response.upcomingExpirations = upcomingExpirations;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard compliance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance stats' },
      { status: 500 }
    );
  }
}
