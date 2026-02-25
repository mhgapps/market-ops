import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database-extensions";

type ComplianceDocumentType =
  Database["public"]["Tables"]["compliance_document_types"]["Row"];
type _ComplianceDocumentTypeInsert =
  Database["public"]["Tables"]["compliance_document_types"]["Insert"];

interface ComplianceDocumentTypeWithCount extends ComplianceDocumentType {
  document_count: number;
}

export class ComplianceDocumentTypeDAO extends BaseDAO<"compliance_document_types"> {
  constructor() {
    super("compliance_document_types");
  }

  async findWithUsageCount(): Promise<ComplianceDocumentTypeWithCount[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("compliance_document_types")
      .select(
        `
        *,
        compliance_documents!compliance_documents_document_type_id_fkey(id)
      `,
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
      ...(item as ComplianceDocumentType),
      document_count: item.compliance_documents?.length || 0,
      compliance_documents: undefined,
    })) as ComplianceDocumentTypeWithCount[];
  }
}
