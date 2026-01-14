import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VendorDAO, type VendorFilters } from '../vendor.dao';
import type { Database } from '@/types/database';

type Vendor = Database['public']['Tables']['vendors']['Row'];

describe('VendorDAO', () => {
  let dao: VendorDAO;
  let mockSupabase: any;
  let mockQuery: any;

  const mockVendor: Vendor = {
    id: 'vendor-1',
    tenant_id: 'test-tenant-id',
    name: 'Test Vendor',
    contact_name: 'John Doe',
    email: 'contact@vendor.com',
    phone: '555-0100',
    emergency_phone: null,
    address: '456 Vendor St',
    service_categories: ['plumbing', 'hvac'],
    is_preferred: false,
    contract_start_date: null,
    contract_expiration: null,
    insurance_expiration: null,
    insurance_minimum_required: null,
    hourly_rate: null,
    notes: null,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new VendorDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
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

  describe('findWithFilters', () => {
    it('should return all vendors without filters', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockVendor], error: null });

      const result = await dao.findWithFilters();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual([mockVendor]);
    });

    it('should filter by is_active', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockVendor], error: null });
      const filters: VendorFilters = { is_active: true };

      await dao.findWithFilters(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
    });

    it('should filter by is_preferred', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: VendorFilters = { is_preferred: true };

      await dao.findWithFilters(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('is_preferred', true);
    });

    it('should filter by service_category', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockVendor], error: null });
      const filters: VendorFilters = { service_category: 'plumbing' };

      await dao.findWithFilters(filters);

      expect(mockQuery.contains).toHaveBeenCalledWith('service_categories', ['plumbing']);
    });

    it('should filter by insurance_expiring_days', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: VendorFilters = { insurance_expiring_days: 30 };

      await dao.findWithFilters(filters);

      expect(mockQuery.lte).toHaveBeenCalledWith('insurance_expiration', expect.any(String));
      expect(mockQuery.gte).toHaveBeenCalledWith('insurance_expiration', expect.any(String));
    });

    it('should filter by contract_expiring_days', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: VendorFilters = { contract_expiring_days: 60 };

      await dao.findWithFilters(filters);

      expect(mockQuery.lte).toHaveBeenCalledWith('contract_expiration', expect.any(String));
      expect(mockQuery.gte).toHaveBeenCalledWith('contract_expiration', expect.any(String));
    });
  });

  describe('findActive', () => {
    it('should return only active vendors', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockVendor], error: null });

      const result = await dao.findActive();

      expect(mockQuery.eq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual([mockVendor]);
    });
  });

  describe('create', () => {
    it('should create vendor with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockVendor, error: null });

      const result = await dao.create({
        name: 'Test Vendor',
        email: 'contact@vendor.com',
        service_categories: ['plumbing'],
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Vendor',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockVendor);
    });
  });

  describe('update', () => {
    it('should update vendor', async () => {
      const updatedVendor = { ...mockVendor, is_preferred: true };
      mockQuery.single.mockResolvedValueOnce({ data: updatedVendor, error: null });

      const result = await dao.update('vendor-1', { is_preferred: true });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_preferred: true,
          updated_at: expect.any(String),
        })
      );
      expect(result.is_preferred).toBe(true);
    });
  });

  describe('softDelete', () => {
    it('should soft delete vendor', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('vendor-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'vendor-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
