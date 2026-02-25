import { TicketCommentDAO } from "@/dao/ticket-comment.dao";
import type { Database } from "@/types/database";

type TicketComment = Database["public"]["Tables"]["ticket_comments"]["Row"];

export interface AddCommentInput {
  ticket_id: string;
  user_id: string;
  comment: string;
  is_internal?: boolean;
}

/**
 * Ticket Comment Service
 * Handles business logic for ticket comments
 */
export class TicketCommentService {
  constructor(private commentDAO = new TicketCommentDAO()) {}

  /**
   * Get all comments for a ticket
   * @param ticketId - Ticket ID
   * @param includeInternal - Whether to include internal comments (admin/manager only)
   */
  async getComments(ticketId: string, includeInternal = false) {
    return this.commentDAO.findByTicketId(ticketId, includeInternal);
  }

  /**
   * Add comment to ticket
   */
  async addComment(input: AddCommentInput): Promise<TicketComment> {
    // Validate comment content
    if (!input.comment || input.comment.trim().length === 0) {
      throw new Error("Comment cannot be empty");
    }

    if (input.comment.length > 5000) {
      throw new Error("Comment cannot exceed 5000 characters");
    }

    return this.commentDAO.createComment({
      ticket_id: input.ticket_id,
      user_id: input.user_id,
      comment: input.comment.trim(),
      is_internal: input.is_internal ?? false,
    });
  }

  /**
   * Delete comment (soft delete)
   * Only the comment author or admin can delete
   */
  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<void> {
    // Get comment to verify ownership
    const comment = (await this.commentDAO.findById(
      commentId,
    )) as TicketComment | null;
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check permissions: must be author or admin
    if (comment.user_id !== userId && userRole !== "admin") {
      throw new Error("You do not have permission to delete this comment");
    }

    await this.commentDAO.softDelete(commentId);
  }

  /**
   * Get comment count for a ticket
   */
  async getCommentCount(
    ticketId: string,
    includeInternal = false,
  ): Promise<number> {
    return this.commentDAO.countByTicketId(ticketId, includeInternal);
  }
}
