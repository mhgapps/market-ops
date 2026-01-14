import { NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export async function GET() {
  try {
    const service = new ReportService();
    const report = await service.getComplianceStatusReport();

    return NextResponse.json(report);
  } catch (error) {
    console.error('Compliance report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    );
  }
}
