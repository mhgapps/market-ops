import { z } from "zod";
import { uuid, optionalNullableUuid, uuidArray } from "./shared";

// Ticket status and priority enums
const ticketStatuses = [
  "submitted",
  "in_progress",
  "completed",
  "closed",
  "rejected",
  "on_hold",
] as const;

const ticketPriorities = ["low", "medium", "high", "critical"] as const;

const attachmentTypes = [
  "initial",
  "progress",
  "completion",
  "invoice",
  "quote",
] as const;

// ============================================================
// TICKET SCHEMAS
// ============================================================

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  category_id: uuid("Invalid category ID").optional(),
  location_id: uuid("Invalid location ID"),
  asset_id: optionalNullableUuid("Invalid asset ID"),
  priority: z.enum(ticketPriorities).default("medium"),
  is_emergency: z.boolean().default(false),
  submitted_by: uuid("Invalid user ID"),
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .optional(),
  category_id: uuid("Invalid category ID").optional(),
  priority: z.enum(ticketPriorities).optional(),
  due_date: z.string().datetime("Invalid date format").optional(),
});

export const ticketFiltersSchema = z.object({
  status: z.array(z.enum(ticketStatuses)).optional(),
  priority: z.array(z.enum(ticketPriorities)).optional(),
  location_id: uuid("Invalid location ID").optional(),
  assigned_to: uuid("Invalid user ID").optional(),
  submitted_by: uuid("Invalid user ID").optional(),
  date_from: z.string().datetime("Invalid date format").optional(),
  date_to: z.string().datetime("Invalid date format").optional(),
  search: z.string().max(200, "Search query too long").optional(),
  is_emergency: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

export const assignTicketSchema = z.object({
  assignee_id: uuid("Invalid assignee ID"),
  assigner_id: uuid("Invalid assigner ID"),
});

export const assignVendorSchema = z.object({
  vendor_id: uuid("Invalid vendor ID"),
  assigner_id: uuid("Invalid assigner ID"),
});

export const completeTicketSchema = z.object({
  actual_cost: z.number().min(0, "Cost must be non-negative").optional(),
});

export const rejectTicketSchema = z.object({
  reason: z
    .string()
    .min(10, "Rejection reason must be at least 10 characters")
    .max(1000, "Reason too long"),
});

export const holdTicketSchema = z.object({
  reason: z
    .string()
    .min(10, "Hold reason must be at least 10 characters")
    .max(1000, "Reason too long"),
});

export const checkDuplicateSchema = z.object({
  location_id: uuid("Invalid location ID"),
  asset_id: optionalNullableUuid("Invalid asset ID"),
  title: z.string().min(5, "Title must be at least 5 characters"),
});

export const markDuplicateSchema = z.object({
  original_ticket_id: uuid("Invalid ticket ID"),
});

export const mergeTicketsSchema = z.object({
  target_id: uuid("Invalid target ticket ID"),
  source_ids: uuidArray("Invalid source ticket ID").min(
    1,
    "At least one source ticket required",
  ),
});

// ============================================================
// TICKET CATEGORY SCHEMAS
// ============================================================

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  name_es: z.string().min(2).max(100).optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  default_priority: z.enum(ticketPriorities).default("medium"),
  default_assignee_id: uuid("Invalid assignee ID").optional(),
  preferred_vendor_id: uuid("Invalid vendor ID").optional(),
  escalation_hours: z
    .number()
    .int()
    .min(1, "Escalation hours must be at least 1")
    .default(4),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  name_es: z.string().min(2).max(100).optional(),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  default_priority: z.enum(ticketPriorities).optional(),
  default_assignee_id: optionalNullableUuid("Invalid assignee ID"),
  preferred_vendor_id: optionalNullableUuid("Invalid vendor ID"),
  escalation_hours: z
    .number()
    .int()
    .min(1, "Escalation hours must be at least 1")
    .optional(),
});

// ============================================================
// COMMENT SCHEMAS
// ============================================================

export const createCommentSchema = z.object({
  comment: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment cannot exceed 5000 characters"),
  is_internal: z.boolean().default(false),
});

// ============================================================
// ATTACHMENT SCHEMAS
// ============================================================

export const uploadAttachmentSchema = z.object({
  attachment_type: z.enum(attachmentTypes),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type TicketFilters = z.infer<typeof ticketFiltersSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;
export type AssignVendorInput = z.infer<typeof assignVendorSchema>;
export type CompleteTicketInput = z.infer<typeof completeTicketSchema>;
export type RejectTicketInput = z.infer<typeof rejectTicketSchema>;
export type HoldTicketInput = z.infer<typeof holdTicketSchema>;
export type CheckDuplicateInput = z.infer<typeof checkDuplicateSchema>;
export type MarkDuplicateInput = z.infer<typeof markDuplicateSchema>;
export type MergeTicketsInput = z.infer<typeof mergeTicketsSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
