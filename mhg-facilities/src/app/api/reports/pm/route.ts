import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Date range required' },
        { status: 400 }
      );
    }

    const service = new ReportService();
    const report = await service.getPMComplianceReport({
      start: startDate,
      end: endDate,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('PM report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PM report' },
      { status: 500 }
    );
  }
}
