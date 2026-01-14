import { ZodError } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

import { PMTemplateService } from '@/services/pm-template.service';
import { updatePMTemplateSchema } from '@/lib/validations/pm';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const body = await request.json();
    const validated = updatePMTemplateSchema.parse(body);

    const service = new PMTemplateService();
    const template = await service.updateTemplate(id, validated);

    return NextResponse.json({ template });
  } catch (error: unknown) {
    console.error('Error updating PM template:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to update PM template' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const service = new PMTemplateService();
    await service.deleteTemplate(id);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting PM template:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Failed to delete PM template' },
      { status: 500 }
    );
  }
}
