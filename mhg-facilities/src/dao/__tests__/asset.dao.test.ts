import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssetDAO, type AssetFilters } from '../asset.dao';
import type { Database } from '@/types/database';

type Asset = Database['public']['Tables']['assets']['Row'];

describe('AssetDAO', () => {
  let dao: AssetDAO;
  let mockSupabase: any;
  let mockQuery: any;

  const mockAsset: Asset = {
    id: 'asset-1',
    tenant_id: 'test-tenant-id',
    name: 'Test Asset',
    qr_code: 'AST-001',
    serial_number: 'SN123',
    model: 'Model X',
    manufacturer: 'Test Manufacturer',
    category_id: 'category-1',
    location_id: 'location-1',
    vendor_id: null,
    status: 'active',
    purchase_date: '2024-01-01',
    purchase_price: 1000,
    warranty_expiration: '2025-01-01',
    expected_lifespan_years: 5,
    notes: null,
    manual_url: null,
    spec_sheet_path: null,
    photo_path: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new AssetDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
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

  describe('findWithRelations', () => {
    it('should return assets with relations', async () => {
      const assetWithRelations = {
        ...mockAsset,
        category: { id: 'cat-1', name: 'Equipment', default_lifespan_years: 10 },
        location: { id: 'loc-1', name: 'Building A', address: '123 Main St' },
        vendor: { id: 'vendor-1', vendor_name: 'Test Vendor' },
      };
      mockQuery.order.mockResolvedValueOnce({ data: [assetWithRelations], error: null });

      const result = await dao.findWithRelations();

      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('category:'));
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual([assetWithRelations]);
    });

    it('should apply category filter', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: AssetFilters = { category_id: 'category-1' };

      await dao.findWithRelations(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('category_id', 'category-1');
    });

    it('should apply location filter', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: AssetFilters = { location_id: 'location-1' };

      await dao.findWithRelations(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('location_id', 'location-1');
    });

    it('should apply status filter', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: AssetFilters = { status: 'active' };

      await dao.findWithRelations(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
    });

    it('should apply warranty expiration filter', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: AssetFilters = { warranty_expiring_days: 30 };

      await dao.findWithRelations(filters);

      expect(mockQuery.lte).toHaveBeenCalledWith('warranty_expiration', expect.any(String));
      expect(mockQuery.gte).toHaveBeenCalledWith('warranty_expiration', expect.any(String));
    });

    it('should apply search filter', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });
      const filters: AssetFilters = { search: 'test' };

      await dao.findWithRelations(filters);

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('name.ilike.%test%')
      );
    });
  });

  describe('findByIdWithRelations', () => {
    it('should return asset with relations', async () => {
      const assetWithRelations = {
        ...mockAsset,
        category: { id: 'cat-1', name: 'Equipment', default_lifespan_years: 10 },
      };
      mockQuery.single.mockResolvedValueOnce({ data: assetWithRelations, error: null });

      const result = await dao.findByIdWithRelations('asset-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'asset-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(result).toEqual(assetWithRelations);
    });

    it('should return null if asset not found', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await dao.findByIdWithRelations('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create asset with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockAsset, error: null });

      const result = await dao.create({
        name: 'Test Asset',
        qr_code: 'AST-001',
        category_id: 'category-1',
        location_id: 'location-1',
        status: 'active',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Asset',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockAsset);
    });
  });

  describe('update', () => {
    it('should update asset', async () => {
      const updatedAsset = { ...mockAsset, status: 'under_maintenance' };
      mockQuery.single.mockResolvedValueOnce({ data: updatedAsset, error: null });

      const result = await dao.update('asset-1', { status: 'under_maintenance' });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'under_maintenance',
          updated_at: expect.any(String),
        })
      );
      expect(result.status).toBe('under_maintenance');
    });
  });

  describe('softDelete', () => {
    it('should soft delete asset', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('asset-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'asset-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
