import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database";

type TicketComment = Database["public"]["Tables"]["ticket_comments"]["Row"];
type TicketCommentInsert =
  Database["public"]["Tables"]["ticket_comments"]["Insert"];

export interface TicketCommentWithUser extends TicketComment {
  user?: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

/**
 * Ticket Comment Data Access Object
 * Provides database operations for ticket comments with tenant isolation
 */
export class TicketCommentDAO extends BaseDAO<"ticket_comments"> {
  constructor() {
    super("ticket_comments");
  }

  /**
   * Find all comments for a ticket with user details
   */
  async findByTicketId(
    ticketId: string,
    includeInternal = false,
  ): Promise<TicketCommentWithUser[]> {
    const { supabase } = await this.getClient();

    let query = supabase
      .from("ticket_comments")
      .select(
        `
        *,
        user:users (
          id,
          full_name,
          email
        )
      `,
      )
      .eq("ticket_id", ticketId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    // Filter internal comments if requested
    if (!includeInternal) {
      query = query.eq("is_internal", false);
    }

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return (data ?? []) as TicketCommentWithUser[];
  }

  /**
   * Find comments by user
   */
  async findByUserId(userId: string): Promise<TicketComment[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("ticket_comments")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Count comments for a ticket
   */
  async countByTicketId(
    ticketId: string,
    includeInternal = false,
  ): Promise<number> {
    const { supabase } = await this.getClient();

    let query = supabase
      .from("ticket_comments")
      .select("*", { count: "exact", head: true })
      .eq("ticket_id", ticketId)
      .is("deleted_at", null);

    if (!includeInternal) {
      query = query.eq("is_internal", false);
    }

    const { count, error } = await query;

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Create comment with explicit types
   */
  async createComment(
    data: Omit<TicketCommentInsert, "created_at" | "deleted_at">,
  ): Promise<TicketComment> {
    const { supabase } = await this.getClient();

    // Comments don't have tenant_id, so we bypass BaseDAO.create
    // Use any-typed query to bypass strict Supabase typing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("ticket_comments") as any;
    const result = await query.insert(data).select().single();

    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error("Failed to create comment");

    return result.data as TicketComment;
  }
}
