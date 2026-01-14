import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { VendorFilterInput, CreateVendorInput, UpdateVendorInput } from '@/lib/validations/assets-vendors'

// Type definitions
interface Vendor {
  id: string
  name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  emergency_phone: string | null
  address: string | null
  service_categories: string[] | null
  is_preferred: boolean | null
  contract_start_date: string | null
  contract_expiration: string | null
  insurance_expiration: string | null
  insurance_minimum_required: number | null
  hourly_rate: number | null
  notes: string | null
  is_active: boolean
  tenant_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

interface VendorStats {
  total: number
  active: number
  inactive: number
  preferred: number
  insurance_expiring_30_days: number
  contract_expiring_30_days: number
}

interface VendorRating {
  id: string
  vendor_id: string
  ticket_id: string
  rated_by: string
  rating: number
  response_time_rating: number
  quality_rating: number
  cost_rating: number
  comments: string | null
  created_at: string
}

interface VendorRatingStats {
  vendor_id: string
  total_ratings: number
  average_rating: number
  average_response_time: number
  average_quality: number
  average_cost: number
  rating_distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

/**
 * Fetch all vendors with optional filters
 */
export function useVendors(filters?: VendorFilterInput) {
  return useQuery({
    queryKey: ['vendors', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.is_active !== undefined) params.set('is_active', filters.is_active.toString())
      if (filters?.is_preferred !== undefined) params.set('is_preferred', filters.is_preferred.toString())
      if (filters?.service_category) params.set('service_category', filters.service_category)
      if (filters?.insurance_expiring_days) params.set('insurance_expiring_days', filters.insurance_expiring_days.toString())
      if (filters?.contract_expiring_days) params.set('contract_expiring_days', filters.contract_expiring_days.toString())
      if (filters?.search) params.set('search', filters.search)

      const data = await api.get<{ vendors: Vendor[]; total: number }>(
        `/api/vendors?${params.toString()}`
      )
      return data
    },
  })
}

/**
 * Fetch single vendor by ID
 */
export function useVendor(id: string | null) {
  return useQuery({
    queryKey: ['vendors', id],
    queryFn: async () => {
      if (!id) return null
      const data = await api.get<{ vendor: Vendor }>(`/api/vendors/${id}`)
      return data.vendor
    },
    enabled: !!id,
  })
}

/**
 * Fetch vendor statistics
 */
export function useVendorStats() {
  return useQuery({
    queryKey: ['vendors', 'stats'],
    queryFn: async () => {
      const data = await api.get<VendorStats>('/api/vendors/stats')
      return data
    },
  })
}

/**
 * Fetch vendor ratings
 */
export function useVendorRatings(vendorId: string | null) {
  return useQuery({
    queryKey: ['vendors', vendorId, 'ratings'],
    queryFn: async () => {
      if (!vendorId) return null
      const data = await api.get<{ ratings: VendorRating[]; stats: VendorRatingStats | null }>(
        `/api/vendors/${vendorId}/ratings`
      )
      return data
    },
    enabled: !!vendorId,
  })
}

/**
 * Create new vendor
 */
export function useCreateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateVendorInput) => {
      const data = await api.post<{ vendor: Vendor }>('/api/vendors', input)
      return data.vendor
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

/**
 * Update vendor
 */
export function useUpdateVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateVendorInput }) => {
      const result = await api.patch<{ vendor: Vendor }>(`/api/vendors/${id}`, data)
      return result.vendor
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.id] })
    },
  })
}

/**
 * Delete vendor (soft delete)
 */
export function useDeleteVendor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/vendors/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

/**
 * Create vendor rating
 */
export function useCreateVendorRating() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      vendorId,
      ticket_id,
      rated_by,
      rating,
      response_time_rating,
      quality_rating,
      cost_rating,
      comments,
    }: {
      vendorId: string
      ticket_id: string
      rated_by: string
      rating: number
      response_time_rating: number
      quality_rating: number
      cost_rating: number
      comments?: string
    }) => {
      const data = await api.post<{ rating: VendorRating }>(`/api/vendors/${vendorId}/ratings`, {
        ticket_id,
        rated_by,
        rating,
        response_time_rating,
        quality_rating,
        cost_rating,
        comments,
      })
      return data.rating
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.vendorId] })
      queryClient.invalidateQueries({ queryKey: ['vendors', variables.vendorId, 'ratings'] })
    },
  })
}
