import {
  VendorRatingDAO,
  type VendorRatingWithRelations,
  type VendorRatingStats,
} from '@/dao/vendor-rating.dao'
import { VendorDAO } from '@/dao/vendor.dao'
import type { Database } from '@/types/database-extensions'

type VendorRatingInsert = Database['public']['Tables']['vendor_ratings']['Insert']

export interface CreateVendorRatingDTO {
  vendor_id: string
  ticket_id: string
  rated_by: string
  rating: number
  response_time_rating: number
  quality_rating: number
  cost_rating: number
  comments?: string
}

/**
 * Service for managing vendor ratings
 * Handles rating creation, statistics, and vendor performance tracking
 */
export class VendorRatingService {
  constructor(
    private ratingDAO = new VendorRatingDAO(),
    private vendorDAO = new VendorDAO()
  ) {}

  /**
   * Create vendor rating
   * Note: Ratings are immutable once created
   */
  async createRating(data: CreateVendorRatingDTO): Promise<VendorRatingWithRelations> {
    // Validate vendor exists
    const vendorExists = await this.vendorDAO.exists(data.vendor_id)
    if (!vendorExists) {
      throw new Error('Vendor not found')
    }

    // Check if ticket already has a rating
    const hasRating = await this.ratingDAO.hasRating(data.ticket_id)
    if (hasRating) {
      throw new Error('This ticket already has a vendor rating')
    }

    // Validate rating values (1-5)
    this.validateRating(data.rating, 'Overall rating')
    this.validateRating(data.response_time_rating, 'Response time rating')
    this.validateRating(data.quality_rating, 'Quality rating')
    this.validateRating(data.cost_rating, 'Cost rating')

    const insertData: Partial<VendorRatingInsert> = {
      vendor_id: data.vendor_id,
      ticket_id: data.ticket_id,
      rated_by: data.rated_by,
      rating: data.rating,
      response_time_rating: data.response_time_rating,
      quality_rating: data.quality_rating,
      cost_rating: data.cost_rating,
      comments: data.comments ?? null,
    }

    const rating = await this.ratingDAO.create(insertData)

    // Return with relations
    const ratingWithRelations = await this.ratingDAO.findById(rating.id)
    if (!ratingWithRelations) {
      throw new Error('Rating created but failed to retrieve')
    }

    return ratingWithRelations
  }

  /**
   * Get all ratings for a vendor
   */
  async getVendorRatings(vendorId: string): Promise<VendorRatingWithRelations[]> {
    // Verify vendor exists
    const vendorExists = await this.vendorDAO.exists(vendorId)
    if (!vendorExists) {
      throw new Error('Vendor not found')
    }

    return this.ratingDAO.findByVendor(vendorId)
  }

  /**
   * Get rating for a specific ticket
   */
  async getRatingByTicket(ticketId: string): Promise<VendorRatingWithRelations | null> {
    return this.ratingDAO.findByTicket(ticketId)
  }

  /**
   * Get ratings created by a user
   */
  async getRatingsByUser(userId: string): Promise<VendorRatingWithRelations[]> {
    return this.ratingDAO.findByRater(userId)
  }

  /**
   * Get vendor rating statistics
   */
  async getVendorStats(vendorId: string): Promise<VendorRatingStats | null> {
    // Verify vendor exists
    const vendorExists = await this.vendorDAO.exists(vendorId)
    if (!vendorExists) {
      throw new Error('Vendor not found')
    }

    return this.ratingDAO.getVendorStats(vendorId)
  }

  /**
   * Get recent ratings (last N days)
   */
  async getRecentRatings(days = 30): Promise<VendorRatingWithRelations[]> {
    return this.ratingDAO.findRecent(days)
  }

  /**
   * Get top-rated vendors
   */
  async getTopRatedVendors(limit = 10): Promise<VendorPerformance[]> {
    const topRated = await this.ratingDAO.getTopRatedVendors(limit)

    // Enrich with vendor details
    const performance: VendorPerformance[] = []
    for (const stats of topRated) {
      const vendor = await this.vendorDAO.findById(stats.vendor_id)
      if (vendor) {
        performance.push({
          vendor: {
            id: vendor.id,
            name: vendor.name,
            is_preferred: vendor.is_preferred ?? false,
            service_categories: vendor.service_categories ?? [],
          },
          stats,
          performance_grade: this.calculatePerformanceGrade(stats),
        })
      }
    }

    return performance
  }

  /**
   * Get vendor performance summary
   */
  async getVendorPerformance(vendorId: string): Promise<VendorPerformance | null> {
    // Verify vendor exists
    const vendor = await this.vendorDAO.findById(vendorId)
    if (!vendor) {
      throw new Error('Vendor not found')
    }

    const stats = await this.ratingDAO.getVendorStats(vendorId)
    if (!stats) {
      return null
    }

    return {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        is_preferred: vendor.is_preferred ?? false,
        service_categories: vendor.service_categories ?? [],
      },
      stats,
      performance_grade: this.calculatePerformanceGrade(stats),
    }
  }

  /**
   * Check if ticket can be rated
   * Requires ticket to be closed and vendor assigned
   */
  async canRateTicket(ticketId: string): Promise<{
    can_rate: boolean
    reason?: string
  }> {
    // Check if already rated
    const hasRating = await this.ratingDAO.hasRating(ticketId)
    if (hasRating) {
      return { can_rate: false, reason: 'Ticket already has a rating' }
    }

    // TODO: Add ticket status check when ticket DAO is integrated
    // Should verify:
    // - Ticket is closed
    // - Ticket has vendor assigned
    // - Ticket work was completed by vendor

    return { can_rate: true }
  }

  /**
   * Compare vendor performance
   * Returns comparison between two vendors
   */
  async compareVendors(
    vendorId1: string,
    vendorId2: string
  ): Promise<VendorComparison> {
    const vendor1Stats = await this.getVendorStats(vendorId1)
    const vendor2Stats = await this.getVendorStats(vendorId2)

    const vendor1 = await this.vendorDAO.findById(vendorId1)
    const vendor2 = await this.vendorDAO.findById(vendorId2)

    if (!vendor1 || !vendor2) {
      throw new Error('One or both vendors not found')
    }

    return {
      vendor1: {
        id: vendor1.id,
        name: vendor1.name,
        stats: vendor1Stats,
        grade: vendor1Stats
          ? this.calculatePerformanceGrade(vendor1Stats)
          : 'Unrated',
      },
      vendor2: {
        id: vendor2.id,
        name: vendor2.name,
        stats: vendor2Stats,
        grade: vendor2Stats
          ? this.calculatePerformanceGrade(vendor2Stats)
          : 'Unrated',
      },
      better_overall:
        vendor1Stats && vendor2Stats
          ? vendor1Stats.average_rating > vendor2Stats.average_rating
            ? 'vendor1'
            : 'vendor2'
          : null,
      better_response:
        vendor1Stats && vendor2Stats
          ? vendor1Stats.average_response_time > vendor2Stats.average_response_time
            ? 'vendor1'
            : 'vendor2'
          : null,
      better_quality:
        vendor1Stats && vendor2Stats
          ? vendor1Stats.average_quality > vendor2Stats.average_quality
            ? 'vendor1'
            : 'vendor2'
          : null,
      better_cost:
        vendor1Stats && vendor2Stats
          ? vendor1Stats.average_cost > vendor2Stats.average_cost
            ? 'vendor1'
            : 'vendor2'
          : null,
    }
  }

  /**
   * Calculate performance grade based on average rating
   */
  private calculatePerformanceGrade(stats: VendorRatingStats): string {
    const avg = stats.average_rating

    if (avg >= 4.5) return 'Excellent'
    if (avg >= 4.0) return 'Very Good'
    if (avg >= 3.5) return 'Good'
    if (avg >= 3.0) return 'Fair'
    if (avg >= 2.0) return 'Poor'
    return 'Very Poor'
  }

  /**
   * Validate rating value (1-5)
   */
  private validateRating(value: number, fieldName: string): void {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`${fieldName} must be an integer between 1 and 5`)
    }
  }
}

export interface VendorPerformance {
  vendor: {
    id: string
    name: string
    is_preferred: boolean
    service_categories: string[]
  }
  stats: VendorRatingStats
  performance_grade: string
}

export interface VendorComparison {
  vendor1: {
    id: string
    name: string
    stats: VendorRatingStats | null
    grade: string
  }
  vendor2: {
    id: string
    name: string
    stats: VendorRatingStats | null
    grade: string
  }
  better_overall: 'vendor1' | 'vendor2' | null
  better_response: 'vendor1' | 'vendor2' | null
  better_quality: 'vendor1' | 'vendor2' | null
  better_cost: 'vendor1' | 'vendor2' | null
}
