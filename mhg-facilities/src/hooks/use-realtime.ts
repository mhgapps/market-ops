'use client'

import { useEffect, useRef, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeSubscriptionOptions {
  table: string
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  filter?: string
  enabled?: boolean
  onInsert?: (payload: unknown) => void
  onUpdate?: (payload: unknown) => void
  onDelete?: (payload: unknown) => void
  invalidateQueries?: readonly (readonly unknown[])[]
}

/**
 * Subscribe to realtime changes for a Supabase table
 * Automatically invalidates React Query cache when changes occur
 */
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  enabled = true,
  onInsert,
  onUpdate,
  onDelete,
  invalidateQueries = [],
}: UseRealtimeSubscriptionOptions) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Memoize invalidateQueries to prevent re-subscriptions
  const stableInvalidateQueries = useMemo(
    () => invalidateQueries,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(invalidateQueries)]
  )

  // Use useCallback for the subscription handler to fix stale closure issue
  const handleChange = useCallback(
    (payload: { eventType: string; new: unknown; old: unknown }) => {
      console.log(`Realtime change detected on ${table}:`, payload)

      // Call event-specific callbacks
      if (payload.eventType === 'INSERT' && onInsert) {
        onInsert(payload.new)
      } else if (payload.eventType === 'UPDATE' && onUpdate) {
        onUpdate(payload.new)
      } else if (payload.eventType === 'DELETE' && onDelete) {
        onDelete(payload.old)
      }

      // Invalidate React Query cache for affected queries
      stableInvalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey: queryKey as unknown[] })
      })
    },
    [table, onInsert, onUpdate, onDelete, stableInvalidateQueries, queryClient]
  )

  useEffect(() => {
    // Don't subscribe if disabled
    if (!enabled) {
      return
    }

    const supabase = createClient()

    // Create a unique channel name
    const channelName = `realtime:${table}:${event}:${filter || 'all'}:${Date.now()}`

    // Subscribe to table changes
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter,
        } as never,
        handleChange
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, event, filter, enabled, handleChange])
}

/**
 * Hook to subscribe to ticket changes
 * Only subscribes when viewing a specific ticket (not on list pages)
 * Automatically invalidates ticket queries when changes occur
 */
export function useTicketRealtime(ticketId?: string) {
  useRealtimeSubscription({
    table: 'tickets',
    event: '*',
    filter: ticketId ? `id=eq.${ticketId}` : undefined,
    enabled: !!ticketId, // Only subscribe if viewing a specific ticket
    invalidateQueries: ticketId
      ? [['tickets', 'detail', ticketId], ['tickets']]
      : [],
  })
}

/**
 * Hook to subscribe to PM schedule changes
 * Automatically invalidates PM queries when changes occur
 */
export function usePMScheduleRealtime() {
  useRealtimeSubscription({
    table: 'pm_schedules',
    event: '*',
    invalidateQueries: [
      ['pm', 'schedules'],
      ['pm', 'stats'],
      ['pm', 'calendar'],
    ],
  })
}

/**
 * Hook to subscribe to asset changes
 * Automatically invalidates asset queries when changes occur
 */
export function useAssetRealtime() {
  useRealtimeSubscription({
    table: 'assets',
    event: '*',
    invalidateQueries: [
      ['assets'],
      ['asset-stats'],
    ],
  })
}

/**
 * Hook to subscribe to compliance document changes
 * Automatically invalidates compliance queries when changes occur
 */
export function useComplianceRealtime() {
  useRealtimeSubscription({
    table: 'compliance_documents',
    event: '*',
    invalidateQueries: [
      ['compliance'],
      ['compliance-stats'],
    ],
  })
}

/**
 * Hook to subscribe to user changes
 * Automatically invalidates user queries when changes occur
 */
export function useUserRealtime() {
  useRealtimeSubscription({
    table: 'users',
    event: '*',
    invalidateQueries: [
      ['users'],
    ],
  })
}

/**
 * Hook to subscribe to location changes
 * Automatically invalidates location queries when changes occur
 */
export function useLocationRealtime() {
  useRealtimeSubscription({
    table: 'locations',
    event: '*',
    invalidateQueries: [
      ['locations'],
    ],
  })
}

/**
 * Hook to subscribe to vendor changes
 * Automatically invalidates vendor queries when changes occur
 */
export function useVendorRealtime() {
  useRealtimeSubscription({
    table: 'vendors',
    event: '*',
    invalidateQueries: [
      ['vendors'],
    ],
  })
}
