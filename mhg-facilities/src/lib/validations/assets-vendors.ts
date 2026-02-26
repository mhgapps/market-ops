import { z } from "zod";
import { uuid, optionalUuid, nullableUuid, uuidArray } from "./shared";

/**
 * Asset Category Validation Schemas
 */

export const createAssetCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  default_lifespan_years: z.number().int().positive().optional(),
  parent_category_id: nullableUuid().optional(),
});

export const updateAssetCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  default_lifespan_years: z.number().int().positive().optional(),
  parent_category_id: nullableUuid().optional(),
});

/**
 * Asset Type Validation Schemas
 */

export const createAssetTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  category_id: uuid("Invalid category ID"),
  description: z.string().max(500).optional(),
});

export const updateAssetTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category_id: uuid("Invalid category ID").optional(),
  description: z.string().max(500).optional(),
});

/**
 * Asset Vendor Entry Schemas
 */

export const assetVendorEntrySchema = z.object({
  vendor_id: uuid("Invalid vendor ID"),
  is_primary: z.boolean(),
  notes: z.string().max(500).nullish(),
});

export const assetVendorsArraySchema = z
  .array(assetVendorEntrySchema)
  .refine(
    (vendors) => {
      if (vendors.length === 0) return true;
      const primaryCount = vendors.filter((v) => v.is_primary).length;
      return primaryCount === 1;
    },
    { message: "Exactly one vendor must be marked as primary" },
  )
  .refine(
    (vendors) => {
      const vendorIds = vendors.map((v) => v.vendor_id);
      return new Set(vendorIds).size === vendorIds.length;
    },
    { message: "Duplicate vendor IDs are not allowed" },
  );

/**
 * Asset Validation Schemas
 */

export const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(200),
  category_id: optionalUuid,
  asset_type_id: optionalUuid,
  location_id: uuid("Location is required"),
  serial_number: z
    .string()
    .max(100)
    .nullish()
    .transform((val) => val || undefined),
  model: z
    .string()
    .max(100)
    .nullish()
    .transform((val) => val || undefined),
  manufacturer: z
    .string()
    .max(100)
    .nullish()
    .transform((val) => val || undefined),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullish()
    .or(z.literal(""))
    .transform((val) => val || undefined),
  purchase_price: z.number().positive().nullish(),
  warranty_expiration: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
    .nullish()
    .or(z.literal(""))
    .transform((val) => val || undefined),
  expected_lifespan_years: z.number().int().positive().nullish(),
  notes: z
    .string()
    .max(1000)
    .nullish()
    .transform((val) => val || undefined),
  qr_code: z
    .string()
    .max(50)
    .nullish()
    .transform((val) => val || undefined),
  vendors: assetVendorsArraySchema.optional(),
  status: z
    .enum(["active", "under_maintenance", "retired", "transferred", "disposed"])
    .optional(),
  photo_path: z
    .string()
    .max(500)
    .nullish()
    .transform((val) => val || undefined),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category_id: nullableUuid().optional(),
  asset_type_id: nullableUuid().optional(),
  location_id: nullableUuid().optional(),
  serial_number: z.string().max(100).nullish(),
  model: z.string().max(100).nullish(),
  manufacturer: z.string().max(100).nullish(),
  purchase_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  purchase_price: z.number().positive().nullish(),
  warranty_expiration: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  expected_lifespan_years: z.number().int().positive().nullish(),
  notes: z.string().max(1000).nullish(),
  vendors: assetVendorsArraySchema.optional(),
  status: z
    .enum(["active", "under_maintenance", "retired", "transferred", "disposed"])
    .optional(),
  photo_path: z.string().max(500).nullish(),
});

export const assetFilterSchema = z.object({
  category_id: uuid().optional(),
  asset_type_id: uuid().optional(),
  location_id: uuid().optional(),
  vendor_id: uuid().optional(),
  status: z
    .enum(["active", "under_maintenance", "retired", "transferred", "disposed"])
    .optional(),
  warranty_expiring_days: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

/**
 * Asset Transfer Validation Schemas
 */

export const transferAssetSchema = z.object({
  to_location_id: uuid("Invalid location ID"),
  transferred_by: uuid("Invalid user ID"),
  reason: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export const bulkTransferAssetSchema = z.object({
  asset_ids: uuidArray().min(1, "At least one asset is required"),
  to_location_id: uuid("Invalid location ID"),
  transferred_by: uuid("Invalid user ID"),
  reason: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Vendor Validation Schemas
 */

export const createVendorSchema = z
  .object({
    name: z.string().min(1, "Vendor name is required").max(200),
    contact_name: z.string().max(100).nullish(),
    email: z.string().email("Invalid email format").nullish(),
    phone: z.string().max(20).nullish(),
    emergency_phone: z.string().max(20).nullish(),
    address: z.string().max(500).nullish(),
    service_categories: z.array(z.string()).nullish(),
    is_preferred: z.boolean().optional(),
    contract_start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullish(),
    contract_expiration: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullish(),
    insurance_expiration: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .nullish(),
    insurance_minimum_required: z.number().positive().nullish(),
    hourly_rate: z.number().positive().nullish(),
    notes: z.string().max(2000).nullish(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.contract_start_date && data.contract_expiration) {
        return (
          new Date(data.contract_start_date) <=
          new Date(data.contract_expiration)
        );
      }
      return true;
    },
    {
      message: "Contract start date must be before or equal to expiration date",
      path: ["contract_expiration"],
    },
  );

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contact_name: z.string().max(100).nullish(),
  email: z.string().email("Invalid email format").nullish(),
  phone: z.string().max(20).nullish(),
  emergency_phone: z.string().max(20).nullish(),
  address: z.string().max(500).nullish(),
  service_categories: z.array(z.string()).nullish(),
  is_preferred: z.boolean().optional(),
  contract_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  contract_expiration: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  insurance_expiration: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullish(),
  insurance_minimum_required: z.number().positive().nullish(),
  hourly_rate: z.number().positive().nullish(),
  notes: z.string().max(2000).nullish(),
  is_active: z.boolean().optional(),
});

export const vendorFilterSchema = z.object({
  is_active: z.coerce.boolean().optional(),
  is_preferred: z.coerce.boolean().optional(),
  service_category: z.string().optional(),
  insurance_expiring_days: z.coerce.number().int().positive().optional(),
  contract_expiring_days: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(50),
});

/**
 * Vendor Rating Validation Schemas
 */

export const createVendorRatingSchema = z.object({
  ticket_id: nullableUuid().optional(),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  response_time_rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  quality_rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  cost_rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comments: z.string().max(2000).optional(),
});

/**
 * TypeScript types derived from schemas
 */

export type CreateAssetCategoryInput = z.infer<
  typeof createAssetCategorySchema
>;
export type UpdateAssetCategoryInput = z.infer<
  typeof updateAssetCategorySchema
>;
export type CreateAssetTypeInput = z.infer<typeof createAssetTypeSchema>;
export type UpdateAssetTypeInput = z.infer<typeof updateAssetTypeSchema>;

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetFilterInput = z.infer<typeof assetFilterSchema>;

export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
export type BulkTransferAssetInput = z.infer<typeof bulkTransferAssetSchema>;

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export type VendorFilterInput = z.infer<typeof vendorFilterSchema>;

export type CreateVendorRatingInput = z.infer<typeof createVendorRatingSchema>;

export type AssetVendorEntryInput = z.infer<typeof assetVendorEntrySchema>;
