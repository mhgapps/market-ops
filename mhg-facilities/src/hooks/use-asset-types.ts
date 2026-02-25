import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api-client";
import type {
  CreateAssetTypeInput,
  UpdateAssetTypeInput,
} from "@/lib/validations/assets-vendors";

interface AssetType {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface AssetTypeWithCategory extends AssetType {
  category?: {
    id: string;
    name: string;
  } | null;
}

/**
 * Fetch asset types, optionally filtered by category
 */
export function useAssetTypes(categoryId?: string) {
  return useQuery({
    queryKey: ["asset-types", categoryId ?? "all"],
    queryFn: async () => {
      const query = categoryId ? `?category_id=${categoryId}` : "";
      const data = await api.get<{
        assetTypes: AssetTypeWithCategory[];
        total: number;
      }>(`/api/asset-types${query}`);
      return data;
    },
  });
}

/**
 * Fetch single asset type by ID
 */
export function useAssetType(id: string | null) {
  return useQuery({
    queryKey: ["asset-types", id],
    queryFn: async () => {
      if (!id) return null;
      const data = await api.get<{ assetType: AssetTypeWithCategory }>(
        `/api/asset-types/${id}`,
      );
      return data.assetType;
    },
    enabled: !!id,
  });
}

/**
 * Create a new asset type
 */
export function useCreateAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAssetTypeInput) => {
      const data = await api.post<{ assetType: AssetType }>(
        "/api/asset-types",
        input,
      );
      return data.assetType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
    },
  });
}

/**
 * Update an asset type
 */
export function useUpdateAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssetTypeInput;
    }) => {
      const result = await api.patch<{ assetType: AssetType }>(
        `/api/asset-types/${id}`,
        data,
      );
      return result.assetType;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
      queryClient.invalidateQueries({
        queryKey: ["asset-types", variables.id],
      });
    },
  });
}

/**
 * Delete an asset type
 */
export function useDeleteAssetType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-types"] });
    },
  });
}
