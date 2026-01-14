import { TicketDAO } from '@/dao/ticket.dao';
import { AssetDAO } from '@/dao/asset.dao';
import { ComplianceDocumentDAO } from '@/dao/compliance-document.dao';
import { PMScheduleDAO } from '@/dao/pm-schedule.dao';
import { LocationDAO } from '@/dao/location.dao';
import type { TicketStatus, TicketPriority } from '@/types/database';

// Overview stats
export interface OverviewStats {
  openTickets: number;
  pendingApprovals: number;
  expiringCompliance: number;
  overduePM: number;
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
  maintenance: number;
  retired: number;
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
  type: 'ticket_created' | 'ticket_completed' | 'compliance_expiring' | 'pm_completed';
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
    private locationDAO = new LocationDAO()
  ) {}

  // ============================================================
  // OVERVIEW STATS
  // ============================================================

  /**
   * Get high-level overview stats for dashboard cards
   */
  async getOverviewStats(): Promise<OverviewStats> {
    const [tickets, compliance, pmSchedules] = await Promise.all([
      this.ticketDAO.findAll(),
      this.complianceDAO.findExpiringSoon(30),
      this.pmScheduleDAO.findOverdue(),
    ]);

    // Count open tickets (not closed, verified, or rejected)
    const openTickets = tickets.filter(
      (t: { status: TicketStatus }) =>
        t.status !== 'closed' &&
        t.status !== 'verified' &&
        t.status !== 'rejected'
    ).length;

    // Count tickets needing approval
    const pendingApprovals = tickets.filter(
      (t: { status: TicketStatus }) => t.status === 'needs_approval'
    ).length;

    return {
      openTickets,
      pendingApprovals,
      expiringCompliance: compliance.length,
      overduePM: pmSchedules.length,
    };
  }

  // ============================================================
  // TICKET STATS
  // ============================================================

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    const tickets = await this.ticketDAO.findAll();

    const open = tickets.filter(
      (t) =>
        t.status !== 'closed' &&
        t.status !== 'verified' &&
        t.status !== 'rejected'
    ).length;

    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;

    const completed = tickets.filter(
      (t) => t.status === 'completed' || t.status === 'verified' || t.status === 'closed'
    ).length;

    // Calculate average resolution time for closed tickets
    const closedTickets = tickets.filter((t) => t.status === 'closed' && t.closed_at);
    let averageResolutionDays = 0;

    if (closedTickets.length > 0) {
      const totalDays = closedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.closed_at!);
        const days = Math.floor(
          (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);

      averageResolutionDays = Math.round(totalDays / closedTickets.length);
    }

    return {
      total: tickets.length,
      open,
      inProgress,
      completed,
      averageResolutionDays,
    };
  }

  /**
   * Get ticket counts by status
   */
  async getTicketsByStatus(): Promise<StatusCount[]> {
    const tickets = await this.ticketDAO.findAll();

    const statusCounts = tickets.reduce(
      (acc, ticket) => {
        const status = ticket.status as string;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }

  /**
   * Get ticket counts by priority
   */
  async getTicketsByPriority(): Promise<PriorityCount[]> {
    const tickets = await this.ticketDAO.findAll();

    const priorityCounts = tickets.reduce(
      (acc, ticket) => {
        const priority = ticket.priority as string;
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
    }));
  }

  /**
   * Get ticket creation trend over time
   */
  async getTicketTrend(days: number): Promise<TrendData[]> {
    const tickets = await this.ticketDAO.findAll();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filter tickets in date range
    const recentTickets = tickets.filter((t) => {
      const created = new Date(t.created_at);
      return created >= startDate && created <= endDate;
    });

    // Group by date
    const dateMap = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dateMap.set(dateKey, 0);
    }

    recentTickets.forEach((ticket) => {
      const dateKey = ticket.created_at.split('T')[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, dateMap.get(dateKey)! + 1);
      }
    });

    // Convert to array and sort by date
    return Array.from(dateMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get average ticket resolution time in hours
   */
  async getAverageResolutionTime(): Promise<number> {
    const tickets = await this.ticketDAO.findAll();
    const closedTickets = tickets.filter((t) => t.status === 'closed' && t.closed_at);

    if (closedTickets.length === 0) {
      return 0;
    }

    const totalHours = closedTickets.reduce((sum, ticket) => {
      const created = new Date(ticket.created_at);
      const closed = new Date(ticket.closed_at!);
      const hours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return Math.round(totalHours / closedTickets.length);
  }

  // ============================================================
  // ASSET STATS
  // ============================================================

  /**
   * Get asset statistics
   */
  async getAssetStats(): Promise<AssetStats> {
    const [allAssets, expiringWarranties] = await Promise.all([
      this.assetDAO.findAll(),
      this.assetDAO.findWarrantyExpiring(30),
    ]);

    const active = allAssets.filter((a) => a.status === 'active').length;
    const maintenance = allAssets.filter(
      (a) => a.status === 'under_maintenance'
    ).length;
    const retired = allAssets.filter((a) => a.status === 'retired').length;

    return {
      total: allAssets.length,
      active,
      maintenance,
      retired,
      expiringWarranties: expiringWarranties.length,
    };
  }

  /**
   * Get asset counts by status
   */
  async getAssetsByStatus(): Promise<StatusCount[]> {
    const assets = await this.assetDAO.findAll();

    const statusCounts = assets.reduce(
      (acc, asset) => {
        const status = asset.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
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
   */
  async getComplianceStats(): Promise<ComplianceStats> {
    const [allDocs, expiringSoon] = await Promise.all([
      this.complianceDAO.findAll(),
      this.complianceDAO.findExpiringSoon(30),
    ]);

    const active = allDocs.filter((d: { status: string }) => d.status === 'active').length;
    const expired = allDocs.filter((d: { status: string }) => d.status === 'expired').length;

    return {
      total: allDocs.length,
      active,
      expiringSoon: expiringSoon.length,
      expired,
    };
  }

  /**
   * Get compliance counts by status
   */
  async getComplianceByStatus(): Promise<StatusCount[]> {
    const documents = await this.complianceDAO.findAll();

    const statusCounts = documents.reduce(
      (acc, doc) => {
        const status = doc.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
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
   */
  async getPMStats(): Promise<PMStats> {
    const [allSchedules, overdue] = await Promise.all([
      this.pmScheduleDAO.findAll(),
      this.pmScheduleDAO.findOverdue(),
    ]);

    const activeSchedules = allSchedules.filter((s: { is_active: boolean }) => s.is_active).length;

    // Calculate completion rate (completed on time vs total due)
    const completionRate = await this.getPMCompletionRate(3);

    return {
      totalSchedules: allSchedules.length,
      activeSchedules,
      overdue: overdue.length,
      completionRate,
    };
  }

  /**
   * Get PM completion rate over specified months
   */
  async getPMCompletionRate(months: number): Promise<number> {
    // This would require PM completion tracking
    // For now, return a placeholder based on overdue ratio
    const [allSchedules, overdue] = await Promise.all([
      this.pmScheduleDAO.findAll(),
      this.pmScheduleDAO.findOverdue(),
    ]);

    if (allSchedules.length === 0) {
      return 100;
    }

    const overdueRate = (overdue.length / allSchedules.length) * 100;
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
   */
  async getLocationStats(): Promise<LocationStats> {
    const [locations, tickets] = await Promise.all([
      this.locationDAO.findAll(),
      this.ticketDAO.findAll(),
    ]);

    // Count unique locations with tickets
    const locationIdsWithTickets = new Set(
      tickets.map((t) => t.location_id).filter(Boolean)
    );

    return {
      totalLocations: locations.length,
      locationsWithTickets: locationIdsWithTickets.size,
    };
  }

  /**
   * Get ticket counts by location
   */
  async getTicketsByLocation(): Promise<LocationTicketCount[]> {
    const [locations, tickets] = await Promise.all([
      this.locationDAO.findAll(),
      this.ticketDAO.findAll(),
    ]);

    // Count tickets per location
    const locationTicketCounts = tickets.reduce(
      (acc, ticket) => {
        if (ticket.location_id) {
          acc[ticket.location_id] = (acc[ticket.location_id] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    // Map to location names
    return Object.entries(locationTicketCounts).map(
      ([locationId, ticketCount]) => {
        const location = locations.find((l) => l.id === locationId);
        return {
          locationId,
          locationName: location?.name || 'Unknown',
          ticketCount,
        };
      }
    );
  }

  // ============================================================
  // ACTIVITY FEED
  // ============================================================

  /**
   * Get recent activity across all modules
   */
  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    const [tickets, compliance] = await Promise.all([
      this.ticketDAO.findAll(),
      this.complianceDAO.findAll(),
    ]);

    const activities: ActivityItem[] = [];

    // Recent ticket creations
    tickets
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5)
      .forEach((ticket) => {
        activities.push({
          id: ticket.id,
          type: 'ticket_created',
          title: 'New Ticket Created',
          description: ticket.title,
          timestamp: ticket.created_at,
          linkUrl: `/tickets/${ticket.id}`,
        });
      });

    // Recent ticket completions
    tickets
      .filter((t) => t.status === 'completed' && t.completed_at)
      .sort(
        (a, b) =>
          new Date(b.completed_at || b.created_at).getTime() -
          new Date(a.completed_at || a.created_at).getTime()
      )
      .slice(0, 5)
      .forEach((ticket) => {
        activities.push({
          id: ticket.id,
          type: 'ticket_completed',
          title: 'Ticket Completed',
          description: ticket.title,
          timestamp: ticket.completed_at || ticket.created_at,
          linkUrl: `/tickets/${ticket.id}`,
        });
      });

    // Compliance expiring soon
    compliance
      .filter((d) => d.status === 'expiring_soon' && d.expiration_date)
      .sort(
        (a, b) =>
          new Date(a.expiration_date!).getTime() -
          new Date(b.expiration_date!).getTime()
      )
      .slice(0, 5)
      .forEach((doc) => {
        activities.push({
          id: doc.id,
          type: 'compliance_expiring',
          title: 'Compliance Expiring Soon',
          description: doc.name,
          timestamp: doc.expiration_date!,
          linkUrl: `/compliance/${doc.id}`,
        });
      });

    // Sort all activities by timestamp and limit
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, limit);
  }
}
