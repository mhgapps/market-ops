import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/auth/api-auth';
import { ComplianceDocumentService } from '@/services/compliance-document.service';
import { markAsRenewedSchema, markAsConditionalSchema, markAsFailedInspectionSchema } from '@/lib/validations/compliance';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { error: authError } = await requireAuth()
    if (authError) return authError

    const { id } = await context.params;

    const body = await request.json();
    const { action } = body;

    const service = new ComplianceDocumentService();
    let document;

    switch (action) {
      case 'mark_renewed': {
        const validated = markAsRenewedSchema.parse(body);
        document = await service.markAsRenewed(id, validated.new_expiration_date);
        break;
      }
      case 'mark_conditional': {
        const validated = markAsConditionalSchema.parse(body);
        document = await service.markAsConditional(id, validated.requirements, validated.deadline);
        break;
      }
      case 'mark_failed_inspection': {
        const validated = markAsFailedInspectionSchema.parse(body);
        document = await service.markAsFailedInspection(id, validated.corrective_action, validated.reinspection_date);
        break;
      }
      case 'clear_conditional': {
        document = await service.clearConditional(id);
        break;
      }
      case 'clear_failed_inspection': {
        document = await service.clearFailedInspection(id);
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ document });
  } catch (error: unknown) {
    console.error('Error updating compliance status:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to update compliance status' },
      { status: 500 }
    );
  }
}
