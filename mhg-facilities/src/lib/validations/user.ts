import { z } from "zod";

/**
 * Validation schemas for user management
 * Used at API boundaries to validate request data
 */

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "staff", "vendor", "readonly"], {
    message: "Invalid role",
  }),
  location_id: z.string().uuid("Location ID must be a valid UUID").optional(),
});

export const updateUserSchema = z.object({
  full_name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  role: z.enum(["admin", "manager", "staff", "vendor", "readonly"]).optional(),
  is_active: z.boolean().optional(),
  location_id: z
    .string()
    .uuid("Location ID must be a valid UUID")
    .nullable()
    .optional(),
  phone: z.string().max(20).nullable().optional(),
  language_preference: z.enum(["en", "es"]).optional(),
  notification_preferences: z
    .object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    })
    .optional(),
});

export const updateProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  phone: z.string().max(20).nullable().optional(),
  language_preference: z.enum(["en", "es"]).optional(),
  notification_preferences: z
    .object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    current_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    new_password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const acceptInviteSchema = z.object({
  token: z.string().min(1, "Token is required"),
  full_name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
