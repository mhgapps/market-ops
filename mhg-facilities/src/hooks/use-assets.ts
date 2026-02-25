import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { AssetFilterInput, CreateAssetInput, UpdateAssetInput } from '@/lib/validations/assets-vendors'

// Cache settings for React Query
const STALE_TIME = 30000 // Data fresh for 30 seconds
const GC_TIME = 300000 // Keep in cache for 5 minutes

// Type definitions
interface Asset {
  id: string
  name: string
  category_id: string | null
  asset_type_id: string | null
  location_id: string | null
  serial_number: string | null
  model: string | null
  manufacturer: string | null
  purchase_date: string | null
  purchase_price: number | null
  warranty_expiration: string | null
  expected_lifespan_years: number | null
  qr_code: string | null
  vendor_id: string | null
  status: 'active' | 'under_maintenance' | 'retired' | 'transferred' | 'disposed'
  photo_path: string | null
  manual_url: string | null
  spec_sheet_path: string | null
  notes: string | null
  tenant_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface AssetWithRelations extends Asset {
  category?: {
    id: string
    name: string
    default_lifespan_years: number | null
  } | null
  asset_type?: {
    id: string
    name: string
    category_id: string
  } | null
  location?: {
    id: string
    name: string
    address: string | null
  } | null
  vendor?: {
    id: string
    name: string
  } | null
}

interface AssetStats {
  total: number
  by_status: Record<string, number>
  warranty_expiring_30_days: number
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Fetch all assets with optional filters and pagination
 */
export function useAssets(filters?: AssetFilterInput) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.category_id) params.set('category_id', filters.category_id)
      if (filters?.asset_type_id) params.set('asset_type_id', filters.asset_type_id)
      if (filters?.location_id) params.set('location_id', filters.location_id)
      if (filters?.vendor_id) params.set('vendor_id', filters.vendor_id)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.search) params.set('search', filters.search)
      if (filters?.warranty_expiring_days) params.set('warranty_expiring_days', filters.warranty_expiring_days.toString())
      if (filters?.page) params.set('page', filters.page.toString())
      if (filters?.pageSize) params.set('pageSize', filters.pageSize.toString())

      const data = await api.get<PaginatedResponse<AssetWithRelations>>(
        `/api/assets?${params.toString()}`
      )
      return data
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Fetch single asset by ID
 */
export function useAsset(id: string | null) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: async () => {
      if (!id) return null
      const data = await api.get<{ asset: AssetWithRelations }>(`/api/assets/${id}`)
      return data.asset
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Fetch asset by QR code
 */
export function useAssetByQRCode(qrCode: string | null) {
  return useQuery({
    queryKey: ['assets', 'qr', qrCode],
    queryFn: async () => {
      if (!qrCode) return null
      const data = await api.get<{ asset: AssetWithRelations }>(`/api/assets/qr/${qrCode}`)
      return data.asset
    },
    enabled: !!qrCode,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Fetch asset transfer history
 */
export function useAssetTransferHistory(assetId: string | null) {
  return useQuery({
    queryKey: ['assets', assetId, 'transfers'],
    queryFn: async () => {
      if (!assetId) return null
      const data = await api.get<{
        transfer_count: number
        transfers: unknown[]
        current_location_id: string | null
      }>(`/api/assets/${assetId}/transfer`)
      return data
    },
    enabled: !!assetId,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Fetch asset statistics
 */
export function useAssetStats() {
  return useQuery({
    queryKey: ['assets', 'stats'],
    queryFn: async () => {
      const data = await api.get<AssetStats>('/api/assets/stats')
      return data
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Create new asset
 */
export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAssetInput) => {
      const data = await api.post<{ asset: Asset }>('/api/assets', input)
      return data.asset
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

/**
 * Update asset
 */
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssetInput }) => {
      const result = await api.patch<{ asset: Asset }>(`/api/assets/${id}`, data)
      return result.asset
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets', variables.id] })
    },
  })
}

/**
 * Delete asset (soft delete)
 */
export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/assets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
    },
  })
}

/**
 * Transfer asset to new location
 */
export function useTransferAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      assetId,
      to_location_id,
      transferred_by,
      reason,
      notes,
    }: {
      assetId: string
      to_location_id: string
      transferred_by: string
      reason?: string
      notes?: string
    }) => {
      const data = await api.post<{ transfer: unknown }>(`/api/assets/${assetId}/transfer`, {
        to_location_id,
        transferred_by,
        reason,
        notes,
      })
      return data.transfer
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['assets', variables.assetId] })
      queryClient.invalidateQueries({ queryKey: ['assets', variables.assetId, 'transfers'] })
    },
  })
}
