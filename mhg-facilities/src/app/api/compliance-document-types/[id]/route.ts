import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { ComplianceDocumentTypeService } from '@/services/compliance-document-type.service';
import { updateComplianceDocTypeSchema } from '@/lib/validations/compliance';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const service = new ComplianceDocumentTypeService();
    const type = await service.getTypeById(id);

    if (!type) {
      return NextResponse.json({ error: 'Compliance type not found' }, { status: 404 });
    }

    return NextResponse.json({ type });
  } catch (error) {
    console.error('Error fetching compliance type:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance type' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const body = await request.json();
    const validated = updateComplianceDocTypeSchema.parse(body);

    const service = new ComplianceDocumentTypeService();
    const type = await service.updateType(id, validated);

    return NextResponse.json({ type });
  } catch (error: unknown) {
    console.error('Error updating compliance type:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to update compliance type' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const service = new ComplianceDocumentTypeService();
    await service.deleteType(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting compliance type:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to delete compliance type' },
      { status: 500 }
    );
  }
}
