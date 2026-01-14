import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import type { Database } from '@/types/database-extensions'
import type { SupabaseClient } from '@supabase/supabase-js'

type VendorRating = Database['public']['Tables']['vendor_ratings']['Row']
type VendorRatingInsert = Database['public']['Tables']['vendor_ratings']['Insert']

export interface VendorRatingWithRelations extends VendorRating {
  vendor?: {
    id: string
    name: string
  } | null
  ticket?: {
    id: string
    ticket_number: string
    title: string
  } | null
  rated_by_user?: {
    id: string
    full_name: string
  } | null
}

export interface VendorRatingStats {
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
 * DAO for vendor_ratings table
 * Note: Ratings are immutable audit records (no soft delete or updates)
 */
export class VendorRatingDAO {
  /**
   * Get tenant-scoped client
   */
  private async getClient() {
    const supabase = (await getPooledSupabaseClient()) as SupabaseClient<Database>
    const tenant = await getTenantContext()

    if (!tenant) {
      throw new Error('Tenant context required for database operations')
    }

    return { supabase, tenantId: tenant.id }
  }

  /**
   * Find all ratings for a vendor
   */
  async findByVendor(vendorId: string): Promise<VendorRatingWithRelations[]> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(
        `
        *,
        vendor:vendors(id, name),
        ticket:tickets(id, ticket_number, title),
        rated_by_user:users(id, full_name)
      `
      )
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as VendorRatingWithRelations[]) ?? []
  }

  /**
   * Find rating by ticket ID
   */
  async findByTicket(ticketId: string): Promise<VendorRatingWithRelations | null> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(
        `
        *,
        vendor:vendors(id, name),
        ticket:tickets(id, ticket_number, title),
        rated_by_user:users(id, full_name)
      `
      )
      .eq('ticket_id', ticketId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as VendorRatingWithRelations
  }

  /**
   * Find ratings by user who created them
   */
  async findByRater(userId: string): Promise<VendorRatingWithRelations[]> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(
        `
        *,
        vendor:vendors(id, name),
        ticket:tickets(id, ticket_number, title),
        rated_by_user:users(id, full_name)
      `
      )
      .eq('rated_by', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as VendorRatingWithRelations[]) ?? []
  }

  /**
   * Get rating statistics for a vendor
   */
  async getVendorStats(vendorId: string): Promise<VendorRatingStats | null> {
    const { supabase } = await this.getClient()

    // Get all ratings for vendor
    const { data: ratings, error } = await supabase
      .from('vendor_ratings')
      .select('*')
      .eq('vendor_id', vendorId)

    if (error) throw new Error(error.message)
    if (!ratings || ratings.length === 0) return null

    // Calculate statistics
    const totalRatings = ratings.length
    const sumRating = ratings.reduce((sum: number, r: VendorRating) => sum + (r.rating ?? 0), 0)
    const sumResponseTime = ratings.reduce(
      (sum: number, r: VendorRating) => sum + (r.response_time_rating ?? 0),
      0
    )
    const sumQuality = ratings.reduce((sum: number, r: VendorRating) => sum + (r.quality_rating ?? 0), 0)
    const sumCost = ratings.reduce((sum: number, r: VendorRating) => sum + (r.cost_rating ?? 0), 0)

    // Rating distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    ratings.forEach((r: VendorRating) => {
      const rating = r.rating ?? 0
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++
      }
    })

    return {
      vendor_id: vendorId,
      total_ratings: totalRatings,
      average_rating: sumRating / totalRatings,
      average_response_time: sumResponseTime / totalRatings,
      average_quality: sumQuality / totalRatings,
      average_cost: sumCost / totalRatings,
      rating_distribution: distribution,
    }
  }

  /**
   * Get recent ratings (last N days)
   */
  async findRecent(days = 30): Promise<VendorRatingWithRelations[]> {
    const { supabase } = await this.getClient()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(
        `
        *,
        vendor:vendors(id, name),
        ticket:tickets(id, ticket_number, title),
        rated_by_user:users(id, full_name)
      `
      )
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data as VendorRatingWithRelations[]) ?? []
  }

  /**
   * Get top-rated vendors
   */
  async getTopRatedVendors(limit = 10): Promise<VendorRatingStats[]> {
    const { supabase } = await this.getClient()

    // Get all ratings grouped by vendor
    const { data, error } = await supabase.from('vendor_ratings').select('vendor_id')

    if (error) throw new Error(error.message)
    if (!data) return []

    // Get unique vendor IDs
    const vendorIds = [...new Set(data.map((r: { vendor_id: string | null }) => r.vendor_id).filter(Boolean))] as string[]

    // Calculate stats for each vendor
    const stats: VendorRatingStats[] = []
    for (const vendorId of vendorIds) {
      if (vendorId) {
        const vendorStats = await this.getVendorStats(vendorId)
        if (vendorStats) {
          stats.push(vendorStats)
        }
      }
    }

    // Sort by average rating and limit
    return stats
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, limit)
  }

  /**
   * Create rating (immutable)
   */
  async create(insertData: Partial<VendorRatingInsert>): Promise<VendorRating> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('vendor_ratings')
      .insert(insertData as never)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create rating')
    return data as VendorRating
  }

  /**
   * Get rating by ID
   */
  async findById(id: string): Promise<VendorRatingWithRelations | null> {
    const { supabase } = await this.getClient()

    const { data, error } = await supabase
      .from('vendor_ratings')
      .select(
        `
        *,
        vendor:vendors(id, name),
        ticket:tickets(id, ticket_number, title),
        rated_by_user:users(id, full_name)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }
    return data as VendorRatingWithRelations
  }

  /**
   * Check if ticket already has a rating
   */
  async hasRating(ticketId: string): Promise<boolean> {
    const rating = await this.findByTicket(ticketId)
    return rating !== null
  }
}
