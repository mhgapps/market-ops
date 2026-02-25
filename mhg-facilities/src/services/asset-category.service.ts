import {
  AssetCategoryDAO,
  type AssetCategoryWithParent,
} from "@/dao/asset-category.dao";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type AssetCategoryInsert =
  Database["public"]["Tables"]["asset_categories"]["Insert"];
type AssetCategoryUpdate =
  Database["public"]["Tables"]["asset_categories"]["Update"];

export interface CreateAssetCategoryDTO {
  name: string;
  description?: string;
  default_lifespan_years?: number;
  parent_category_id?: string;
}

export interface UpdateAssetCategoryDTO {
  name?: string;
  description?: string;
  default_lifespan_years?: number;
  parent_category_id?: string;
}

/**
 * Service for managing asset categories
 * Handles hierarchical category structure with parent/child relationships
 */
export class AssetCategoryService {
  constructor(private categoryDAO = new AssetCategoryDAO()) {}

  /**
   * Get all asset categories for current tenant
   */
  async getAllCategories(): Promise<AssetCategoryWithParent[]> {
    return this.categoryDAO.findWithParent();
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<AssetCategoryWithParent | null> {
    const category = await this.categoryDAO.findById(id);
    if (!category) return null;

    // Fetch parent info if exists
    if (category.parent_category_id) {
      const parent = await this.categoryDAO.findById(
        category.parent_category_id,
      );
      return {
        ...category,
        parent_category: parent
          ? {
              id: parent.id,
              name: parent.name,
            }
          : null,
      };
    }

    return category as AssetCategoryWithParent;
  }

  /**
   * Get top-level categories (no parent)
   */
  async getTopLevelCategories(): Promise<AssetCategory[]> {
    return this.categoryDAO.findTopLevel();
  }

  /**
   * Get child categories for a parent
   */
  async getChildCategories(parentId: string): Promise<AssetCategory[]> {
    // Verify parent exists
    const parentExists = await this.categoryDAO.exists(parentId);
    if (!parentExists) {
      throw new Error("Parent category not found");
    }

    return this.categoryDAO.findChildren(parentId);
  }

  /**
   * Get category hierarchy tree
   * Returns nested structure with children
   */
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    const allCategories = await this.categoryDAO.findWithParent();

    // Build tree structure
    const topLevel = allCategories.filter((c) => !c.parent_category_id);

    return topLevel.map((category) =>
      this.buildTreeNode(category, allCategories),
    );
  }

  private buildTreeNode(
    category: AssetCategoryWithParent,
    allCategories: AssetCategoryWithParent[],
  ): CategoryTreeNode {
    const children = allCategories.filter(
      (c) => c.parent_category_id === category.id,
    );

    return {
      ...category,
      children: children.map((child) =>
        this.buildTreeNode(child, allCategories),
      ),
    };
  }

  /**
   * Create new asset category
   */
  async createCategory(data: CreateAssetCategoryDTO): Promise<AssetCategory> {
    // Check for duplicate name
    const existing = await this.categoryDAO.findByName(data.name);
    if (existing) {
      throw new Error("Category with this name already exists");
    }

    // Validate parent exists if provided
    if (data.parent_category_id) {
      const parentExists = await this.categoryDAO.exists(
        data.parent_category_id,
      );
      if (!parentExists) {
        throw new Error("Parent category not found");
      }
    }

    const insertData: Partial<AssetCategoryInsert> = {
      name: data.name,
      description: data.description ?? null,
      default_lifespan_years: data.default_lifespan_years ?? null,
      parent_category_id: data.parent_category_id ?? null,
    };

    return this.categoryDAO.create(insertData);
  }

  /**
   * Update asset category
   */
  async updateCategory(
    id: string,
    data: UpdateAssetCategoryDTO,
  ): Promise<AssetCategory> {
    // Verify category exists
    const category = await this.categoryDAO.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check for duplicate name if changing name
    if (data.name && data.name !== category.name) {
      const existing = await this.categoryDAO.findByName(data.name);
      if (existing && existing.id !== id) {
        throw new Error("Category with this name already exists");
      }
    }

    // Prevent circular parent reference
    if (data.parent_category_id) {
      const isCircular = await this.isCircularParent(
        id,
        data.parent_category_id,
      );
      if (isCircular) {
        throw new Error("Cannot set parent - would create circular reference");
      }
    }

    const updateData: Partial<AssetCategoryUpdate> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.default_lifespan_years !== undefined)
      updateData.default_lifespan_years = data.default_lifespan_years;
    if (data.parent_category_id !== undefined)
      updateData.parent_category_id = data.parent_category_id;

    return this.categoryDAO.update(id, updateData);
  }

  /**
   * Delete asset category (soft delete)
   * Prevents deletion if category has children
   */
  async deleteCategory(id: string): Promise<void> {
    // Verify category exists
    const category = await this.categoryDAO.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    // Check for children
    const hasChildren = await this.categoryDAO.hasChildren(id);
    if (hasChildren) {
      throw new Error(
        "Cannot delete category with child categories. Delete children first.",
      );
    }

    // TODO: Check if any assets use this category
    // This will be implemented once Asset DAO is available

    await this.categoryDAO.softDelete(id);
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  private async isCircularParent(
    categoryId: string,
    proposedParentId: string,
  ): Promise<boolean> {
    if (categoryId === proposedParentId) {
      return true;
    }

    let currentParentId = proposedParentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular reference detected
      }
      visited.add(currentParentId);

      if (currentParentId === categoryId) {
        return true; // Would create circular reference
      }

      const parent = await this.categoryDAO.findById(currentParentId);
      if (!parent || !parent.parent_category_id) {
        break;
      }

      currentParentId = parent.parent_category_id;
    }

    return false;
  }

  /**
   * Get category usage statistics
   */
  async getCategoryStats(id: string): Promise<CategoryStats> {
    const category = await this.categoryDAO.findById(id);
    if (!category) {
      throw new Error("Category not found");
    }

    const children = await this.categoryDAO.findChildren(id);

    return {
      id: category.id,
      name: category.name,
      child_count: children.length,
      asset_count: 0, // TODO: Implement once Asset DAO is available
    };
  }
}

export interface CategoryTreeNode extends AssetCategoryWithParent {
  children: CategoryTreeNode[];
}

export interface CategoryStats {
  id: string;
  name: string;
  child_count: number;
  asset_count: number;
}
