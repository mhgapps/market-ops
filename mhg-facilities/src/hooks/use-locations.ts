'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'

// Type definitions
export interface Location {
  id: string
  tenant_id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  phone: string | null
  square_footage: number | null
  operating_hours: string | null
  is_primary: boolean
  is_active: boolean
  location_type: string | null
  manager_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface LocationWithStats extends Location {
  stats?: {
    total_tickets: number
    open_tickets: number
    total_assets: number
    active_assets: number
  }
}

export interface CreateLocationInput {
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  phone?: string | null
  square_footage?: number | null
  operating_hours?: string | null
  is_primary?: boolean
  is_active?: boolean
  location_type?: string | null
  manager_id?: string | null
  notes?: string | null
}

export interface UpdateLocationInput extends Partial<CreateLocationInput> {}

// Query keys
export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (filters: string) => [...locationKeys.lists(), { filters }] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
}

/**
 * Fetch all locations
 */
export function useLocations(withStats: boolean = false) {
  return useQuery({
    queryKey: withStats ? [...locationKeys.all, 'withStats'] : locationKeys.all,
    queryFn: async () => {
      const url = withStats ? '/api/locations?withStats=true' : '/api/locations'
      const data = await api.get<{ locations: LocationWithStats[] }>(url)
      return data.locations
    },
  })
}

/**
 * Fetch single location by ID
 */
export function useLocation(id: string | null) {
  return useQuery({
    queryKey: locationKeys.detail(id || ''),
    queryFn: async () => {
      if (!id) return null
      const data = await api.get<{ location: LocationWithStats }>(`/api/locations/${id}`)
      return data.location
    },
    enabled: !!id,
  })
}

/**
 * Create a new location
 */
export function useCreateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateLocationInput) => {
      return api.post<{ location: Location }>('/api/locations', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}

/**
 * Update an existing location
 */
export function useUpdateLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLocationInput }) => {
      return api.patch<{ location: Location }>(`/api/locations/${id}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) })
    },
  })
}

/**
 * Delete a location (soft delete)
 */
export function useDeleteLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/api/locations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: locationKeys.all })
    },
  })
}
