import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { LocationDAO } from '../location.dao';
import type { Database } from '@/types/database';

type Location = Database['public']['Tables']['locations']['Row'];

interface MockQueryBuilder {
  select: Mock;
  insert: Mock;
  update: Mock;
  eq: Mock;
  is: Mock;
  order: Mock;
  single: Mock;
}

interface MockSupabaseClient {
  from: Mock;
}

describe('LocationDAO', () => {
  let dao: LocationDAO;
  let mockSupabase: MockSupabaseClient;
  let mockQuery: MockQueryBuilder;

  const mockLocation: Location = {
    id: 'location-1',
    tenant_id: 'test-tenant-id',
    name: 'Building A',
    brand: null,
    address: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    phone: null,
    square_footage: null,
    manager_id: 'manager-1',
    emergency_contact_phone: null,
    status: 'active',
    opened_date: null,
    closed_date: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new LocationDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
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

  describe('findAll', () => {
    it('should return all locations for tenant', async () => {
      const mockLocations = [mockLocation, { ...mockLocation, id: 'location-2' }];
      mockQuery.order.mockResolvedValueOnce({ data: mockLocations, error: null });

      const result = await dao.findAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('locations');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual(mockLocations);
    });
  });

  describe('findActive', () => {
    it('should return only active locations', async () => {
      const activeLocations = [mockLocation];
      mockQuery.order.mockResolvedValueOnce({ data: activeLocations, error: null });

      const result = await dao.findActive();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(activeLocations);
    });

    it('should return empty array if no active locations', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: null, error: null });

      const result = await dao.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findByManager', () => {
    it('should return locations managed by specific user', async () => {
      const managerLocations = [mockLocation];
      mockQuery.order.mockResolvedValueOnce({ data: managerLocations, error: null });

      const result = await dao.findByManager('manager-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('manager_id', 'manager-1');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toEqual(managerLocations);
    });

    it('should return empty array if manager has no locations', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      const result = await dao.findByManager('manager-with-no-locations');

      expect(result).toEqual([]);
    });
  });

  describe('findWithStats', () => {
    it('should return locations with ticket and asset counts', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockLocation], error: null });

      // Mock ticket count
      const mockTicketQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValueOnce({ count: 5, error: null }),
      };

      // Mock asset count
      const mockAssetQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValueOnce({ count: 10, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // locations query
        .mockReturnValueOnce(mockTicketQuery) // tickets count
        .mockReturnValueOnce(mockAssetQuery); // assets count

      const result = await dao.findWithStats();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockLocation,
        ticket_count: 5,
        asset_count: 10,
      });
    });

    it('should handle zero tickets and assets', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockLocation], error: null });

      const mockTicketQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValueOnce({ count: 0, error: null }),
      };

      const mockAssetQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValueOnce({ count: 0, error: null }),
      };

      mockSupabase.from
        .mockReturnValueOnce(mockQuery)
        .mockReturnValueOnce(mockTicketQuery)
        .mockReturnValueOnce(mockAssetQuery);

      const result = await dao.findWithStats();

      expect(result[0].ticket_count).toBe(0);
      expect(result[0].asset_count).toBe(0);
    });
  });

  describe('findByIdWithManager', () => {
    it('should return location with manager details', async () => {
      const locationWithManager = {
        ...mockLocation,
        manager: {
          id: 'manager-1',
          full_name: 'Manager Name',
          email: 'manager@example.com',
        },
      };
      mockQuery.single.mockResolvedValueOnce({ data: locationWithManager, error: null });

      const result = await dao.findByIdWithManager('location-1');

      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('manager:users'));
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'location-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(result).toEqual(locationWithManager);
    });

    it('should return null if location not found', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await dao.findByIdWithManager('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('assignManager', () => {
    it('should assign manager to location', async () => {
      const updatedLocation = { ...mockLocation, manager_id: 'new-manager' };
      mockQuery.single.mockResolvedValueOnce({ data: updatedLocation, error: null });

      const result = await dao.assignManager('location-1', 'new-manager');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          manager_id: 'new-manager',
          updated_at: expect.any(String),
        })
      );
      expect(result.manager_id).toBe('new-manager');
    });

    it('should unassign manager by setting to null', async () => {
      const updatedLocation = { ...mockLocation, manager_id: null };
      mockQuery.single.mockResolvedValueOnce({ data: updatedLocation, error: null });

      const result = await dao.assignManager('location-1', null);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          manager_id: null,
        })
      );
      expect(result.manager_id).toBeNull();
    });
  });

  describe('createLocation', () => {
    it('should create location with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockLocation, error: null });

      const result = await dao.createLocation({
        name: 'Building A',
        address: '123 Main St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        status: 'active',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Building A',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockLocation);
    });
  });

  describe('updateLocation', () => {
    it('should update location fields', async () => {
      const updatedLocation = { ...mockLocation, name: 'Building B' };
      mockQuery.single.mockResolvedValueOnce({ data: updatedLocation, error: null });

      const result = await dao.updateLocation('location-1', { name: 'Building B' });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Building B',
          updated_at: expect.any(String),
        })
      );
      expect(result.name).toBe('Building B');
    });
  });

  describe('softDelete', () => {
    it('should soft delete location', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('location-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'location-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
