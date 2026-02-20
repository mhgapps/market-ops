import { PMScheduleDAO, type PMScheduleFilters, type PMScheduleWithRelations } from '@/dao/pm-schedule.dao';
import { PMTemplateDAO } from '@/dao/pm-template.dao';
import { PMCompletionDAO } from '@/dao/pm-completion.dao';
import { TicketService } from './ticket.service';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

// Re-export enriched type for API consumers
export type { PMScheduleWithRelations };

interface CreatePMScheduleInput {
  template_id?: string | null;
  name: string;
  description?: string | null;
  asset_id?: string | null;
  location_id?: string | null;
  frequency: PMFrequency;
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  assigned_to?: string | null;
  vendor_id?: string | null;
  estimated_cost?: number | null;
}

interface UpdatePMScheduleInput {
  template_id?: string | null;
  name?: string;
  description?: string | null;
  asset_id?: string | null;
  location_id?: string | null;
  frequency?: PMFrequency;
  day_of_week?: number | null;
  day_of_month?: number | null;
  month_of_year?: number | null;
  assigned_to?: string | null;
  vendor_id?: string | null;
  estimated_cost?: number | null;
  is_active?: boolean;
  next_due_date?: string;
  last_generated_at?: string | null;
}

interface PMStats {
  total: number;
  active: number;
  due_today: number;
  overdue: number;
  completed_this_month: number;
}

interface PMCalendarItem {
  id: string;
  name: string;
  asset_name: string | null;
  location_name: string | null;
  frequency: PMFrequency;
  next_due_date: string | null;
}

export class PMScheduleService {
  constructor(
    private scheduleDAO = new PMScheduleDAO(),
    private templateDAO = new PMTemplateDAO(),
    private ticketService = new TicketService(),
    private completionDAO = new PMCompletionDAO()
  ) {}

  /**
   * Get all PM schedules with enriched relation data.
   * Returns flat objects with asset_name, location_name, assigned_to_name, vendor_name, last_completed_at.
   */
  async getAllSchedules(filters?: PMScheduleFilters): Promise<PMScheduleWithRelations[]> {
    // If no filters provided, return all schedules with relations
    if (!filters) {
      return await this.scheduleDAO.findAllWithRelations();
    }

    // Check if any filters are actually set
    const hasFilters =
      filters.asset_id !== undefined ||
      filters.location_id !== undefined ||
      filters.frequency !== undefined ||
      filters.is_active !== undefined;

    if (!hasFilters) {
      return await this.scheduleDAO.findAllWithRelations();
    }

    // Use the combined filters method in DAO with relations for proper AND logic
    return await this.scheduleDAO.findWithFiltersAndRelations(filters);
  }

  /**
   * Get a single PM schedule by ID with enriched relation data.
   * Returns flat object with asset_name, location_name, assigned_to_name, vendor_name, last_completed_at.
   */
  async getScheduleById(id: string): Promise<PMScheduleWithRelations | null> {
    return await this.scheduleDAO.findByIdWithRelations(id);
  }

  /**
   * Get a PM schedule with its completions history (for detail views).
   */
  async getScheduleWithCompletions(id: string) {
    return await this.scheduleDAO.findWithCompletions(id);
  }

  async getSchedulesByAsset(assetId: string): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findByAsset(assetId);
  }

  async getSchedulesByLocation(locationId: string): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findByLocation(locationId);
  }

  /**
   * Get PM schedules that are due today with enriched relation data.
   */
  async getDueToday(): Promise<PMScheduleWithRelations[]> {
    return await this.scheduleDAO.findDueTodayWithRelations();
  }

  async getOverdue(): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findOverdue();
  }

  /**
   * Get PM calendar data for the specified month/year.
   * Returns a flat array of schedules with their asset/location names,
   * filtered to only include schedules due in the specified month.
   */
  async getPMCalendar(month: number, year: number): Promise<PMCalendarItem[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Fetch active schedules with joined asset/location names
    const all = await this.scheduleDAO.findActiveWithRelations();

    // Filter to only schedules due within the specified month
    const calendarItems: PMCalendarItem[] = [];

    all.forEach(schedule => {
      if (!schedule.next_due_date) return;

      const dueDate = new Date(schedule.next_due_date);
      if (dueDate >= startDate && dueDate <= endDate) {
        calendarItems.push({
          id: schedule.id,
          name: schedule.name,
          asset_name: schedule.asset_name,
          location_name: schedule.location_name,
          frequency: schedule.frequency,
          next_due_date: schedule.next_due_date,
        });
      }
    });

    // Sort by due date
    return calendarItems.sort((a, b) => {
      const dateA = a.next_due_date || '';
      const dateB = b.next_due_date || '';
      return dateA.localeCompare(dateB);
    });
  }

  async getPMStats(): Promise<PMStats> {
    const all = await this.scheduleDAO.findAll();
    const active = await this.scheduleDAO.findActive();
    const dueToday = await this.scheduleDAO.findDueToday();
    const overdue = await this.scheduleDAO.findOverdue();

    return {
      total: all.length,
      active: active.length,
      due_today: dueToday.length,
      overdue: overdue.length,
      completed_this_month: 0,
    };
  }

  async createSchedule(data: CreatePMScheduleInput): Promise<PMSchedule> {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Schedule name is required');
    }

    if (!data.asset_id && !data.location_id) {
      throw new Error('Either asset_id or location_id is required');
    }

    if (data.asset_id && data.location_id) {
      throw new Error('Cannot specify both asset_id and location_id');
    }

    if (data.template_id) {
      const template = await this.templateDAO.findById(data.template_id);
      if (!template) {
        throw new Error('PM template not found');
      }
    }

    const nextDueDate = this.calculateNextDueDateFromFrequency(
      data.frequency,
      data.day_of_week ?? null,
      data.day_of_month ?? null,
      data.month_of_year ?? null
    );

    return await this.scheduleDAO.create({
      template_id: data.template_id || null,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      asset_id: data.asset_id || null,
      location_id: data.location_id || null,
      frequency: data.frequency,
      day_of_week: data.day_of_week || null,
      day_of_month: data.day_of_month || null,
      month_of_year: data.month_of_year || null,
      assigned_to: data.assigned_to || null,
      vendor_id: data.vendor_id || null,
      estimated_cost: data.estimated_cost || null,
      is_active: true,
      next_due_date: nextDueDate,
      last_generated_at: null,
    });
  }

  async updateSchedule(id: string, data: UpdatePMScheduleInput): Promise<PMSchedule> {
    const existing = await this.scheduleDAO.findById(id);
    if (!existing) {
      throw new Error('PM schedule not found');
    }

    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      throw new Error('Schedule name is required');
    }

    if (data.template_id) {
      const template = await this.templateDAO.findById(data.template_id);
      if (!template) {
        throw new Error('PM template not found');
      }
    }

    // XOR validation for asset_id/location_id
    const finalAssetId = data.asset_id !== undefined ? data.asset_id : existing.asset_id;
    const finalLocationId = data.location_id !== undefined ? data.location_id : existing.location_id;

    if (!finalAssetId && !finalLocationId) {
      throw new Error('Either asset_id or location_id is required');
    }

    if (finalAssetId && finalLocationId) {
      throw new Error('Cannot specify both asset_id and location_id');
    }

    const updateData: Record<string, unknown> = {};
    if (data.template_id !== undefined) updateData.template_id = data.template_id;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.asset_id !== undefined) updateData.asset_id = data.asset_id;
    if (data.location_id !== undefined) updateData.location_id = data.location_id;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.day_of_week !== undefined) updateData.day_of_week = data.day_of_week;
    if (data.day_of_month !== undefined) updateData.day_of_month = data.day_of_month;
    if (data.month_of_year !== undefined) updateData.month_of_year = data.month_of_year;
    if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;
    if (data.vendor_id !== undefined) updateData.vendor_id = data.vendor_id;
    if (data.estimated_cost !== undefined) updateData.estimated_cost = data.estimated_cost;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.last_generated_at !== undefined) updateData.last_generated_at = data.last_generated_at;

    // If next_due_date is explicitly provided, use it; otherwise recalculate if frequency params changed
    if (data.next_due_date !== undefined) {
      updateData.next_due_date = data.next_due_date;
    } else if (data.frequency !== undefined || data.day_of_week !== undefined ||
        data.day_of_month !== undefined || data.month_of_year !== undefined) {
      const newNextDueDate = this.calculateNextDueDateFromFrequency(
        data.frequency || existing.frequency,
        data.day_of_week !== undefined ? data.day_of_week : existing.day_of_week,
        data.day_of_month !== undefined ? data.day_of_month : existing.day_of_month,
        data.month_of_year !== undefined ? data.month_of_year : existing.month_of_year
      );
      updateData.next_due_date = newNextDueDate;
    }

    return await this.scheduleDAO.update(id, updateData);
  }

  async deleteSchedule(id: string): Promise<void> {
    const existing = await this.scheduleDAO.findById(id);
    if (!existing) {
      throw new Error('PM schedule not found');
    }

    await this.scheduleDAO.softDelete(id);
  }

  async activateSchedule(id: string): Promise<PMSchedule> {
    return await this.scheduleDAO.update(id, { is_active: true });
  }

  async deactivateSchedule(id: string): Promise<PMSchedule> {
    return await this.scheduleDAO.update(id, { is_active: false });
  }

  async generateTickets(): Promise<Array<{ schedule_id: string; message: string }>> {
    const due = await this.scheduleDAO.findDueToday();

    const tickets: Array<{ schedule_id: string; message: string }> = [];
    for (const schedule of due) {
      tickets.push({
        schedule_id: schedule.id,
        message: `Generated ticket for PM schedule: ${schedule.name}`
      });
    }

    return tickets;
  }

  async markCompleted(
    scheduleId: string,
    ticketId: string,
    userId: string,
    checklistResults?: Record<string, unknown>
  ) {
    const schedule = await this.scheduleDAO.findById(scheduleId);
    if (!schedule) {
      throw new Error('PM schedule not found');
    }

    const today = new Date().toISOString().split('T')[0];

    const completion = await this.completionDAO.create({
      schedule_id: scheduleId,
      ticket_id: ticketId,
      scheduled_date: today,
      completed_date: today,
      completed_by: userId,
      checklist_results: checklistResults || null,
    });

    const nextDueDate = this.calculateNextDueDate(schedule);

    await this.scheduleDAO.update(scheduleId, {
      next_due_date: nextDueDate,
      last_generated_at: new Date().toISOString(),
    });

    return completion;
  }

  calculateNextDueDate(schedule: PMSchedule): string {
    return this.calculateNextDueDateFromFrequency(
      schedule.frequency,
      schedule.day_of_week,
      schedule.day_of_month,
      schedule.month_of_year
    );
  }

  private calculateNextDueDateFromFrequency(
    frequency: PMFrequency,
    dayOfWeek: number | null,
    dayOfMonth: number | null,
    monthOfYear: number | null
  ): string {
    const now = new Date();

    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) {
          // Find next occurrence of specified day (0=Sunday, 6=Saturday)
          const currentDay = now.getDay();
          let daysUntil = dayOfWeek - currentDay;
          if (daysUntil <= 0) daysUntil += 7;
          now.setDate(now.getDate() + daysUntil);
        } else {
          now.setDate(now.getDate() + 7);
        }
        break;
      case 'biweekly':
        if (dayOfWeek !== null && dayOfWeek >= 0 && dayOfWeek <= 6) {
          // Find next occurrence of specified day, then add a week for biweekly
          const currentDay = now.getDay();
          let daysUntil = dayOfWeek - currentDay;
          if (daysUntil <= 0) daysUntil += 7;
          now.setDate(now.getDate() + daysUntil + 7);
        } else {
          now.setDate(now.getDate() + 14);
        }
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
          // Get last day of the new month to handle month-end properly
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          now.setDate(Math.min(dayOfMonth, lastDay));
        }
        break;
      case 'quarterly':
        if (monthOfYear !== null && monthOfYear >= 1 && monthOfYear <= 12) {
          // Find the next quarter occurrence that aligns with the target month pattern
          const currentMonth = now.getMonth(); // 0-indexed
          const targetMonth = monthOfYear - 1; // Convert to 0-indexed

          // Calculate the next occurrence based on quarterly intervals from target month
          // e.g., if target is March (2), occurrences are Mar, Jun, Sep, Dec (months 2, 5, 8, 11)
          const quarterOffset = targetMonth % 3; // Which position in quarter
          const possibleMonths = [quarterOffset, quarterOffset + 3, quarterOffset + 6, quarterOffset + 9];

          let nextMonth = possibleMonths.find(m => m > currentMonth);
          let yearOffset = 0;

          if (nextMonth === undefined) {
            // All occurrences have passed this year
            nextMonth = possibleMonths[0];
            yearOffset = 1;
          }

          now.setFullYear(now.getFullYear() + yearOffset);
          now.setMonth(nextMonth);
        } else {
          now.setMonth(now.getMonth() + 3);
        }
        // Apply day of month if specified
        if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          now.setDate(Math.min(dayOfMonth, lastDay));
        }
        break;
      case 'semi_annually':
        if (monthOfYear !== null && monthOfYear >= 1 && monthOfYear <= 12) {
          // Find the next occurrence of the target month or 6 months after
          const currentMonth = now.getMonth(); // 0-indexed
          const targetMonth = monthOfYear - 1; // Convert to 0-indexed
          const targetMonthPlus6 = (targetMonth + 6) % 12;

          // Determine which occurrence is next
          let nextMonth: number;
          let yearOffset = 0;

          if (targetMonth > currentMonth) {
            nextMonth = targetMonth;
          } else if (targetMonthPlus6 > currentMonth) {
            nextMonth = targetMonthPlus6;
          } else {
            // Both occurrences have passed this year, go to next year
            nextMonth = targetMonth;
            yearOffset = 1;
          }

          now.setFullYear(now.getFullYear() + yearOffset);
          now.setMonth(nextMonth);
        } else {
          now.setMonth(now.getMonth() + 6);
        }
        // Apply day of month if specified
        if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          now.setDate(Math.min(dayOfMonth, lastDay));
        }
        break;
      case 'annually':
        now.setFullYear(now.getFullYear() + 1);
        if (monthOfYear && monthOfYear >= 1 && monthOfYear <= 12) {
          now.setMonth(monthOfYear - 1);
        }
        if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
          const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          now.setDate(Math.min(dayOfMonth, lastDay));
        }
        break;
    }

    return now.toISOString().split('T')[0];
  }
}
