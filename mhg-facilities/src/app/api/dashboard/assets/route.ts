import { NextRequest, NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const includeBreakdown = searchParams.get('breakdown') === 'true';
    const warrantyDays = parseInt(searchParams.get('warranty_days') || '30');

    const service = new DashboardService();

    const stats = await service.getAssetStats();

    const response: Record<string, unknown> = {
      stats,
    };

    if (includeBreakdown) {
      const [byStatus, expiringWarranties] = await Promise.all([
        service.getAssetsByStatus(),
        service.getExpiringWarranties(warrantyDays),
      ]);

      response.byStatus = byStatus;
      response.expiringWarranties = expiringWarranties;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Dashboard assets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch asset stats' },
      { status: 500 }
    );
  }
}
