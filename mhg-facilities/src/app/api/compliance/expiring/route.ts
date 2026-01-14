import { NextRequest, NextResponse } from 'next/server';

import { ComplianceDocumentService } from '@/services/compliance-document.service';

export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90', 10);

    if (days <= 0 || days > 365) {
      return NextResponse.json({ error: 'Days must be between 1 and 365' }, { status: 400 });
    }

    const service = new ComplianceDocumentService();
    const documents = await service.getExpiringSoon(days);

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching expiring documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiring documents' },
      { status: 500 }
    );
  }
}
