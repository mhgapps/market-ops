import { ComplianceDocumentTypeDAO } from "@/dao/compliance-document-type.dao";
import type { Database } from "@/types/database-extensions";

type ComplianceDocumentType =
  Database["public"]["Tables"]["compliance_document_types"]["Row"];

interface CreateDocTypeInput {
  name: string;
  name_es?: string | null;
  description?: string | null;
  default_alert_days?: number[] | null;
  renewal_checklist?: Record<string, unknown> | null;
  is_location_specific?: boolean;
}

interface UpdateDocTypeInput {
  name?: string;
  name_es?: string | null;
  description?: string | null;
  default_alert_days?: number[] | null;
  renewal_checklist?: Record<string, unknown> | null;
  is_location_specific?: boolean;
}

export class ComplianceDocumentTypeService {
  constructor(private docTypeDAO = new ComplianceDocumentTypeDAO()) {}

  async getAllTypes(): Promise<ComplianceDocumentType[]> {
    return await this.docTypeDAO.findAll();
  }

  async getTypeById(id: string): Promise<ComplianceDocumentType | null> {
    return await this.docTypeDAO.findById(id);
  }

  async getTypesWithUsageCount() {
    return await this.docTypeDAO.findWithUsageCount();
  }

  async createType(data: CreateDocTypeInput): Promise<ComplianceDocumentType> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Document type name is required");
    }

    if (data.name.length > 200) {
      throw new Error("Document type name must be 200 characters or less");
    }

    return await this.docTypeDAO.create({
      name: data.name.trim(),
      name_es: data.name_es?.trim() || null,
      description: data.description?.trim() || null,
      default_alert_days: data.default_alert_days || [90, 60, 30, 14, 7],
      renewal_checklist: data.renewal_checklist || null,
      is_location_specific:
        data.is_location_specific !== undefined
          ? data.is_location_specific
          : true,
    });
  }

  async updateType(
    id: string,
    data: UpdateDocTypeInput,
  ): Promise<ComplianceDocumentType> {
    const existing = await this.docTypeDAO.findById(id);
    if (!existing) {
      throw new Error("Document type not found");
    }

    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new Error("Document type name is required");
      }
      if (data.name.length > 200) {
        throw new Error("Document type name must be 200 characters or less");
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.name_es !== undefined)
      updateData.name_es = data.name_es?.trim() || null;
    if (data.description !== undefined)
      updateData.description = data.description?.trim() || null;
    if (data.default_alert_days !== undefined)
      updateData.default_alert_days = data.default_alert_days;
    if (data.renewal_checklist !== undefined)
      updateData.renewal_checklist = data.renewal_checklist;
    if (data.is_location_specific !== undefined)
      updateData.is_location_specific = data.is_location_specific;

    return await this.docTypeDAO.update(id, updateData);
  }

  async deleteType(id: string): Promise<void> {
    const existing = await this.docTypeDAO.findById(id);
    if (!existing) {
      throw new Error("Document type not found");
    }

    await this.docTypeDAO.softDelete(id);
  }
}
