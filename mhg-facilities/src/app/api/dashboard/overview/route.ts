import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

export async function GET() {
  try {
    const service = new DashboardService();
    const stats = await service.getOverviewStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview stats' },
      { status: 500 }
    );
  }
}
