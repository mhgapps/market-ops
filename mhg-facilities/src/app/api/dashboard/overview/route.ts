import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET() {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

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
