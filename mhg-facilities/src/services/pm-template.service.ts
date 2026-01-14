import { PMTemplateDAO } from '@/dao/pm-template.dao';
import type { Database } from '@/types/database-extensions';

type PMTemplate = Database['public']['Tables']['pm_templates']['Row'];

interface CreatePMTemplateInput {
  name: string;
  description?: string | null;
  category?: string | null;
  checklist?: Record<string, unknown> | null;
  estimated_duration_hours?: number | null;
  default_vendor_id?: string | null;
}

interface UpdatePMTemplateInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  checklist?: Record<string, unknown> | null;
  estimated_duration_hours?: number | null;
  default_vendor_id?: string | null;
}

export class PMTemplateService {
  constructor(
    private templateDAO = new PMTemplateDAO()
  ) {}

  async getAllTemplates(): Promise<PMTemplate[]> {
    return await this.templateDAO.findAll();
  }

  async getTemplateById(id: string): Promise<PMTemplate | null> {
    return await this.templateDAO.findById(id);
  }

  async getTemplatesByCategory(category: string): Promise<PMTemplate[]> {
    return await this.templateDAO.findByCategory(category);
  }

  async getTemplatesWithScheduleCount() {
    return await this.templateDAO.findWithScheduleCount();
  }

  async createTemplate(data: CreatePMTemplateInput): Promise<PMTemplate> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Template name is required');
    }

    if (data.name.length > 200) {
      throw new Error('Template name must be 200 characters or less');
    }

    if (data.estimated_duration_hours !== undefined && data.estimated_duration_hours !== null) {
      if (data.estimated_duration_hours <= 0) {
        throw new Error('Estimated duration must be positive');
      }
      if (data.estimated_duration_hours > 99.99) {
        throw new Error('Estimated duration must be less than 100 hours');
      }
    }

    return await this.templateDAO.create({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      category: data.category?.trim() || null,
      checklist: data.checklist || null,
      estimated_duration_hours: data.estimated_duration_hours || null,
      default_vendor_id: data.default_vendor_id || null,
    });
  }

  async updateTemplate(id: string, data: UpdatePMTemplateInput): Promise<PMTemplate> {
    const existing = await this.templateDAO.findById(id);
    if (!existing) {
      throw new Error('PM template not found');
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Template name is required');
      }
      if (data.name.length > 200) {
        throw new Error('Template name must be 200 characters or less');
      }
    }

    if (data.estimated_duration_hours !== undefined && data.estimated_duration_hours !== null) {
      if (data.estimated_duration_hours <= 0) {
        throw new Error('Estimated duration must be positive');
      }
      if (data.estimated_duration_hours > 99.99) {
        throw new Error('Estimated duration must be less than 100 hours');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.category !== undefined) updateData.category = data.category?.trim() || null;
    if (data.checklist !== undefined) updateData.checklist = data.checklist;
    if (data.estimated_duration_hours !== undefined) updateData.estimated_duration_hours = data.estimated_duration_hours;
    if (data.default_vendor_id !== undefined) updateData.default_vendor_id = data.default_vendor_id;

    return await this.templateDAO.update(id, updateData);
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await this.templateDAO.findById(id);
    if (!existing) {
      throw new Error('PM template not found');
    }

    await this.templateDAO.softDelete(id);
  }
}
