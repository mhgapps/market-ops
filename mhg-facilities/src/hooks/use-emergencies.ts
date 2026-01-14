import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Database } from '@/types/database-extensions'

// Cache settings for React Query
const STALE_TIME = 30000 // Data fresh for 30 seconds
const GC_TIME = 300000 // Keep in cache for 5 minutes

// Types
type EmergencyIncident = Database['public']['Tables']['emergency_incidents']['Row']

interface IncidentStats {
  active: number
  resolved_30_days: number
  total_30_days: number
}

interface IncidentFilters {
  status?: 'active' | 'contained' | 'resolved'
  location_id?: string
  days?: number
}

interface CreateIncidentData {
  location_id: string
  title: string
  description?: string
  severity: 'high' | 'critical'
}

interface UpdateStatusData {
  action: 'contain' | 'resolve'
  resolution_notes?: string
}

// Query Keys
export const emergencyKeys = {
  all: ['emergencies'] as const,
  lists: () => [...emergencyKeys.all, 'list'] as const,
  list: (filters?: IncidentFilters) => [...emergencyKeys.lists(), filters] as const,
  details: () => [...emergencyKeys.all, 'detail'] as const,
  detail: (id: string) => [...emergencyKeys.details(), id] as const,
  stats: () => [...emergencyKeys.all, 'stats'] as const,
}

// Queries

/**
 * Hook to fetch emergency incidents with optional filters
 */
export function useEmergencies(filters?: IncidentFilters) {
  return useQuery({
    queryKey: emergencyKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.location_id) params.append('location_id', filters.location_id)
      if (filters?.days) params.append('days', filters.days.toString())

      const response = await api.get<{
        incidents: EmergencyIncident[]
        stats: IncidentStats
      }>(`/api/emergencies?${params.toString()}`)

      return response
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Hook to fetch a single emergency incident by ID
 */
export function useEmergency(id: string) {
  return useQuery({
    queryKey: emergencyKeys.detail(id),
    queryFn: async () => {
      const response = await api.get<{ incident: EmergencyIncident }>(
        `/api/emergencies/${id}`
      )
      return response.incident
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Hook to fetch active emergencies only
 */
export function useActiveEmergencies() {
  return useEmergencies({ status: 'active' })
}

// Mutations

/**
 * Hook to create a new emergency incident
 */
export function useCreateEmergency() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      const response = await api.post<{ incident: EmergencyIncident }>(
        '/api/emergencies',
        data
      )
      return response.incident
    },
    onSuccess: () => {
      // Invalidate all emergency-related queries
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all })
    },
  })
}

/**
 * Hook to update emergency incident status (contain/resolve)
 */
export function useUpdateEmergencyStatus(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateStatusData) => {
      const response = await api.patch<{ incident: EmergencyIncident }>(
        `/api/emergencies/${id}`,
        data
      )
      return response.incident
    },
    onSuccess: () => {
      // Invalidate this specific emergency and lists
      queryClient.invalidateQueries({ queryKey: emergencyKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: emergencyKeys.lists() })
    },
  })
}

/**
 * Hook to mark an emergency as contained
 */
export function useContainEmergency(id: string) {
  const updateStatus = useUpdateEmergencyStatus(id)

  return {
    ...updateStatus,
    mutate: () => updateStatus.mutate({ action: 'contain' }),
    mutateAsync: () => updateStatus.mutateAsync({ action: 'contain' }),
  }
}

/**
 * Hook to mark an emergency as resolved
 */
export function useResolveEmergency(id: string) {
  const updateStatus = useUpdateEmergencyStatus(id)

  return {
    ...updateStatus,
    mutate: (resolution_notes: string) =>
      updateStatus.mutate({ action: 'resolve', resolution_notes }),
    mutateAsync: (resolution_notes: string) =>
      updateStatus.mutateAsync({ action: 'resolve', resolution_notes }),
  }
}
