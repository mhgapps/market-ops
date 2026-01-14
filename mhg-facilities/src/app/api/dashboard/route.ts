import { NextResponse } from 'next/server';
import { DashboardService } from '@/services/dashboard.service';

/**
 * Combined dashboard endpoint
 * Fetches all dashboard data in a single request to reduce client-side API calls
 */
export async function GET() {
  try {
    const service = new DashboardService();

    // Fetch all dashboard data in parallel
    const [overview, ticketStats, ticketTrend, byStatus, byPriority, recentActivity] =
      await Promise.all([
        service.getOverviewStats(),
        service.getTicketStats(),
        service.getTicketTrend(30),
        service.getTicketsByStatus(),
        service.getTicketsByPriority(),
        service.getRecentActivity(10),
      ]);

    return NextResponse.json({
      overview,
      ticketStats: {
        stats: ticketStats,
        trend: ticketTrend,
        byStatus,
        byPriority,
      },
      recentActivity,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
