import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database-extensions";

type ComplianceDocumentVersion =
  Database["public"]["Tables"]["compliance_document_versions"]["Row"];
type ComplianceDocumentVersionInsert =
  Database["public"]["Tables"]["compliance_document_versions"]["Insert"];

/**
 * Compliance Document Version DAO
 * Note: This is an audit-only table with no soft deletes
 */
export class ComplianceDocumentVersionDAO extends BaseDAO<"compliance_document_versions"> {
  constructor() {
    super("compliance_document_versions");
  }

  /**
   * Find all versions for a document
   */
  async findByDocumentId(
    documentId: string,
  ): Promise<ComplianceDocumentVersion[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false });

    if (error) {
      throw new Error(`Failed to find document versions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get latest version for a document
   */
  async getLatestVersion(
    documentId: string,
  ): Promise<ComplianceDocumentVersion | null> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get latest version: ${error.message}`);
    }

    return data;
  }

  /**
   * Get next version number for a document
   */
  async getNextVersionNumber(documentId: string): Promise<number> {
    const latestVersion = await this.getLatestVersion(documentId);
    return latestVersion ? latestVersion.version_number + 1 : 1;
  }

  /**
   * Create new version (no tenant isolation - uses document_id)
   */
  async createVersion(
    data: Omit<ComplianceDocumentVersionInsert, "version_number">,
  ): Promise<ComplianceDocumentVersion> {
    const { supabase } = await this.getClient();

    const versionNumber = await this.getNextVersionNumber(data.document_id!);

    const { data: newVersion, error } = await supabase
      .from(this.tableName)
      .insert({
        ...data,
        version_number: versionNumber,
      } as never)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create document version: ${error.message}`);
    }

    return newVersion;
  }
}
