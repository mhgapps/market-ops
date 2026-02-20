import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { ComplianceDocumentService } from '@/services/compliance-document.service';
import { updateComplianceDocSchema } from '@/lib/validations/compliance';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const service = new ComplianceDocumentService();
    const document = await service.getDocumentById(id);

    if (!document) {
      return NextResponse.json({ error: 'Compliance document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching compliance document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance document' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const body = await request.json();
    const validated = updateComplianceDocSchema.parse(body);

    const service = new ComplianceDocumentService();
    const document = await service.updateDocument(id, validated);

    return NextResponse.json({ document });
  } catch (error: unknown) {
    console.error('Error updating compliance document:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to update compliance document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const service = new ComplianceDocumentService();
    await service.deleteDocument(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting compliance document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to delete compliance document' },
      { status: 500 }
    );
  }
}
