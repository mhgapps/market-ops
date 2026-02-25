import { AssetTypeDAO, type AssetTypeWithCategory } from "@/dao/asset-type.dao";
import { AssetCategoryDAO } from "@/dao/asset-category.dao";
import type { Database } from "@/types/database-extensions";

type AssetType = Database["public"]["Tables"]["asset_types"]["Row"];
type AssetTypeInsert = Database["public"]["Tables"]["asset_types"]["Insert"];
type AssetTypeUpdate = Database["public"]["Tables"]["asset_types"]["Update"];

export interface CreateAssetTypeDTO {
  name: string;
  category_id: string;
  description?: string;
}

export interface UpdateAssetTypeDTO {
  name?: string;
  category_id?: string;
  description?: string;
}

/**
 * Service for managing asset types
 * Handles specific equipment types within asset categories
 */
export class AssetTypeService {
  constructor(
    private typeDAO = new AssetTypeDAO(),
    private categoryDAO = new AssetCategoryDAO(),
  ) {}

  /**
   * Get all asset types for current tenant
   */
  async getAllTypes(): Promise<AssetTypeWithCategory[]> {
    return this.typeDAO.findWithCategory();
  }

  /**
   * Get asset type by ID
   */
  async getTypeById(id: string): Promise<AssetTypeWithCategory | null> {
    const type = await this.typeDAO.findById(id);
    if (!type) return null;

    // Fetch category info if exists
    if (type.category_id) {
      const category = await this.categoryDAO.findById(type.category_id);
      return {
        ...type,
        category: category
          ? {
              id: category.id,
              name: category.name,
            }
          : null,
      };
    }

    return type as AssetTypeWithCategory;
  }

  /**
   * Get asset types by category (for cascading dropdown)
   */
  async getTypesByCategory(
    categoryId: string,
  ): Promise<AssetTypeWithCategory[]> {
    // Verify category exists
    const categoryExists = await this.categoryDAO.exists(categoryId);
    if (!categoryExists) {
      throw new Error("Category not found");
    }

    return this.typeDAO.findByCategory(categoryId);
  }

  /**
   * Create new asset type
   */
  async createType(data: CreateAssetTypeDTO): Promise<AssetType> {
    // Validate category exists
    const categoryExists = await this.categoryDAO.exists(data.category_id);
    if (!categoryExists) {
      throw new Error("Category not found");
    }

    // Check for duplicate name within category
    const existing = await this.typeDAO.findByNameInCategory(
      data.name,
      data.category_id,
    );
    if (existing) {
      throw new Error(
        "Asset type with this name already exists in this category",
      );
    }

    const insertData: Partial<AssetTypeInsert> = {
      name: data.name,
      category_id: data.category_id,
      description: data.description ?? null,
    };

    return this.typeDAO.create(insertData);
  }

  /**
   * Update asset type
   */
  async updateType(id: string, data: UpdateAssetTypeDTO): Promise<AssetType> {
    // Verify type exists
    const assetType = await this.typeDAO.findById(id);
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    // Validate category exists if changing
    if (data.category_id) {
      const categoryExists = await this.categoryDAO.exists(data.category_id);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
    }

    // Check for duplicate name within category if changing name or category
    const targetCategoryId = data.category_id ?? assetType.category_id;
    const targetName = data.name ?? assetType.name;

    if (data.name || data.category_id) {
      const existing = await this.typeDAO.findByNameInCategory(
        targetName,
        targetCategoryId,
      );
      if (existing && existing.id !== id) {
        throw new Error(
          "Asset type with this name already exists in this category",
        );
      }
    }

    const updateData: Partial<AssetTypeUpdate> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category_id !== undefined)
      updateData.category_id = data.category_id;
    if (data.description !== undefined)
      updateData.description = data.description;

    return this.typeDAO.update(id, updateData);
  }

  /**
   * Delete asset type (soft delete)
   */
  async deleteType(id: string): Promise<void> {
    // Verify type exists
    const assetType = await this.typeDAO.findById(id);
    if (!assetType) {
      throw new Error("Asset type not found");
    }

    await this.typeDAO.softDelete(id);
  }
}
