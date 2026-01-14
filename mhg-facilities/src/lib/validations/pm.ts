import { z } from 'zod';

export const createPMTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  checklist: z.record(z.string(), z.any()).nullable().optional(),
  estimated_duration_hours: z.number().positive().max(99.99).nullable().optional(),
  default_vendor_id: z.string().uuid().nullable().optional(),
});

export const updatePMTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  category: z.string().max(100).nullable().optional(),
  checklist: z.record(z.string(), z.any()).nullable().optional(),
  estimated_duration_hours: z.number().positive().max(99.99).nullable().optional(),
  default_vendor_id: z.string().uuid().nullable().optional(),
});

export const createPMScheduleSchema = z.object({
  template_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually']),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  month_of_year: z.number().int().min(1).max(12).nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  estimated_cost: z.number().positive().nullable().optional(),
}).refine(
  data => data.asset_id || data.location_id,
  { message: 'Either asset_id or location_id is required' }
).refine(
  data => !data.asset_id || !data.location_id,
  { message: 'Cannot specify both asset_id and location_id' }
);

export const updatePMScheduleSchema = z.object({
  template_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  asset_id: z.string().uuid().nullable().optional(),
  location_id: z.string().uuid().nullable().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually']).optional(),
  day_of_week: z.number().int().min(0).max(6).nullable().optional(),
  day_of_month: z.number().int().min(1).max(31).nullable().optional(),
  month_of_year: z.number().int().min(1).max(12).nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  vendor_id: z.string().uuid().nullable().optional(),
  estimated_cost: z.number().positive().nullable().optional(),
  is_active: z.boolean().optional(),
});

export const completePMScheduleSchema = z.object({
  ticket_id: z.string().uuid(),
  user_id: z.string().uuid(),
  checklist_results: z.record(z.string(), z.any()).nullable().optional(),
});

export const pmFiltersSchema = z.object({
  asset_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually']).optional(),
  is_active: z.boolean().optional(),
});
