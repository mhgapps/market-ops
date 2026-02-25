import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database";

type AssetCategory = Database["public"]["Tables"]["asset_categories"]["Row"];
type AssetCategoryInsert =
  Database["public"]["Tables"]["asset_categories"]["Insert"];
type AssetCategoryUpdate =
  Database["public"]["Tables"]["asset_categories"]["Update"];

export interface AssetCategoryWithParent extends AssetCategory {
  parent_category?: {
    id: string;
    name: string;
  } | null;
}

export class AssetCategoryDAO extends BaseDAO<"asset_categories"> {
  constructor() {
    super("asset_categories");
  }

  /**
   * Find all categories with parent information joined
   */
  async findWithParent(): Promise<AssetCategoryWithParent[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_categories")
      .select(
        `
        *,
        parent_category:asset_categories!parent_category_id(id, name)
      `,
      )
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as AssetCategoryWithParent[]) ?? [];
  }

  /**
   * Find all child categories for a given parent
   */
  async findChildren(parentId: string): Promise<AssetCategory[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("parent_category_id", parentId)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as AssetCategory[]) ?? [];
  }

  /**
   * Find all top-level categories (no parent)
   */
  async findTopLevel(): Promise<AssetCategory[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("parent_category_id", null)
      .is("deleted_at", null)
      .order("name", { ascending: true });

    if (error) throw new Error(error.message);
    return (data as AssetCategory[]) ?? [];
  }

  /**
   * Check if a category has child categories
   */
  async hasChildren(categoryId: string): Promise<boolean> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from("asset_categories")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("parent_category_id", categoryId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }

  /**
   * Find by name (case-insensitive)
   */
  async findByName(name: string): Promise<AssetCategory | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .ilike("name", name)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(error.message);
    }
    return data as AssetCategory;
  }

  /**
   * Create category (override to validate parent exists)
   */
  async create(
    insertData: Partial<AssetCategoryInsert>,
  ): Promise<AssetCategory> {
    // Validate parent exists if provided
    if (insertData.parent_category_id) {
      const parentExists = await this.exists(insertData.parent_category_id);
      if (!parentExists) {
        throw new Error("Parent category not found");
      }
    }

    return super.create(insertData) as Promise<AssetCategory>;
  }

  /**
   * Update category (override to validate parent exists)
   */
  async update(
    id: string,
    updateData: Partial<AssetCategoryUpdate>,
  ): Promise<AssetCategory> {
    // Prevent self-referencing parent
    if (updateData.parent_category_id === id) {
      throw new Error("Category cannot be its own parent");
    }

    // Validate parent exists if provided
    if (updateData.parent_category_id) {
      const parentExists = await this.exists(updateData.parent_category_id);
      if (!parentExists) {
        throw new Error("Parent category not found");
      }
    }

    return super.update(id, updateData) as Promise<AssetCategory>;
  }

  /**
   * Soft delete category (override to check for children)
   */
  async softDelete(id: string): Promise<void> {
    const hasChildren = await this.hasChildren(id);
    if (hasChildren) {
      throw new Error("Cannot delete category with child categories");
    }

    return super.softDelete(id);
  }
}
