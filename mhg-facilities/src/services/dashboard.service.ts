import { TicketDAO } from "@/dao/ticket.dao";
import { AssetDAO } from "@/dao/asset.dao";
import { ComplianceDocumentDAO } from "@/dao/compliance-document.dao";
import { PMScheduleDAO } from "@/dao/pm-schedule.dao";
import { LocationDAO } from "@/dao/location.dao";
// TicketStatus and TicketPriority are used by the DAO methods but not directly here anymore

// Overview stats
export interface OverviewStats {
  openTickets: number;
  expiringCompliance: number;
  overduePM: number;
  activeEmergencies: number;
}

// Ticket stats
export interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
  averageResolutionDays: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PriorityCount {
  priority: string;
  count: number;
}

export interface TrendData {
  date: string;
  count: number;
}

// Asset stats
export interface AssetStats {
  total: number;
  active: number;
  under_maintenance: number;
  retired: number;
  transferred: number;
  expiringWarranties: number;
}

// Compliance stats
export interface ComplianceStats {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
}

// PM stats
export interface PMStats {
  totalSchedules: number;
  activeSchedules: number;
  overdue: number;
  completionRate: number;
}

// Location stats
export interface LocationStats {
  totalLocations: number;
  locationsWithTickets: number;
}

export interface LocationTicketCount {
  locationId: string;
  locationName: string;
  ticketCount: number;
}

// Activity feed
export interface ActivityItem {
  id: string;
  type:
    | "ticket_created"
    | "ticket_completed"
    | "compliance_expiring"
    | "pm_completed";
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  linkUrl?: string;
}

/**
 * Dashboard Service
 * Aggregates data from multiple DAOs for dashboard views
 */
export class DashboardService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private assetDAO = new AssetDAO(),
    private complianceDAO = new ComplianceDocumentDAO(),
    private pmScheduleDAO = new PMScheduleDAO(),
    private locationDAO = new LocationDAO(),
  ) {}

  // ============================================================
  // OVERVIEW STATS
  // ============================================================

  /**
   * Get high-level overview stats for dashboard cards
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [openTickets, expiringCompliance, overduePM, activeEmergencies] =
      await Promise.all([
        // Count open tickets (not closed or rejected)
        this.ticketDAO.countByStatusNot(["closed", "rejected"]),
        // Count compliance documents expiring in 30 days
        this.complianceDAO.countExpiringSoon(30),
        // Count overdue PM schedules
        this.pmScheduleDAO.countOverdue(),
        // Count active emergency tickets
        this.ticketDAO.countActiveEmergencies(),
      ]);

    return {
      openTickets,
      expiringCompliance,
      overduePM,
      activeEmergencies,
    };
  }

  // ============================================================
  // TICKET STATS
  // ============================================================

  /**
   * Get ticket statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getTicketStats(): Promise<TicketStats> {
    const [total, open, inProgress, completed, avgResolutionHours] =
      await Promise.all([
        this.ticketDAO.countTotal(),
        this.ticketDAO.countByStatusNot(["closed", "rejected"]),
        this.ticketDAO.countByStatus(["in_progress"]),
        this.ticketDAO.countByStatus(["completed", "closed"]),
        this.ticketDAO.getAverageResolutionHours(),
      ]);

    // Convert hours to days
    const averageResolutionDays = Math.round(avgResolutionHours / 24);

    return {
      total,
      open,
      inProgress,
      completed,
      averageResolutionDays,
    };
  }

  /**
   * Get ticket counts by status
   * PERFORMANCE: Uses optimized query that only fetches status column
   */
  async getTicketsByStatus(): Promise<StatusCount[]> {
    const statusCounts = await this.ticketDAO.getStatusCounts();

    return Object.entries(statusCounts).map(
      ([status, count]): StatusCount => ({
        status,
        count,
      }),
    );
  }

  /**
   * Get ticket counts by priority
   * PERFORMANCE: Uses optimized query that only fetches priority column
   */
  async getTicketsByPriority(): Promise<PriorityCount[]> {
    const priorityCounts = await this.ticketDAO.getPriorityCounts();

    return Object.entries(priorityCounts).map(
      ([priority, count]): PriorityCount => ({
        priority,
        count,
      }),
    );
  }

  /**
   * Get ticket creation trend over time
   * PERFORMANCE: Uses database filtering instead of loading all tickets
   */
  async getTicketTrend(days: number): Promise<TrendData[]> {
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get counts grouped by date from database (only fetches created_at column)
    const dateCounts = await this.ticketDAO.getCountsByDate(
      startDate.toISOString(),
      endDate.toISOString(),
    );

    // Initialize date map with zeros for all days in range
    const dateMap = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      dateMap.set(dateKey, dateCounts[dateKey] || 0);
    }

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get average ticket resolution time in hours
   * PERFORMANCE: Uses optimized query that only fetches necessary columns
   */
  async getAverageResolutionTime(): Promise<number> {
    return this.ticketDAO.getAverageResolutionHours();
  }

  // ============================================================
  // ASSET STATS
  // ============================================================

  /**
   * Get asset statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all assets
   */
  async getAssetStats(): Promise<AssetStats> {
    const [total, statusCounts, expiringWarranties] = await Promise.all([
      this.assetDAO.countTotal(),
      this.assetDAO.getStatusCounts(),
      this.assetDAO.countWarrantyExpiring(30),
    ]);

    return {
      total,
      active: statusCounts["active"] || 0,
      under_maintenance: statusCounts["under_maintenance"] || 0,
      retired: statusCounts["retired"] || 0,
      transferred: statusCounts["transferred"] || 0,
      expiringWarranties,
    };
  }

  /**
   * Get asset counts by status
   * PERFORMANCE: Uses optimized COUNT queries instead of loading all assets
   */
  async getAssetsByStatus(): Promise<StatusCount[]> {
    const statusCounts = await this.assetDAO.getStatusCounts();

    return Object.entries(statusCounts).map(
      ([status, count]): StatusCount => ({
        status,
        count,
      }),
    );
  }

  /**
   * Get assets with warranties expiring soon
   */
  async getExpiringWarranties(days: number) {
    return this.assetDAO.findWarrantyExpiring(days);
  }

  // ============================================================
  // COMPLIANCE STATS
  // ============================================================

  /**
   * Get compliance statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getComplianceStats(): Promise<ComplianceStats> {
    const [total, active, expiringSoon, expired] = await Promise.all([
      this.complianceDAO.countTotal(),
      this.complianceDAO.countByStatus("active"),
      this.complianceDAO.countExpiringSoon(30),
      this.complianceDAO.countExpired(),
    ]);

    return {
      total,
      active,
      expiringSoon,
      expired,
    };
  }

  /**
   * Get compliance counts by status
   * PERFORMANCE: Uses optimized COUNT queries instead of loading all documents
   */
  async getComplianceByStatus(): Promise<StatusCount[]> {
    const statusCounts = await this.complianceDAO.getStatusCounts();

    return Object.entries(statusCounts).map(
      ([status, count]): StatusCount => ({
        status,
        count,
      }),
    );
  }

  /**
   * Get compliance documents expiring soon
   */
  async getUpcomingExpirations(days: number) {
    return this.complianceDAO.findExpiringSoon(days);
  }

  // ============================================================
  // PM STATS
  // ============================================================

  /**
   * Get PM statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getPMStats(): Promise<PMStats> {
    const [totalSchedules, activeSchedules, overdue] = await Promise.all([
      this.pmScheduleDAO.countTotal(),
      this.pmScheduleDAO.countActive(),
      this.pmScheduleDAO.countOverdue(),
    ]);

    // Calculate completion rate (completed on time vs total due)
    const completionRate = this.calculateCompletionRate(
      totalSchedules,
      overdue,
    );

    return {
      totalSchedules,
      activeSchedules,
      overdue,
      completionRate,
    };
  }

  /**
   * Get PM completion rate over specified months
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getPMCompletionRate(_months: number): Promise<number> {
    // This would require PM completion tracking
    // For now, return a placeholder based on overdue ratio
    const [totalSchedules, overdue] = await Promise.all([
      this.pmScheduleDAO.countTotal(),
      this.pmScheduleDAO.countOverdue(),
    ]);

    return this.calculateCompletionRate(totalSchedules, overdue);
  }

  /**
   * Helper: Calculate completion rate from total and overdue counts
   */
  private calculateCompletionRate(total: number, overdue: number): number {
    if (total === 0) {
      return 100;
    }
    const overdueRate = (overdue / total) * 100;
    return Math.round(100 - overdueRate);
  }

  /**
   * Get overdue PM schedules
   */
  async getOverduePM() {
    return this.pmScheduleDAO.findOverdue();
  }

  // ============================================================
  // LOCATION STATS
  // ============================================================

  /**
   * Get location statistics
   * PERFORMANCE: Uses COUNT queries instead of loading all data
   */
  async getLocationStats(): Promise<LocationStats> {
    const [totalLocations, locationsWithTickets] = await Promise.all([
      this.locationDAO.countTotal(),
      this.ticketDAO.countLocationsWithTickets(),
    ]);

    return {
      totalLocations,
      locationsWithTickets,
    };
  }

  /**
   * Get ticket counts by location
   * PERFORMANCE: Uses optimized queries - only fetches location_id from tickets
   */
  async getTicketsByLocation(): Promise<LocationTicketCount[]> {
    const [locations, locationTicketCounts] = await Promise.all([
      this.locationDAO.findAll(),
      this.ticketDAO.getLocationTicketCounts(),
    ]);

    // Map to location names
    return Object.entries(locationTicketCounts).map(
      ([locationId, ticketCount]): LocationTicketCount => {
        const location = locations.find((l) => l.id === locationId);
        return {
          locationId,
          locationName: location?.name || "Unknown",
          ticketCount,
        };
      },
    );
  }

  // ============================================================
  // ACTIVITY FEED
  // ============================================================

  /**
   * Get recent activity across all modules
   * PERFORMANCE: Uses LIMIT at database level instead of loading all records
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    // Fetch only the limited records we need from each source
    const [recentCreated, recentCompleted, expiringCompliance] =
      await Promise.all([
        this.ticketDAO.findRecentCreated(5),
        this.ticketDAO.findRecentCompleted(5),
        this.complianceDAO.findRecentExpiring(30, 5),
      ]);

    const activities: ActivityItem[] = [];

    // Recent ticket creations
    recentCreated.forEach((ticket) => {
      activities.push({
        id: ticket.id,
        type: "ticket_created",
        title: "New Ticket Created",
        description: ticket.title,
        timestamp: ticket.created_at,
        linkUrl: `/tickets/${ticket.id}`,
      });
    });

    // Recent ticket completions
    recentCompleted.forEach((ticket) => {
      activities.push({
        id: ticket.id,
        type: "ticket_completed",
        title: "Ticket Completed",
        description: ticket.title,
        timestamp: ticket.completed_at || ticket.created_at,
        linkUrl: `/tickets/${ticket.id}`,
      });
    });

    // Compliance expiring soon
    expiringCompliance.forEach((doc) => {
      activities.push({
        id: doc.id,
        type: "compliance_expiring",
        title: "Compliance Expiring Soon",
        description: doc.name,
        timestamp: doc.expiration_date!,
        linkUrl: `/compliance/${doc.id}`,
      });
    });

    // Sort all activities by timestamp and limit
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, limit);
  }
}
