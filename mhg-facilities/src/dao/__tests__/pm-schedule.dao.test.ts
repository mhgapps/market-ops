import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PMScheduleDAO } from '../pm-schedule.dao';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

describe('PMScheduleDAO', () => {
  let dao: PMScheduleDAO;
  let mockSupabase: any;
  let mockQuery: any;

  const mockSchedule: PMSchedule = {
    id: 'schedule-1',
    tenant_id: 'test-tenant-id',
    template_id: 'template-1',
    asset_id: 'asset-1',
    location_id: 'location-1',
    title: 'Monthly HVAC Inspection',
    description: 'Check filters and coolant levels',
    frequency: 'monthly' as PMFrequency,
    start_date: '2024-01-01',
    next_due_date: '2024-02-01',
    last_completed_date: null,
    assigned_to: 'user-1',
    is_active: true,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new PMScheduleDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => mockQuery),
    };

    vi.doMock('@/lib/supabase/server-pooled', () => ({
      getPooledSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
    }));

    vi.doMock('@/lib/tenant/context', () => ({
      getTenantContext: vi.fn(() =>
        Promise.resolve({ id: 'test-tenant-id', name: 'Test Tenant' })
      ),
    }));
  });

  describe('findActive', () => {
    it('should return only active schedules', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockSchedule], error: null });

      const result = await dao.findActive();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('next_due_date', { ascending: true });
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('findByAsset', () => {
    it('should find schedules for a specific asset', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockSchedule], error: null });

      const result = await dao.findByAsset('asset-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('asset_id', 'asset-1');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('findByLocation', () => {
    it('should find schedules for a specific location', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockSchedule], error: null });

      const result = await dao.findByLocation('location-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('location_id', 'location-1');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('findDueToday', () => {
    it('should find schedules due today or earlier', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockSchedule], error: null });

      const result = await dao.findDueToday();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.lte).toHaveBeenCalledWith('next_due_date', expect.any(String));
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('findOverdue', () => {
    it('should find overdue schedules', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockSchedule], error: null });

      const result = await dao.findOverdue();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockQuery.lt).toHaveBeenCalledWith('next_due_date', expect.any(String));
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockSchedule]);
    });
  });

  describe('create', () => {
    it('should create schedule with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockSchedule, error: null });

      const result = await dao.create({
        template_id: 'template-1',
        asset_id: 'asset-1',
        location_id: 'location-1',
        title: 'Monthly HVAC Inspection',
        frequency: 'monthly',
        start_date: '2024-01-01',
        next_due_date: '2024-02-01',
        assigned_to: 'user-1',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Monthly HVAC Inspection',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockSchedule);
    });
  });

  describe('update', () => {
    it('should update schedule', async () => {
      const updatedSchedule = { ...mockSchedule, is_active: false };
      mockQuery.single.mockResolvedValueOnce({ data: updatedSchedule, error: null });

      const result = await dao.update('schedule-1', { is_active: false });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          updated_at: expect.any(String),
        })
      );
      expect(result.is_active).toBe(false);
    });
  });

  describe('softDelete', () => {
    it('should soft delete schedule', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('schedule-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'schedule-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
