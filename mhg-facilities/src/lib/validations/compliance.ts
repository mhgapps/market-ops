import { z } from 'zod'
import { uuid, optionalNullableUuid, uuidArray } from './shared'

export const createComplianceDocTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  name_es: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  default_alert_days: z.array(z.number().int().positive()).nullable().optional(),
  renewal_checklist: z.record(z.string(), z.any()).nullable().optional(),
  is_location_specific: z.boolean().optional(),
})

export const updateComplianceDocTypeSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  name_es: z.string().max(200).nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  default_alert_days: z.array(z.number().int().positive()).nullable().optional(),
  renewal_checklist: z.record(z.string(), z.any()).nullable().optional(),
  is_location_specific: z.boolean().optional(),
})

export const createComplianceDocSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  document_type_id: optionalNullableUuid(),
  location_id: optionalNullableUuid(),
  location_ids: uuidArray().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  expiration_date: z.string().min(1, 'Expiration date is required'),
  issuing_authority: z.string().max(200).nullable().optional(),
  document_number: z.string().max(100).nullable().optional(),
  file_path: z.string().nullable().optional(),
  renewal_cost: z.number().positive().nullable().optional(),
  renewal_assigned_to: optionalNullableUuid(),
  notes: z.string().max(2000).nullable().optional(),
}).refine(
  data => !data.location_id || !data.location_ids || data.location_ids.length === 0,
  { message: 'Cannot specify both location_id and location_ids' }
)

export const updateComplianceDocSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  document_type_id: optionalNullableUuid(),
  location_id: optionalNullableUuid(),
  location_ids: uuidArray().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  expiration_date: z.string().optional(),
  issuing_authority: z.string().max(200).nullable().optional(),
  document_number: z.string().max(100).nullable().optional(),
  file_path: z.string().nullable().optional(),
  status: z.enum(['active', 'expiring_soon', 'expired', 'pending_renewal', 'conditional', 'failed_inspection', 'suspended']).optional(),
  renewal_cost: z.number().positive().nullable().optional(),
  renewal_assigned_to: optionalNullableUuid(),
  notes: z.string().max(2000).nullable().optional(),
})

export const markAsRenewedSchema = z.object({
  new_expiration_date: z.string().min(1, 'New expiration date is required'),
})

export const markAsConditionalSchema = z.object({
  requirements: z.string().min(1, 'Requirements are required'),
  deadline: z.string().min(1, 'Deadline is required'),
})

export const markAsFailedInspectionSchema = z.object({
  corrective_action: z.string().min(1, 'Corrective action is required'),
  reinspection_date: z.string().min(1, 'Reinspection date is required'),
})

export const complianceFiltersSchema = z.object({
  location_id: uuid().optional(),
  document_type_id: uuid().optional(),
  status: z.enum(['active', 'expiring_soon', 'expired', 'pending_renewal', 'conditional', 'failed_inspection', 'suspended']).optional(),
  search: z.string().optional(),
})
