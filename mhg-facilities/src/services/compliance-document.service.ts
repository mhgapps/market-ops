import { ComplianceDocumentDAO } from '@/dao/compliance-document.dao';
import { ComplianceDocumentTypeDAO } from '@/dao/compliance-document-type.dao';
import { LocationDAO } from '@/dao/location.dao';
import type { Database } from '@/types/database';

type ComplianceDocument = Database['public']['Tables']['compliance_documents']['Row'];
type ComplianceStatus = Database['public']['Enums']['compliance_status'];

interface CreateComplianceDocInput {
  name: string;
  document_type_id?: string | null;
  location_id?: string | null;
  location_ids?: string[] | null;
  issue_date?: string | null;
  expiration_date: string;
  issuing_authority?: string | null;
  document_number?: string | null;
  file_path?: string | null;
  renewal_cost?: number | null;
  renewal_assigned_to?: string | null;
  notes?: string | null;
}

interface UpdateComplianceDocInput {
  name?: string;
  document_type_id?: string | null;
  location_id?: string | null;
  location_ids?: string[] | null;
  issue_date?: string | null;
  expiration_date?: string;
  issuing_authority?: string | null;
  document_number?: string | null;
  file_path?: string | null;
  status?: ComplianceStatus;
  renewal_cost?: number | null;
  renewal_assigned_to?: string | null;
  notes?: string | null;
}

interface ComplianceFilters {
  location_id?: string;
  document_type_id?: string;
  status?: ComplianceStatus;
  search?: string;
}

interface ComplianceStats {
  total: number;
  active: number;
  expiring_soon: number;
  expired: number;
  conditional: number;
  failed_inspection: number;
}

interface ComplianceCalendarItem {
  date: string;
  documents: Array<{
    id: string;
    name: string;
    status: ComplianceStatus;
    document_type_id: string | null;
  }>;
}

export class ComplianceDocumentService {
  constructor(
    private complianceDAO = new ComplianceDocumentDAO(),
    private documentTypeDAO = new ComplianceDocumentTypeDAO(),
    private locationDAO = new LocationDAO()
  ) {}

  async getAllDocuments(filters?: ComplianceFilters): Promise<ComplianceDocument[]> {
    if (filters?.location_id) {
      return await this.complianceDAO.findByLocation(filters.location_id);
    }

    if (filters?.document_type_id) {
      return await this.complianceDAO.findByType(filters.document_type_id);
    }

    if (filters?.status) {
      return await this.complianceDAO.findByStatus(filters.status);
    }

    return await this.complianceDAO.findAll();
  }

  async getDocumentById(id: string) {
    return await this.complianceDAO.findWithVersions(id);
  }

  async getDocumentsByLocation(locationId: string): Promise<ComplianceDocument[]> {
    return await this.complianceDAO.findByLocation(locationId);
  }

  async getExpiringSoon(days: number): Promise<ComplianceDocument[]> {
    return await this.complianceDAO.findExpiringSoon(days);
  }

  async getExpired(): Promise<ComplianceDocument[]> {
    return await this.complianceDAO.findExpired();
  }

  async getComplianceStats(): Promise<ComplianceStats> {
    const all = await this.complianceDAO.findAll();
    const expiringSoon = await this.complianceDAO.findExpiringSoon(90);
    const expired = await this.complianceDAO.findExpired();
    const conditional = await this.complianceDAO.findConditional();
    const failedInspection = await this.complianceDAO.findFailedInspection();

    return {
      total: all.length,
      active: all.filter(d => d.status === 'active').length,
      expiring_soon: expiringSoon.length,
      expired: expired.length,
      conditional: conditional.length,
      failed_inspection: failedInspection.length,
    };
  }

  async getComplianceCalendar(month: number, year: number): Promise<ComplianceCalendarItem[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const all = await this.complianceDAO.findAll();

    const calendar: Map<string, ComplianceCalendarItem> = new Map();

    all.forEach(doc => {
      if (!doc.expiration_date) return;

      const expirationDate = new Date(doc.expiration_date);
      if (expirationDate >= startDate && expirationDate <= endDate) {
        const dateKey = doc.expiration_date;

        if (!calendar.has(dateKey)) {
          calendar.set(dateKey, {
            date: dateKey,
            documents: []
          });
        }

        calendar.get(dateKey)!.documents.push({
          id: doc.id,
          name: doc.name,
          status: doc.status,
          document_type_id: doc.document_type_id
        });
      }
    });

    return Array.from(calendar.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  async createDocument(data: CreateComplianceDocInput): Promise<ComplianceDocument> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Document name is required');
    }

    if (!data.expiration_date) {
      throw new Error('Expiration date is required');
    }

    if (data.location_id && data.location_ids && data.location_ids.length > 0) {
      throw new Error('Cannot specify both location_id and location_ids');
    }

    if (data.document_type_id) {
      const docType = await this.documentTypeDAO.findById(data.document_type_id);
      if (!docType) {
        throw new Error('Document type not found');
      }
    }

    if (data.location_id) {
      const location = await this.locationDAO.findById(data.location_id);
      if (!location) {
        throw new Error('Location not found');
      }
    }

    return await this.complianceDAO.create({
      name: data.name.trim(),
      document_type_id: data.document_type_id || null,
      location_id: data.location_id || null,
      location_ids: data.location_ids || null,
      issue_date: data.issue_date || null,
      expiration_date: data.expiration_date,
      issuing_authority: data.issuing_authority?.trim() || null,
      document_number: data.document_number?.trim() || null,
      file_path: data.file_path || null,
      status: 'active',
      renewal_cost: data.renewal_cost || null,
      renewal_assigned_to: data.renewal_assigned_to || null,
      notes: data.notes?.trim() || null,
    });
  }

  async updateDocument(id: string, data: UpdateComplianceDocInput): Promise<ComplianceDocument> {
    const existing = await this.complianceDAO.findById(id);
    if (!existing) {
      throw new Error('Compliance document not found');
    }

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new Error('Document name is required');
    }

    if (data.document_type_id) {
      const docType = await this.documentTypeDAO.findById(data.document_type_id);
      if (!docType) {
        throw new Error('Document type not found');
      }
    }

    if (data.location_id) {
      const location = await this.locationDAO.findById(data.location_id);
      if (!location) {
        throw new Error('Location not found');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.document_type_id !== undefined) updateData.document_type_id = data.document_type_id;
    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.location_ids !== undefined) updateData.location_ids = data.location_ids;
    if (data.issue_date !== undefined) updateData.issue_date = data.issue_date;
    if (data.expiration_date !== undefined) updateData.expiration_date = data.expiration_date;
    if (data.issuing_authority !== undefined) updateData.issuing_authority = data.issuing_authority?.trim() || null;
    if (data.document_number !== undefined) updateData.document_number = data.document_number?.trim() || null;
    if (data.file_path !== undefined) updateData.file_path = data.file_path;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.renewal_cost !== undefined) updateData.renewal_cost = data.renewal_cost;
    if (data.renewal_assigned_to !== undefined) updateData.renewal_assigned_to = data.renewal_assigned_to;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    return await this.complianceDAO.update(id, updateData);
  }

  async deleteDocument(id: string): Promise<void> {
    const existing = await this.complianceDAO.findById(id);
    if (!existing) {
      throw new Error('Compliance document not found');
    }

    await this.complianceDAO.softDelete(id);
  }

  async markAsRenewed(id: string, newExpirationDate: string): Promise<ComplianceDocument> {
    return await this.complianceDAO.update(id, {
      expiration_date: newExpirationDate,
      status: 'active',
      renewal_submitted_date: new Date().toISOString().split('T')[0],
      is_conditional: false,
      conditional_requirements: null,
      conditional_deadline: null,
      failed_inspection_date: null,
      corrective_action_required: null,
      reinspection_date: null,
    });
  }

  async markAsConditional(
    id: string,
    requirements: string,
    deadline: string
  ): Promise<ComplianceDocument> {
    return await this.complianceDAO.update(id, {
      is_conditional: true,
      conditional_requirements: requirements,
      conditional_deadline: deadline,
      status: 'conditional',
    });
  }

  async markAsFailedInspection(
    id: string,
    correctiveAction: string,
    reinspectionDate: string
  ): Promise<ComplianceDocument> {
    return await this.complianceDAO.update(id, {
      failed_inspection_date: new Date().toISOString().split('T')[0],
      corrective_action_required: correctiveAction,
      reinspection_date: reinspectionDate,
      status: 'failed_inspection',
    });
  }

  async clearConditional(id: string): Promise<ComplianceDocument> {
    return await this.complianceDAO.update(id, {
      is_conditional: false,
      conditional_requirements: null,
      conditional_deadline: null,
      status: 'active',
    });
  }

  async clearFailedInspection(id: string): Promise<ComplianceDocument> {
    return await this.complianceDAO.update(id, {
      failed_inspection_date: null,
      corrective_action_required: null,
      reinspection_date: null,
      status: 'active',
    });
  }

  async processExpirationAlerts(): Promise<void> {
    throw new Error('Not implemented - requires email service integration');
  }

  /**
   * Get documents expiring within specified number of days
   */
  async getExpiringDocuments(days: number): Promise<ComplianceDocument[]> {
    const allDocuments = await this.complianceDAO.findAll();
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + days);

    return allDocuments.filter((doc) => {
      if (!doc.expiration_date) return false;

      const expirationDate = new Date(doc.expiration_date);

      // For "expires today" (days = 0), check if expiration is today
      if (days === 0) {
        return (
          expirationDate.getFullYear() === now.getFullYear() &&
          expirationDate.getMonth() === now.getMonth() &&
          expirationDate.getDate() === now.getDate()
        );
      }

      // For other thresholds, check if expiration is exactly N days from now
      return (
        expirationDate.getFullYear() === targetDate.getFullYear() &&
        expirationDate.getMonth() === targetDate.getMonth() &&
        expirationDate.getDate() === targetDate.getDate()
      );
    });
  }
}
