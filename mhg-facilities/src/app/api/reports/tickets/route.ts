import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';
import type { TicketReportFilters } from '@/services/report.service';
import { requireAuth } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;

    const filters: TicketReportFilters = {};

    // Date range
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    if (startDate && endDate) {
      filters.dateRange = { start: startDate, end: endDate };
    }

    // Status filter
    const statusParam = searchParams.get('status');
    if (statusParam) {
      filters.status = statusParam.split(',');
    }

    // Priority filter
    const priorityParam = searchParams.get('priority');
    if (priorityParam) {
      filters.priority = priorityParam.split(',');
    }

    // Location filter
    const locationId = searchParams.get('location_id');
    if (locationId) {
      filters.locationId = locationId;
    }

    const service = new ReportService();
    const report = await service.getTicketReport(filters);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Ticket report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate ticket report' },
      { status: 500 }
    );
  }
}
