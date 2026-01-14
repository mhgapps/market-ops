import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { UserRole } from '@/types/database'

// Cache settings for React Query
const STALE_TIME = 30000 // Data fresh for 30 seconds
const GC_TIME = 300000 // Keep in cache for 5 minutes

// Types
export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  phone?: string
  locationId?: string
  languagePreference: string
  isActive: boolean
  notificationPreferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  createdAt: string
  updatedAt: string
}

export interface UserFilters {
  search?: string
  role?: string
  status?: 'active' | 'inactive' | 'all'
}

export interface InviteUserInput {
  email: string
  full_name: string
  role: UserRole
  location_id?: string
}

export interface UpdateUserInput {
  full_name?: string
  role?: UserRole
  phone?: string
  location_id?: string | null
  is_active?: boolean
  language_preference?: string
  notification_preferences?: {
    email: boolean
    sms: boolean
    push: boolean
  }
}

// Query Keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters?: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

/**
 * Hook to fetch all users with optional filters
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.search) params.append('search', filters.search)
      if (filters?.role && filters.role !== 'all') params.append('role', filters.role)
      if (filters?.status && filters.status !== 'all') params.append('status', filters.status)

      const response = await api.get<{ users: User[] }>(
        `/api/users?${params.toString()}`
      )
      return response.users
    },
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Hook to fetch a single user by ID
 */
export function useUser(id: string | null) {
  return useQuery({
    queryKey: userKeys.detail(id!),
    queryFn: async () => {
      const response = await api.get<{ user: User }>(`/api/users/${id}`)
      return response.user
    },
    enabled: !!id,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
  })
}

/**
 * Hook to invite a new user
 */
export function useInviteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: InviteUserInput) => {
      const response = await api.post<{ user: User }>('/api/users/invite', input)
      return response.user
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/**
 * Hook to update a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserInput }) => {
      const response = await api.patch<{ user: User }>(`/api/users/${id}`, data)
      return response.user
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
    },
  })
}

/**
 * Hook to deactivate a user
 */
export function useDeactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ user: User }>(`/api/users/${id}`, {
        is_active: false,
      })
      return response.user
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

/**
 * Hook to reactivate a user
 */
export function useReactivateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch<{ user: User }>(`/api/users/${id}`, {
        is_active: true,
      })
      return response.user
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}
