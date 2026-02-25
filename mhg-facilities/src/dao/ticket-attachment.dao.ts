import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database";

type TicketAttachment =
  Database["public"]["Tables"]["ticket_attachments"]["Row"];
type TicketAttachmentInsert =
  Database["public"]["Tables"]["ticket_attachments"]["Insert"];

export type AttachmentType =
  | "initial"
  | "progress"
  | "completion"
  | "invoice"
  | "quote";

export interface TicketAttachmentWithUser extends TicketAttachment {
  uploader?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

/**
 * Ticket Attachment Data Access Object
 * Provides database operations for ticket attachments with tenant isolation
 */
export class TicketAttachmentDAO extends BaseDAO<"ticket_attachments"> {
  constructor() {
    super("ticket_attachments");
  }

  /**
   * Find all attachments for a ticket with uploader details
   */
  async findByTicketId(ticketId: string): Promise<TicketAttachmentWithUser[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("ticket_attachments")
      .select(
        `
        *,
        uploader:users!uploaded_by (
          id,
          full_name,
          email
        )
      `,
      )
      .eq("ticket_id", ticketId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []) as TicketAttachmentWithUser[];
  }

  /**
   * Find attachments by type for a ticket
   */
  async findByTicketIdAndType(
    ticketId: string,
    attachmentType: AttachmentType,
  ): Promise<TicketAttachment[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("ticket_attachments")
      .select("*")
      .eq("ticket_id", ticketId)
      .eq("attachment_type", attachmentType)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Count attachments for a ticket
   */
  async countByTicketId(ticketId: string): Promise<number> {
    const { supabase } = await this.getClient();

    const { count, error } = await supabase
      .from("ticket_attachments")
      .select("*", { count: "exact", head: true })
      .eq("ticket_id", ticketId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Get total file size for a ticket
   */
  async getTotalSizeByTicketId(ticketId: string): Promise<number> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("ticket_attachments")
      .select("file_size_bytes")
      .eq("ticket_id", ticketId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);

    const attachments = data as Array<{ file_size_bytes: number }> | null;
    return (
      attachments?.reduce(
        (total, att) => total + (att.file_size_bytes || 0),
        0,
      ) ?? 0
    );
  }

  /**
   * Create attachment with explicit types
   */
  async createAttachment(
    data: Omit<TicketAttachmentInsert, "created_at" | "deleted_at">,
  ): Promise<TicketAttachment> {
    const { supabase } = await this.getClient();

    // Attachments don't have tenant_id, so we bypass BaseDAO.create
    // Use any-typed query to bypass strict Supabase typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("ticket_attachments") as any;
    const result = await query.insert(data).select().single();

    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("Failed to create attachment");

    return result.data as TicketAttachment;
  }
}
