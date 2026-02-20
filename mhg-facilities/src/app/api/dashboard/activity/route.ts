import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const service = new DashboardService();
    const activities = await service.getRecentActivity(limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Dashboard activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
