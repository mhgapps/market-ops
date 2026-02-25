import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database";

type ComplianceDocument =
  Database["public"]["Tables"]["compliance_documents"]["Row"];
type _ComplianceDocumentInsert =
  Database["public"]["Tables"]["compliance_documents"]["Insert"];
type ComplianceStatus = Database["public"]["Enums"]["compliance_status"];

interface ComplianceDocumentWithVersions extends ComplianceDocument {
  versions?: Array<{
    id: string;
    version: number;
    file_path: string;
    uploaded_at: string;
    uploaded_by: string;
  }>;
}

export class ComplianceDocumentDAO extends BaseDAO<"compliance_documents"> {
  constructor() {
    super("compliance_documents");
  }

  async findByLocation(locationId: string): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .or(`location_id.eq.${locationId},location_ids.cs.{${locationId}}`)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByType(typeId: string): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("document_type_id", typeId)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByStatus(status: ComplianceStatus): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", status)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findExpiringSoon(daysAhead: number): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("expiration_date", today)
      .lte("expiration_date", futureDateStr)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findExpired(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .lt("expiration_date", today)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findConditional(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_conditional", true)
      .is("deleted_at", null)
      .order("conditional_deadline", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findFailedInspection(): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .not("failed_inspection_date", "is", null)
      .is("deleted_at", null)
      .order("reinspection_date", { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findWithVersions(
    id: string,
  ): Promise<ComplianceDocumentWithVersions | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
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
    const futureDateStr = futureDate.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await supabase
      .from("compliance_documents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .gte("expiration_date", today)
      .lte("expiration_date", futureDateStr)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count total documents
   */
  async countTotal(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from("compliance_documents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count documents by status
   */
  async countByStatus(status: ComplianceStatus): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from("compliance_documents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("status", status)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count expired documents
   */
  async countExpired(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split("T")[0];

    const { count, error } = await supabase
      .from("compliance_documents")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .lt("expiration_date", today)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Get counts grouped by status (for charts)
   * PERFORMANCE: Uses efficient COUNT queries instead of loading all documents
   */
  async getStatusCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient();

    const statuses: ComplianceStatus[] = [
      "active",
      "expiring_soon",
      "expired",
      "pending_renewal",
      "conditional",
      "failed_inspection",
      "suspended",
    ];

    // Run COUNT queries in parallel for each status
    const countPromises = statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("compliance_documents")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", tenantId)
        .eq("status", status)
        .is("deleted_at", null);

      if (error) throw new Error(error.message);
      return { status, count: count || 0 };
    });

    const results = await Promise.all(countPromises);

    const counts: Record<string, number> = {};
    results.forEach(({ status, count }) => {
      if (count > 0) {
        counts[status] = count;
      }
    });

    return counts;
  }

  /**
   * Find recent expiring documents with a limit
   * PERFORMANCE: Limits at database level
   */
  async findRecentExpiring(
    daysAhead: number,
    limit: number = 5,
  ): Promise<ComplianceDocument[]> {
    const { supabase, tenantId } = await this.getClient();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const futureDateStr = futureDate.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("*")
      .eq("tenant_id", tenantId)
      .gte("expiration_date", today)
      .lte("expiration_date", futureDateStr)
      .is("deleted_at", null)
      .order("expiration_date", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Get counts grouped by document type (for reports)
   * PERFORMANCE: Only fetches document_type_id column
   */
  async getTypeCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("document_type_id")
      .eq("tenant_id", tenantId)
      .not("document_type_id", "is", null)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    if (data) {
      data.forEach((row: { document_type_id: string }) => {
        counts[row.document_type_id] = (counts[row.document_type_id] || 0) + 1;
      });
    }
    return counts;
  }

  /**
   * Get counts grouped by location (for reports)
   * PERFORMANCE: Only fetches location_id column
   */
  async getLocationCounts(): Promise<Record<string, number>> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_documents")
      .select("location_id")
      .eq("tenant_id", tenantId)
      .not("location_id", "is", null)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);

    const counts: Record<string, number> = {};
    if (data) {
      data.forEach((row: { location_id: string }) => {
        counts[row.location_id] = (counts[row.location_id] || 0) + 1;
      });
    }
    return counts;
  }
}
