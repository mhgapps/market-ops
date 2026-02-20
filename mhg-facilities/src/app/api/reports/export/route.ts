import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/services/report.service';
import { requireAuth } from '@/lib/auth/api-auth';

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const body = await request.json();
    const { data, filename, format = 'csv' } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty data provided' },
        { status: 400 }
      );
    }

    if (Array.isArray(data) && data.length > 10000) {
      return NextResponse.json(
        { error: 'Export limited to 10,000 rows' },
        { status: 400 }
      );
    }

    const safeName = (filename || 'export').replace(/[^a-zA-Z0-9._-]/g, '_');

    const service = new ReportService();

    if (format === 'csv') {
      const blob = service.exportToCSV(data, safeName + '.csv');
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${safeName}.csv"`,
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
