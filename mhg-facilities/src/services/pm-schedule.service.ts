import { PMScheduleDAO } from '@/dao/pm-schedule.dao';
import { PMTemplateDAO } from '@/dao/pm-template.dao';
import { PMCompletionDAO } from '@/dao/pm-completion.dao';
import { TicketService } from './ticket.service';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

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
}

interface PMFilters {
  asset_id?: string;
  location_id?: string;
  frequency?: PMFrequency;
  is_active?: boolean;
}

interface PMStats {
  total: number;
  active: number;
  due_today: number;
  overdue: number;
  completed_this_month: number;
}

interface PMCalendarItem {
  date: string;
  schedules: Array<{
    id: string;
    name: string;
    frequency: PMFrequency;
  }>;
}

export class PMScheduleService {
  constructor(
    private scheduleDAO = new PMScheduleDAO(),
    private templateDAO = new PMTemplateDAO(),
    private ticketService = new TicketService(),
    private completionDAO = new PMCompletionDAO()
  ) {}

  async getAllSchedules(filters?: PMFilters): Promise<PMSchedule[]> {
    if (filters?.asset_id) {
      return await this.scheduleDAO.findByAsset(filters.asset_id);
    }

    if (filters?.location_id) {
      return await this.scheduleDAO.findByLocation(filters.location_id);
    }

    if (filters?.frequency) {
      return await this.scheduleDAO.findByFrequency(filters.frequency);
    }

    if (filters?.is_active !== undefined) {
      if (filters.is_active) {
        return await this.scheduleDAO.findActive();
      }
    }

    return await this.scheduleDAO.findAll();
  }

  async getScheduleById(id: string) {
    return await this.scheduleDAO.findWithCompletions(id);
  }

  async getSchedulesByAsset(assetId: string): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findByAsset(assetId);
  }

  async getSchedulesByLocation(locationId: string): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findByLocation(locationId);
  }

  async getDueToday(): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findDueToday();
  }

  async getOverdue(): Promise<PMSchedule[]> {
    return await this.scheduleDAO.findOverdue();
  }

  async getPMCalendar(month: number, year: number): Promise<PMCalendarItem[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const all = await this.scheduleDAO.findActive();

    const calendar: Map<string, PMCalendarItem> = new Map();

    all.forEach(schedule => {
      if (!schedule.next_due_date) return;

      const dueDate = new Date(schedule.next_due_date);
      if (dueDate >= startDate && dueDate <= endDate) {
        const dateKey = schedule.next_due_date;

        if (!calendar.has(dateKey)) {
          calendar.set(dateKey, {
            date: dateKey,
            schedules: []
          });
        }

        calendar.get(dateKey)!.schedules.push({
          id: schedule.id,
          name: schedule.name,
          frequency: schedule.frequency
        });
      }
    });

    return Array.from(calendar.values()).sort((a, b) => a.date.localeCompare(b.date));
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

    if (data.frequency !== undefined || data.day_of_week !== undefined ||
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
        now.setDate(now.getDate() + 7);
        break;
      case 'biweekly':
        now.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        if (dayOfMonth) {
          now.setDate(Math.min(dayOfMonth, 28));
        }
        break;
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'semi_annually':
        now.setMonth(now.getMonth() + 6);
        break;
      case 'annually':
        now.setFullYear(now.getFullYear() + 1);
        if (monthOfYear) {
          now.setMonth(monthOfYear - 1);
        }
        break;
    }

    return now.toISOString().split('T')[0];
  }
}
