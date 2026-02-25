import { z } from "zod";

/**
 * Validation schemas for location management
 * Used at API boundaries to validate request data
 */

export const createLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().length(2, "State must be 2 characters").optional(),
  zip: z.string().max(20).optional(),
  phone: z.string().max(20).optional(),
  square_footage: z
    .number()
    .positive("Square footage must be positive")
    .optional(),
  manager_id: z.string().uuid("Manager ID must be a valid UUID").optional(),
  emergency_contact_phone: z.string().max(20).optional(),
  status: z
    .enum(["active", "temporarily_closed", "permanently_closed"])
    .default("active"),
  opened_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
});

export const updateLocationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  address: z.string().max(200).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z
    .string()
    .length(2, "State must be 2 characters")
    .nullable()
    .optional(),
  zip: z.string().max(20).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  square_footage: z
    .number()
    .positive("Square footage must be positive")
    .nullable()
    .optional(),
  manager_id: z
    .string()
    .uuid("Manager ID must be a valid UUID")
    .nullable()
    .optional(),
  emergency_contact_phone: z.string().max(20).nullable().optional(),
  status: z
    .enum(["active", "temporarily_closed", "permanently_closed"])
    .optional(),
  opened_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
  closed_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .nullable()
    .optional(),
});

export const assignManagerSchema = z.object({
  manager_id: z.string().uuid("Manager ID must be a valid UUID").nullable(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
