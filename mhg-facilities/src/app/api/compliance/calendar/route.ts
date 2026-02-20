import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { ComplianceDocumentService } from '@/services/compliance-document.service';

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10);

    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Month must be between 1 and 12' }, { status: 400 });
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Year must be between 2000 and 2100' }, { status: 400 });
    }

    const service = new ComplianceDocumentService();
    const calendar = await service.getComplianceCalendar(month, year);

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Error fetching compliance calendar:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance calendar' },
      { status: 500 }
    );
  }
}
