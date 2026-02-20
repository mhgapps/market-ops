import { TicketDAO, TicketFilters } from '@/dao/ticket.dao';
import { AssetDAO } from '@/dao/asset.dao';
import { VendorDAO } from '@/dao/vendor.dao';
import { ComplianceDocumentDAO } from '@/dao/compliance-document.dao';
import { PMScheduleDAO } from '@/dao/pm-schedule.dao';
import type { TicketStatus, TicketPriority } from '@/types/database';

// Date range type
export interface DateRange {
  start: string;
  end: string;
}

// Ticket reports
export interface TicketReportFilters {
  dateRange?: DateRange;
  status?: string[];
  priority?: string[];
  locationId?: string;
  categoryId?: string;
}

export interface TicketReportData {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
  averageResolutionTime: number;
  tickets: unknown[];
}

export interface CategoryReport {
  categoryId: string;
  categoryName: string;
  count: number;
  percentage: number;
}

export interface LocationReport {
  locationId: string;
  locationName: string;
  count: number;
  percentage: number;
}

export interface ResolutionReport {
  averageDays: number;
  medianDays: number;
  fastestDays: number;
  slowestDays: number;
  byPriority: Record<string, number>;
}

// Asset reports
export interface AssetReportFilters {
  status?: string[];
  categoryId?: string;
  locationId?: string;
}

export interface AssetReportData {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byLocation: Record<string, number>;
  totalValue: number;
  assets: unknown[];
}

export interface AssetValueReport {
  totalValue: number;
  byCategory: Array<{ category: string; value: number }>;
  byLocation: Array<{ location: string; value: number }>;
}

export interface WarrantyReport {
  total: number;
  expiringSoon: number;
  expired: number;
  active: number;
  assets: unknown[];
}

export interface MaintenanceCostReport {
  totalCost: number;
  assetBreakdown: Array<{
    assetId: string;
    assetName: string;
    maintenanceCost: number;
    ticketCount: number;
  }>;
}

// Vendor reports
export interface VendorPerformanceReport {
  vendorId: string;
  vendorName: string;
  ticketsCompleted: number;
  averageRating: number;
  averageResponseTime: number;
  onTimeCompletionRate: number;
}

export interface VendorCostReport {
  vendorId: string;
  vendorName: string;
  totalCost: number;
  ticketCount: number;
  averageCostPerTicket: number;
}

// Compliance reports
export interface ComplianceStatusReport {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
  byType: Record<string, number>;
  byLocation: Record<string, number>;
}

export interface ExpirationCalendarReport {
  month: string;
  expirations: Array<{
    id: string;
    name: string;
    expirationDate: string;
    type: string;
  }>;
}

// PM reports
export interface PMComplianceReport {
  totalSchedules: number;
  completedOnTime: number;
  completedLate: number;
  missed: number;
  complianceRate: number;
  byAsset: Array<{
    assetId: string;
    assetName: string;
    scheduled: number;
    completed: number;
  }>;
}

export interface PMCostReport {
  totalEstimatedCost: number;
  totalActualCost: number;
  variance: number;
  byAsset: Array<{
    assetId: string;
    assetName: string;
    estimatedCost: number;
    actualCost: number;
  }>;
}

/**
 * Report Service
 * Generates various reports and analytics from system data
 */
export class ReportService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private assetDAO = new AssetDAO(),
    private vendorDAO = new VendorDAO(),
    private complianceDAO = new ComplianceDocumentDAO(),
    private pmScheduleDAO = new PMScheduleDAO()
  ) {}

  // ============================================================
  // TICKET REPORTS
  // ============================================================

  /**
   * Get ticket report with filters
   * PERFORMANCE: Uses database-level filtering instead of loading all tickets
   */
  async getTicketReport(filters: TicketReportFilters): Promise<TicketReportData> {
    // Build filters for DAO query - all filtering happens at database level
    const daoFilters: TicketFilters = {};

    if (filters.status && filters.status.length > 0) {
      daoFilters.status = filters.status as TicketStatus[];
    }

    if (filters.priority && filters.priority.length > 0) {
      daoFilters.priority = filters.priority as TicketPriority[];
    }

    if (filters.locationId) {
      daoFilters.location_id = filters.locationId;
    }

    if (filters.dateRange) {
      daoFilters.date_from = filters.dateRange.start;
      daoFilters.date_to = filters.dateRange.end;
    }

    // Query with filters applied at database level
    const tickets = await this.ticketDAO.findAllWithFilters(daoFilters, 1000);

    // Aggregate data from filtered results
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    tickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      if (t.category_id) {
        byCategory[t.category_id] = (byCategory[t.category_id] || 0) + 1;
      }
    });

    // Calculate average resolution time
    const closedTickets = tickets.filter((t) => t.status === 'closed' && t.closed_at);
    let averageResolutionTime = 0;

    if (closedTickets.length > 0) {
      const totalDays = closedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.closed_at!);
        const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      averageResolutionTime = totalDays / closedTickets.length;
    }

    return {
      total: tickets.length,
      byStatus,
      byPriority,
      byCategory,
      averageResolutionTime,
      tickets,
    };
  }

  /**
   * Get resolution time report
   * PERFORMANCE: Uses database-level filtering to only fetch closed tickets in date range
   */
  async getResolutionTimeReport(dateRange: DateRange): Promise<ResolutionReport> {
    // Query only closed tickets within the date range at database level
    const closedTickets = await this.ticketDAO.findClosedByDateRange(
      dateRange.start,
      dateRange.end
    );

    if (closedTickets.length === 0) {
      return {
        averageDays: 0,
        medianDays: 0,
        fastestDays: 0,
        slowestDays: 0,
        byPriority: {},
      };
    }

    // Calculate resolution times
    const resolutionTimes = closedTickets.map((t) => {
      const created = new Date(t.created_at);
      const closed = new Date(t.closed_at!);
      return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
    });

    resolutionTimes.sort((a, b) => a - b);

    const average = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
    const median = resolutionTimes[Math.floor(resolutionTimes.length / 2)];
    const fastest = resolutionTimes[0];
    const slowest = resolutionTimes[resolutionTimes.length - 1];

    // By priority
    const byPriority: Record<string, number> = {};
    const priorityGroups = closedTickets.reduce((acc, ticket) => {
      if (!acc[ticket.priority]) acc[ticket.priority] = [];
      const created = new Date(ticket.created_at);
      const closed = new Date(ticket.closed_at!);
      const days = (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      acc[ticket.priority].push(days);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(priorityGroups).forEach(([priority, times]) => {
      byPriority[priority] = times.reduce((a, b) => a + b, 0) / times.length;
    });

    return {
      averageDays: Math.round(average * 10) / 10,
      medianDays: Math.round(median * 10) / 10,
      fastestDays: Math.round(fastest * 10) / 10,
      slowestDays: Math.round(slowest * 10) / 10,
      byPriority,
    };
  }

  // ============================================================
  // ASSET REPORTS
  // ============================================================

  /**
   * Get asset report with filters
   * PERFORMANCE: Uses database-level filtering instead of loading all assets
   */
  async getAssetReport(filters: AssetReportFilters): Promise<AssetReportData> {
    // Build filters for DAO query - all filtering happens at database level
    const daoFilters: {
      status?: string;
      category_id?: string;
      location_id?: string;
    } = {};

    // Note: AssetDAO.findWithRelations supports single status filter
    // For multiple statuses, we need to handle differently or use multiple calls
    if (filters.status && filters.status.length === 1) {
      daoFilters.status = filters.status[0];
    }

    if (filters.categoryId) {
      daoFilters.category_id = filters.categoryId;
    }

    if (filters.locationId) {
      daoFilters.location_id = filters.locationId;
    }

    // Query with filters applied at database level
    let assets = await this.assetDAO.findWithRelations(daoFilters);

    // Handle multiple status filter if needed (rare case)
    if (filters.status && filters.status.length > 1) {
      assets = assets.filter((a) => filters.status!.includes(a.status || 'active'));
    }

    // Aggregate data from filtered results
    const byStatus: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byLocation: Record<string, number> = {};
    let totalValue = 0;

    assets.forEach((a) => {
      const status = a.status || 'active';
      byStatus[status] = (byStatus[status] || 0) + 1;

      if (a.category_id) {
        byCategory[a.category_id] = (byCategory[a.category_id] || 0) + 1;
      }

      if (a.location_id) {
        byLocation[a.location_id] = (byLocation[a.location_id] || 0) + 1;
      }

      if (a.purchase_price) {
        totalValue += a.purchase_price;
      }
    });

    return {
      total: assets.length,
      byStatus,
      byCategory,
      byLocation,
      totalValue,
      assets,
    };
  }

  async getWarrantyReport(): Promise<WarrantyReport> {
    const allAssets = await this.assetDAO.findAll();
    const expiringSoon = await this.assetDAO.findWarrantyExpiring(30);
    const now = new Date();

    const expired = allAssets.filter((a) => {
      if (!a.warranty_expiration) return false;
      return new Date(a.warranty_expiration) < now;
    });

    const active = allAssets.filter((a) => {
      if (!a.warranty_expiration) return false;
      return new Date(a.warranty_expiration) > now;
    });

    return {
      total: allAssets.filter((a) => a.warranty_expiration).length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      active: active.length,
      assets: allAssets.filter((a) => a.warranty_expiration),
    };
  }

  // ============================================================
  // COMPLIANCE REPORTS
  // ============================================================

  async getComplianceStatusReport(): Promise<ComplianceStatusReport> {
    const documents = await this.complianceDAO.findAll();
    const expiringSoon = await this.complianceDAO.findExpiringSoon(30);

    const byType: Record<string, number> = {};
    const byLocation: Record<string, number> = {};

    documents.forEach((d) => {
      if (d.document_type_id) {
        byType[d.document_type_id] = (byType[d.document_type_id] || 0) + 1;
      }
      if (d.location_id) {
        byLocation[d.location_id] = (byLocation[d.location_id] || 0) + 1;
      }
    });

    const active = documents.filter((d) => d.status === 'active').length;
    const expired = documents.filter((d) => d.status === 'expired').length;

    return {
      total: documents.length,
      active,
      expiringSoon: expiringSoon.length,
      expired,
      byType,
      byLocation,
    };
  }

  // ============================================================
  // PM REPORTS
  // ============================================================

  async getPMComplianceReport(_dateRange: DateRange): Promise<PMComplianceReport> {
    const schedules = await this.pmScheduleDAO.findAll();

    // This would require PM completion history tracking
    // For now, return placeholder data
    return {
      totalSchedules: schedules.length,
      completedOnTime: 0,
      completedLate: 0,
      missed: 0,
      complianceRate: 0,
      byAsset: [],
    };
  }

  // ============================================================
  // EXPORT HELPERS
  // ============================================================

  /**
   * Convert data to CSV format
   */
  exportToCSV(data: Record<string, unknown>[], _filename: string): Blob {
    if (data.length === 0) {
      return new Blob(['No data to export'], { type: 'text/csv' });
    }

    // Get headers from first row
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Add header row
    csvRows.push(headers.join(','));

    // Add data rows
    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(val).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      });
      csvRows.push(values.join(','));
    }

    return new Blob([csvRows.join('\n')], { type: 'text/csv' });
  }
}
