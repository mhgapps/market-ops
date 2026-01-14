import { BaseDAO } from './base.dao';
import type { Database } from '@/types/database';

type ComplianceDocument = Database['public']['Tables']['compliance_documents']['Row'];
type _ComplianceDocumentInsert = Database['public']['Tables']['compliance_documents']['Insert'];
type ComplianceStatus = Database['public']['Enums']['compliance_status'];

interface ComplianceDocumentWithVersions extends ComplianceDocument {
  versions?: Array<{
    id: string;
    version: number;
    file_path: string;
    uploaded_at: string;
    uploaded_by: string;
  }>;
}

export class ComplianceDocumentDAO extends BaseDAO<'compliance_documents'> {
  constructor() {
    super('compliance_documents');
  }

  async findByLocation(locationId: string): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .or(`location_id.eq.${locationId},location_ids.cs.{${locationId}}`)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByType(typeId: string): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('document_type_id', typeId)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByStatus(status: ComplianceStatus): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findExpiringSoon(daysAhead: number): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('expiration_date', today)
      .lte('expiration_date', futureDateStr)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findExpired(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .lt('expiration_date', today)
      .is('deleted_at', null)
      .order('expiration_date', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findConditional(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_conditional', true)
      .is('deleted_at', null)
      .order('conditional_deadline', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findFailedInspection(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('tenant_id', tenantId)
      .not('failed_inspection_date', 'is', null)
      .is('deleted_at', null)
      .order('reinspection_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findWithVersions(id: string): Promise<ComplianceDocumentWithVersions | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('compliance_documents')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return data as ComplianceDocumentWithVersions;
  }

  // ============================================================
  // COUNT METHODS (for dashboard performance)
  // ============================================================

  /**
   * Count documents expiring within specified days
   */
  async countExpiringSoon(daysAhead: number): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('expiration_date', today)
      .lte('expiration_date', futureDateStr)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count total documents
   */
  async countTotal(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count documents by status
   */
  async countByStatus(status: ComplianceStatus): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count expired documents
   */
  async countExpired(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('compliance_documents')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('expiration_date', today)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
