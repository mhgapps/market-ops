import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/api-auth';
import { ComplianceDocumentTypeService } from '@/services/compliance-document-type.service';
import { createComplianceDocTypeSchema } from '@/lib/validations/compliance';

export async function GET(_request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const service = new ComplianceDocumentTypeService();
    const types = await service.getAllTypes();

    return NextResponse.json({ types });
  } catch (error) {
    console.error('Error fetching compliance types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance types' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const body = await request.json();
    const validated = createComplianceDocTypeSchema.parse(body);

    const service = new ComplianceDocumentTypeService();
    const type = await service.createType(validated);

    return NextResponse.json({ type }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating compliance type:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to create compliance type' },
      { status: 500 }
    );
  }
}
