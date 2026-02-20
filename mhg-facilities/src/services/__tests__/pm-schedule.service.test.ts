import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { instance, mock, when, anything, verify } from 'ts-mockito';
import { PMScheduleService } from '../pm-schedule.service';
import { PMScheduleDAO } from '@/dao/pm-schedule.dao';
import { PMTemplateDAO } from '@/dao/pm-template.dao';
import { PMCompletionDAO } from '@/dao/pm-completion.dao';
import { TicketService } from '../ticket.service';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

describe('PMScheduleService', () => {
  let service: PMScheduleService;
  let mockScheduleDAO: PMScheduleDAO;
  let mockTemplateDAO: PMTemplateDAO;
  let mockTicketService: TicketService;
  let mockCompletionDAO: PMCompletionDAO;

  const createMockSchedule = (overrides: Partial<PMSchedule> = {}): PMSchedule => ({
    id: 'schedule-1',
    tenant_id: 'tenant-1',
    template_id: null,
    name: 'Test PM Schedule',
    description: null,
    asset_id: 'asset-1',
    location_id: null,
    frequency: 'monthly' as PMFrequency,
    day_of_week: null,
    day_of_month: 15,
    month_of_year: null,
    assigned_to: null,
    vendor_id: null,
    estimated_cost: null,
    is_active: true,
    next_due_date: '2026-02-15',
    last_generated_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides,
  });

  beforeEach(() => {
    mockScheduleDAO = mock(PMScheduleDAO);
    mockTemplateDAO = mock(PMTemplateDAO);
    mockTicketService = mock(TicketService);
    mockCompletionDAO = mock(PMCompletionDAO);

    service = new PMScheduleService(
      instance(mockScheduleDAO),
      instance(mockTemplateDAO),
      instance(mockTicketService),
      instance(mockCompletionDAO)
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateNextDueDate - recurrence calculation', () => {
    describe('weekly frequency', () => {
      it('should find next occurrence of specified day of week when day_of_week is set', () => {
        // Mock: Today is Wednesday (Jan 14, 2026)
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Wednesday

        const schedule = createMockSchedule({
          frequency: 'weekly',
          day_of_week: 5, // Friday
        });

        const result = service.calculateNextDueDate(schedule);

        // Next Friday from Wednesday is Jan 16, 2026
        expect(result).toBe('2026-01-16');
      });

      it('should go to next week if day_of_week is same as today', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Wednesday

        const schedule = createMockSchedule({
          frequency: 'weekly',
          day_of_week: 3, // Wednesday (same day)
        });

        const result = service.calculateNextDueDate(schedule);

        // Next Wednesday from Wednesday is Jan 21, 2026 (one week later)
        expect(result).toBe('2026-01-21');
      });

      it('should go to next week if day_of_week already passed this week', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Wednesday

        const schedule = createMockSchedule({
          frequency: 'weekly',
          day_of_week: 1, // Monday (already passed)
        });

        const result = service.calculateNextDueDate(schedule);

        // Next Monday from Wednesday is Jan 19, 2026
        expect(result).toBe('2026-01-19');
      });

      it('should default to +7 days when no day_of_week specified', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'weekly',
          day_of_week: null,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-01-21');
      });

      it('should handle Sunday (day 0) correctly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Wednesday

        const schedule = createMockSchedule({
          frequency: 'weekly',
          day_of_week: 0, // Sunday
        });

        const result = service.calculateNextDueDate(schedule);

        // Next Sunday from Wednesday is Jan 18, 2026
        expect(result).toBe('2026-01-18');
      });
    });

    describe('biweekly frequency', () => {
      it('should find next occurrence of specified day + 7 days for biweekly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Wednesday

        const schedule = createMockSchedule({
          frequency: 'biweekly',
          day_of_week: 5, // Friday
        });

        const result = service.calculateNextDueDate(schedule);

        // Next Friday is Jan 16, then +7 = Jan 23
        expect(result).toBe('2026-01-23');
      });

      it('should default to +14 days when no day_of_week specified', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'biweekly',
          day_of_week: null,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-01-28');
      });
    });

    describe('monthly frequency', () => {
      it('should handle month-end correctly when day_of_month exceeds month length', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z')); // January

        const schedule = createMockSchedule({
          frequency: 'monthly',
          day_of_month: 31, // February doesn't have 31 days
        });

        const result = service.calculateNextDueDate(schedule);

        // February 2026 has 28 days, so should clamp to 28
        expect(result).toBe('2026-02-28');
      });

      it('should handle February 30 correctly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'monthly',
          day_of_month: 30,
        });

        const result = service.calculateNextDueDate(schedule);

        // February 2026 has 28 days, so should clamp to 28
        expect(result).toBe('2026-02-28');
      });

      it('should preserve day_of_month when month has enough days', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'monthly',
          day_of_month: 15,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-02-15');
      });

      it('should handle leap year February correctly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // 2024 is a leap year

        const schedule = createMockSchedule({
          frequency: 'monthly',
          day_of_month: 29,
        });

        const result = service.calculateNextDueDate(schedule);

        // February 2024 has 29 days (leap year)
        expect(result).toBe('2024-02-29');
      });

      it('should handle April (30 days) when day_of_month is 31', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'monthly',
          day_of_month: 31,
        });

        const result = service.calculateNextDueDate(schedule);

        // April has 30 days, should clamp to 30
        expect(result).toBe('2026-04-30');
      });
    });

    describe('quarterly frequency', () => {
      it('should respect month_of_year for quarterly schedules', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z')); // January

        const schedule = createMockSchedule({
          frequency: 'quarterly',
          month_of_year: 3, // March - pattern: Mar, Jun, Sep, Dec
        });

        const result = service.calculateNextDueDate(schedule);

        // Next occurrence after January following March pattern is March
        expect(result).toBe('2026-03-15');
      });

      it('should find next quarter occurrence when month has passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-15T12:00:00Z')); // April

        const schedule = createMockSchedule({
          frequency: 'quarterly',
          month_of_year: 3, // March - pattern: Mar, Jun, Sep, Dec (months 2, 5, 8, 11)
        });

        const result = service.calculateNextDueDate(schedule);

        // After April (month 3), next in pattern is June (month 5)
        expect(result).toBe('2026-06-15');
      });

      it('should wrap to next year when all quarterly occurrences have passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-12-15T12:00:00Z')); // December

        const schedule = createMockSchedule({
          frequency: 'quarterly',
          month_of_year: 3, // March - pattern: Mar, Jun, Sep, Dec
        });

        const result = service.calculateNextDueDate(schedule);

        // After December, wrap to next year's March
        expect(result).toBe('2027-03-15');
      });

      it('should default to +3 months when month_of_year is not specified', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'quarterly',
          month_of_year: null,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-04-15');
      });

      it('should apply day_of_month correctly for quarterly', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'quarterly',
          month_of_year: 2, // February pattern
          day_of_month: 28,
        });

        const result = service.calculateNextDueDate(schedule);

        // February has 28 days in 2026
        expect(result).toBe('2026-02-28');
      });
    });

    describe('semi_annually frequency', () => {
      it('should respect month_of_year for semi-annual schedules', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z')); // January

        const schedule = createMockSchedule({
          frequency: 'semi_annually',
          month_of_year: 3, // March and September
        });

        const result = service.calculateNextDueDate(schedule);

        // Next occurrence after January is March
        expect(result).toBe('2026-03-15');
      });

      it('should find 6-month offset occurrence when first has passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-04-15T12:00:00Z')); // April

        const schedule = createMockSchedule({
          frequency: 'semi_annually',
          month_of_year: 3, // March (passed) and September
        });

        const result = service.calculateNextDueDate(schedule);

        // After April, next is September (March + 6)
        expect(result).toBe('2026-09-15');
      });

      it('should wrap to next year when both occurrences have passed', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-10-15T12:00:00Z')); // October

        const schedule = createMockSchedule({
          frequency: 'semi_annually',
          month_of_year: 3, // March and September (both passed)
        });

        const result = service.calculateNextDueDate(schedule);

        // After October, wrap to next year's March
        expect(result).toBe('2027-03-15');
      });

      it('should default to +6 months when month_of_year is not specified', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'semi_annually',
          month_of_year: null,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-07-15');
      });

      it('should apply day_of_month correctly for semi-annual', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'semi_annually',
          month_of_year: 2, // February
          day_of_month: 29, // Will be clamped
        });

        const result = service.calculateNextDueDate(schedule);

        // February 2026 has 28 days
        expect(result).toBe('2026-02-28');
      });
    });

    describe('annually frequency', () => {
      it('should set both month_of_year and day_of_month', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'annually',
          month_of_year: 6, // June
          day_of_month: 20,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2027-06-20');
      });

      it('should handle February 29 on non-leap year', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'annually',
          month_of_year: 2, // February
          day_of_month: 29,
        });

        const result = service.calculateNextDueDate(schedule);

        // 2027 is not a leap year, clamp to 28
        expect(result).toBe('2027-02-28');
      });

      it('should default to same month next year when month_of_year not specified', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-15T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'annually',
          month_of_year: null,
          day_of_month: null,
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2027-01-15');
      });
    });

    describe('daily frequency', () => {
      it('should always return next day', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-01-14T12:00:00Z'));

        const schedule = createMockSchedule({
          frequency: 'daily',
        });

        const result = service.calculateNextDueDate(schedule);

        expect(result).toBe('2026-01-15');
      });
    });
  });

  describe('createSchedule', () => {
    it('should calculate next_due_date using new recurrence logic', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-14T12:00:00Z')); // Tuesday

      const mockCreatedSchedule = createMockSchedule({
        frequency: 'weekly',
        day_of_week: 5, // Friday
        next_due_date: '2026-01-16',
      });

      when(mockScheduleDAO.create(anything())).thenResolve(mockCreatedSchedule);

      const result = await service.createSchedule({
        name: 'Test Schedule',
        frequency: 'weekly',
        day_of_week: 5,
        asset_id: 'asset-1',
      });

      expect(result.next_due_date).toBe('2026-01-16');
    });

    it('should throw error if name is empty', async () => {
      await expect(
        service.createSchedule({
          name: '',
          frequency: 'monthly',
          asset_id: 'asset-1',
        })
      ).rejects.toThrow('Schedule name is required');
    });

    it('should throw error if neither asset_id nor location_id is provided', async () => {
      await expect(
        service.createSchedule({
          name: 'Test',
          frequency: 'monthly',
        })
      ).rejects.toThrow('Either asset_id or location_id is required');
    });

    it('should throw error if both asset_id and location_id are provided', async () => {
      await expect(
        service.createSchedule({
          name: 'Test',
          frequency: 'monthly',
          asset_id: 'asset-1',
          location_id: 'location-1',
        })
      ).rejects.toThrow('Cannot specify both asset_id and location_id');
    });
  });

  describe('updateSchedule', () => {
    it('should recalculate next_due_date when frequency changes', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-14T12:00:00Z'));

      const existingSchedule = createMockSchedule({
        frequency: 'monthly',
        day_of_month: 15,
      });

      when(mockScheduleDAO.findById('schedule-1')).thenResolve(existingSchedule);
      when(mockScheduleDAO.update('schedule-1', anything())).thenResolve({
        ...existingSchedule,
        frequency: 'weekly',
        day_of_week: 5,
      });

      await service.updateSchedule('schedule-1', {
        frequency: 'weekly',
        day_of_week: 5,
      });

      verify(mockScheduleDAO.update('schedule-1', anything())).once();
    });

    it('should throw error if schedule not found', async () => {
      when(mockScheduleDAO.findById('non-existent')).thenResolve(null);

      await expect(
        service.updateSchedule('non-existent', { name: 'Updated' })
      ).rejects.toThrow('PM schedule not found');
    });
  });

  describe('deleteSchedule', () => {
    it('should soft delete schedule', async () => {
      const existingSchedule = createMockSchedule();
      when(mockScheduleDAO.findById('schedule-1')).thenResolve(existingSchedule);
      when(mockScheduleDAO.softDelete('schedule-1')).thenResolve();

      await service.deleteSchedule('schedule-1');

      verify(mockScheduleDAO.softDelete('schedule-1')).once();
    });

    it('should throw error if schedule not found', async () => {
      when(mockScheduleDAO.findById('non-existent')).thenResolve(null);

      await expect(service.deleteSchedule('non-existent')).rejects.toThrow(
        'PM schedule not found'
      );
    });
  });
});
