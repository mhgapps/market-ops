import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, filename, format = 'csv' } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty data provided' },
        { status: 400 }
      );
    }

    const service = new ReportService();

    if (format === 'csv') {
      const blob = service.exportToCSV(data, filename || 'export.csv');
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename || 'export.csv'}"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Unsupported export format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
