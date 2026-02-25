import { z } from "zod";
import { optionalNullableUuid } from "./shared";

/**
 * Budget Validation Schemas
 *
 * Budgets track annual spending limits per category and/or location.
 * Spend is calculated dynamically from completed ticket costs, not stored.
 */

// Current year for validation
const currentYear = new Date().getFullYear();

// ============================================================
// CREATE BUDGET SCHEMA
// ============================================================

export const createBudgetSchema = z.object({
  // Location is optional - null means tenant-wide budget
  location_id: optionalNullableUuid("Invalid location ID"),

  // Category should match ticket_categories.name or 'total' for all categories
  category: z
    .string()
    .min(1, "Category is required")
    .max(100, "Category must be 100 characters or less")
    .transform((val) => val.toLowerCase()),

  // Fiscal year (calendar year)
  fiscal_year: z
    .number({ message: "Fiscal year is required" })
    .int("Fiscal year must be a whole number")
    .min(2020, "Fiscal year must be 2020 or later")
    .max(
      currentYear + 5,
      `Fiscal year cannot be more than 5 years in the future`,
    ),

  // Annual budget amount
  annual_budget: z
    .number({ message: "Budget amount is required" })
    .positive("Budget must be a positive number")
    .max(999999999.99, "Budget cannot exceed $999,999,999.99"),

  // Optional notes
  notes: z
    .string()
    .max(1000, "Notes cannot exceed 1000 characters")
    .nullish()
    .transform((val) => val || null),
});

// ============================================================
// UPDATE BUDGET SCHEMA
// ============================================================

export const updateBudgetSchema = z.object({
  location_id: optionalNullableUuid("Invalid location ID"),

  category: z
    .string()
    .min(1)
    .max(100)
    .transform((val) => val.toLowerCase())
    .optional(),

  fiscal_year: z
    .number()
    .int()
    .min(2020)
    .max(currentYear + 5)
    .optional(),

  annual_budget: z.number().positive().max(999999999.99).optional(),

  notes: z
    .string()
    .max(1000)
    .nullish()
    .transform((val) => val || null),
});

// ============================================================
// FILTER SCHEMAS
// ============================================================

export const budgetFiltersSchema = z.object({
  fiscal_year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(currentYear + 5)
    .optional(),
  location_id: optionalNullableUuid("Invalid location ID"),
  category: z.string().max(100).optional(),
  alert_level: z.enum(["none", "warning", "danger", "over"]).optional(),
  with_spend: z.coerce.boolean().optional().default(true),
});

export const budgetChartFiltersSchema = z.object({
  fiscal_year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(currentYear + 5)
    .optional(),
  location_id: optionalNullableUuid("Invalid location ID"),
});

// ============================================================
// TYPE EXPORTS
// ============================================================

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>;
export type BudgetChartFilters = z.infer<typeof budgetChartFiltersSchema>;
