import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type {
  CreateAssetCategoryInput,
  UpdateAssetCategoryInput,
} from "@/lib/validations/assets-vendors";

// Type definitions
interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  default_lifespan_years: number | null;
  parent_category_id: string | null;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface AssetCategoryWithParent extends AssetCategory {
  parent?: {
    id: string;
    name: string;
  } | null;
}

interface CategoryTreeNode {
  id: string;
  name: string;
  description: string | null;
  default_lifespan_years: number | null;
  parent_category_id: string | null;
  children: CategoryTreeNode[];
}

/**
 * Fetch all asset categories with parent relationships
 */
export function useAssetCategories() {
  return useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () => {
      const data = await api.get<{
        categories: AssetCategoryWithParent[];
        total: number;
      }>("/api/asset-categories");
      return data;
    },
  });
}

/**
 * Fetch asset category tree (hierarchical structure)
 */
export function useAssetCategoryTree() {
  return useQuery({
    queryKey: ["asset-categories", "tree"],
    queryFn: async () => {
      const data = await api.get<{ tree: CategoryTreeNode[] }>(
        "/api/asset-categories/tree",
      );
      return data.tree;
    },
  });
}

/**
 * Fetch single asset category by ID
 */
export function useAssetCategory(id: string | null) {
  return useQuery({
    queryKey: ["asset-categories", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await api.get<{ category: AssetCategoryWithParent }>(
        `/api/asset-categories/${id}`,
      );
      return data.category;
    },
    enabled: !!id,
  });
}

/**
 * Create new asset category
 */
export function useCreateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssetCategoryInput) => {
      const data = await api.post<{ category: AssetCategory }>(
        "/api/asset-categories",
        input,
      );
      return data.category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    },
  });
}

/**
 * Update asset category
 */
export function useUpdateAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssetCategoryInput;
    }) => {
      const result = await api.patch<{ category: AssetCategory }>(
        `/api/asset-categories/${id}`,
        data,
      );
      return result.category;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      queryClient.invalidateQueries({
        queryKey: ["asset-categories", variables.id],
      });
    },
  });
}

/**
 * Delete asset category (soft delete)
 */
export function useDeleteAssetCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/asset-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
    },
  });
}
