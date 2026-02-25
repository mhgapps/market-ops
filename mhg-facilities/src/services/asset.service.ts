import {
  AssetDAO,
  type AssetWithRelations,
  type AssetFilters,
} from "@/dao/asset.dao";

// Re-export types for consumers
export type { AssetFilters, PaginatedResult } from "@/dao/asset.dao";
import { AssetCategoryDAO } from "@/dao/asset-category.dao";
import { AssetTypeDAO } from "@/dao/asset-type.dao";
import type { Database } from "@/types/database";
import { nanoid } from "nanoid";

type Asset = Database["public"]["Tables"]["assets"]["Row"];
type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
type AssetUpdate = Database["public"]["Tables"]["assets"]["Update"];

export interface CreateAssetDTO {
  name: string;
  category_id?: string;
  asset_type_id?: string;
  location_id?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiration?: string;
  expected_lifespan_years?: number;
  vendor_id?: string;
  status?: string;
  notes?: string;
  // File paths (uploaded separately)
  manual_url?: string;
  spec_sheet_path?: string;
  photo_path?: string;
}

export interface UpdateAssetDTO {
  name?: string;
  category_id?: string | null;
  asset_type_id?: string | null;
  location_id?: string | null;
  serial_number?: string | null;
  model?: string | null;
  manufacturer?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  warranty_expiration?: string | null;
  expected_lifespan_years?: number | null;
  vendor_id?: string | null;
  status?: string;
  notes?: string | null;
  manual_url?: string | null;
  spec_sheet_path?: string | null;
  photo_path?: string | null;
}

/**
 * Service for managing assets
 * Handles asset CRUD, QR code generation, warranty tracking
 */
export class AssetService {
  constructor(
    private assetDAO = new AssetDAO(),
    private categoryDAO = new AssetCategoryDAO(),
    private typeDAO = new AssetTypeDAO(),
  ) {}

  /**
   * Get all assets with optional filters
   */
  async getAllAssets(filters?: AssetFilters): Promise<AssetWithRelations[]> {
    return this.assetDAO.findWithRelations(filters);
  }

  /**
   * Get all assets with pagination
   * Returns paginated results with total count
   * @param filters Optional filters including page and pageSize
   */
  async getAllAssetsPaginated(filters?: AssetFilters) {
    return this.assetDAO.findWithRelationsPaginated(filters);
  }

  /**
   * Get asset by ID with relations
   */
  async getAssetById(id: string): Promise<AssetWithRelations | null> {
    return this.assetDAO.findByIdWithRelations(id);
  }

  /**
   * Get assets by location
   */
  async getAssetsByLocation(locationId: string): Promise<Asset[]> {
    return this.assetDAO.findByLocation(locationId);
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(categoryId: string): Promise<Asset[]> {
    return this.assetDAO.findByCategory(categoryId);
  }

  /**
   * Get assets with expiring warranties
   */
  async getAssetsWithExpiringWarranty(
    daysAhead = 30,
  ): Promise<AssetWithRelations[]> {
    return this.assetDAO.findWarrantyExpiring(daysAhead);
  }

  /**
   * Search assets
   */
  async searchAssets(query: string): Promise<AssetWithRelations[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.assetDAO.search(query.trim());
  }

  /**
   * Find asset by QR code
   */
  async getAssetByQRCode(qrCode: string): Promise<AssetWithRelations | null> {
    return this.assetDAO.findByQRCode(qrCode);
  }

  /**
   * Create new asset
   */
  async createAsset(data: CreateAssetDTO): Promise<Asset> {
    let categoryId = data.category_id ?? null;
    const assetTypeId = data.asset_type_id ?? null;

    // Validate asset type and ensure it matches category (if both provided)
    if (assetTypeId) {
      const assetType = await this.typeDAO.findById(assetTypeId);
      if (!assetType) {
        throw new Error("Asset type not found");
      }

      if (categoryId && assetType.category_id !== categoryId) {
        throw new Error("Asset type does not belong to selected category");
      }

      // If category is omitted, infer it from the selected type
      if (!categoryId) {
        categoryId = assetType.category_id;
      }
    }

    // Validate category exists if provided
    if (categoryId) {
      const categoryExists = await this.categoryDAO.exists(categoryId);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
    }

    // Check for duplicate serial number if provided
    if (data.serial_number) {
      const existing = await this.assetDAO.findBySerialNumber(
        data.serial_number,
      );
      if (existing) {
        throw new Error("Asset with this serial number already exists");
      }
    }

    // Generate unique QR code
    const qrCode = await this.generateUniqueQRCode();

    // Calculate expected lifespan if not provided
    let expectedLifespan = data.expected_lifespan_years;
    if (!expectedLifespan && categoryId) {
      const category = await this.categoryDAO.findById(categoryId);
      if (category?.default_lifespan_years) {
        expectedLifespan = category.default_lifespan_years;
      }
    }

    const insertData: Partial<AssetInsert> = {
      name: data.name,
      category_id: categoryId,
      asset_type_id: assetTypeId,
      location_id: data.location_id ?? null,
      serial_number: data.serial_number ?? null,
      model: data.model ?? null,
      manufacturer: data.manufacturer ?? null,
      purchase_date: data.purchase_date ?? null,
      purchase_price: data.purchase_price ?? null,
      warranty_expiration: data.warranty_expiration ?? null,
      expected_lifespan_years: expectedLifespan ?? null,
      vendor_id: data.vendor_id ?? null,
      status:
        (data.status as Database["public"]["Enums"]["asset_status"]) ??
        "active",
      qr_code: qrCode,
      notes: data.notes ?? null,
      manual_url: data.manual_url ?? null,
      spec_sheet_path: data.spec_sheet_path ?? null,
      photo_path: data.photo_path ?? null,
    };

    return this.assetDAO.create(insertData);
  }

  /**
   * Update asset
   */
  async updateAsset(id: string, data: UpdateAssetDTO): Promise<Asset> {
    // Verify asset exists
    const asset = await this.assetDAO.findById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    // Validate category exists if changing
    if (data.category_id !== undefined && data.category_id !== null) {
      const categoryExists = await this.categoryDAO.exists(data.category_id);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
    }

    let nextCategoryId =
      data.category_id !== undefined ? data.category_id : asset.category_id;
    let nextAssetTypeId =
      data.asset_type_id !== undefined
        ? data.asset_type_id
        : asset.asset_type_id;

    // Validate asset type and enforce category compatibility
    if (nextAssetTypeId) {
      const assetType = await this.typeDAO.findById(nextAssetTypeId);
      if (!assetType) {
        throw new Error("Asset type not found");
      }

      if (nextCategoryId && assetType.category_id !== nextCategoryId) {
        // If only category changed, clear type to avoid stale mismatched pair.
        if (
          data.category_id !== undefined &&
          data.asset_type_id === undefined
        ) {
          nextAssetTypeId = null;
        } else {
          throw new Error("Asset type does not belong to selected category");
        }
      } else if (!nextCategoryId) {
        // If category is cleared/omitted while a type exists, infer category from type.
        nextCategoryId = assetType.category_id;
      }
    }

    // Check for duplicate serial number if changing
    if (data.serial_number && data.serial_number !== asset.serial_number) {
      const existing = await this.assetDAO.findBySerialNumber(
        data.serial_number,
      );
      if (existing && existing.id !== id) {
        throw new Error("Asset with this serial number already exists");
      }
    }

    const updateData: Partial<AssetUpdate> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (nextCategoryId !== asset.category_id)
      updateData.category_id = nextCategoryId;
    if (nextAssetTypeId !== asset.asset_type_id)
      updateData.asset_type_id = nextAssetTypeId;
    if (data.location_id !== undefined)
      updateData.location_id = data.location_id;
    if (data.serial_number !== undefined)
      updateData.serial_number = data.serial_number;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.manufacturer !== undefined)
      updateData.manufacturer = data.manufacturer;
    if (data.purchase_date !== undefined)
      updateData.purchase_date = data.purchase_date;
    if (data.purchase_price !== undefined)
      updateData.purchase_price = data.purchase_price;
    if (data.warranty_expiration !== undefined)
      updateData.warranty_expiration = data.warranty_expiration;
    if (data.expected_lifespan_years !== undefined)
      updateData.expected_lifespan_years = data.expected_lifespan_years;
    if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;
    if (data.status !== undefined)
      updateData.status =
        data.status as Database["public"]["Enums"]["asset_status"];
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.manual_url !== undefined) updateData.manual_url = data.manual_url;
    if (data.spec_sheet_path !== undefined)
      updateData.spec_sheet_path = data.spec_sheet_path;
    if (data.photo_path !== undefined) updateData.photo_path = data.photo_path;

    return this.assetDAO.update(id, updateData);
  }

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(id: string): Promise<void> {
    // Verify asset exists
    const asset = await this.assetDAO.findById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    // TODO: Check if asset has open tickets
    // This will be implemented once Ticket DAO integration is added

    await this.assetDAO.softDelete(id);
  }

  /**
   * Update asset status
   */
  async updateAssetStatus(
    id: string,
    status:
      | "active"
      | "under_maintenance"
      | "retired"
      | "transferred"
      | "disposed",
  ): Promise<Asset> {
    const asset = await this.assetDAO.findById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    return this.assetDAO.update(id, {
      status: status as Database["public"]["Enums"]["asset_status"],
    });
  }

  /**
   * Regenerate QR code for an asset
   */
  async regenerateQRCode(id: string): Promise<Asset> {
    const asset = await this.assetDAO.findById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    const newQRCode = await this.generateUniqueQRCode();

    return this.assetDAO.update(id, { qr_code: newQRCode });
  }

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<AssetStats> {
    const stats = await this.assetDAO.getStats();

    return {
      total: stats.total,
      active: stats.by_status["active"] ?? 0,
      under_maintenance: stats.by_status["under_maintenance"] ?? 0,
      retired: stats.by_status["retired"] ?? 0,
      transferred: stats.by_status["transferred"] ?? 0,
      disposed: stats.by_status["disposed"] ?? 0,
      warranty_expiring_soon: stats.warranty_expiring_30_days,
    };
  }

  /**
   * Check warranty status for an asset
   */
  async checkWarrantyStatus(id: string): Promise<WarrantyStatus> {
    const asset = await this.assetDAO.findById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    if (!asset.warranty_expiration) {
      return {
        has_warranty: false,
        is_expired: false,
        expires_soon: false,
        days_remaining: null,
        expiration_date: null,
      };
    }

    const expirationDate = new Date(asset.warranty_expiration);
    const today = new Date();
    const daysRemaining = Math.ceil(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      has_warranty: true,
      is_expired: daysRemaining < 0,
      expires_soon: daysRemaining > 0 && daysRemaining <= 30,
      days_remaining: daysRemaining,
      expiration_date: asset.warranty_expiration,
    };
  }

  /**
   * Generate unique QR code
   * Format: AST-{8 character nanoid}
   */
  private async generateUniqueQRCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const qrCode = `AST-${nanoid(8)}`;
      const existing = await this.assetDAO.findByQRCode(qrCode);

      if (!existing) {
        return qrCode;
      }

      attempts++;
    }

    throw new Error(
      "Failed to generate unique QR code after multiple attempts",
    );
  }
}

export interface AssetStats {
  total: number;
  active: number;
  under_maintenance: number;
  retired: number;
  transferred: number;
  disposed: number;
  warranty_expiring_soon: number;
}

export interface WarrantyStatus {
  has_warranty: boolean;
  is_expired: boolean;
  expires_soon: boolean;
  days_remaining: number | null;
  expiration_date: string | null;
}
