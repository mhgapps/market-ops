import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { BaseDAO } from '../base.dao';

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

// Concrete implementation for testing
class TestDAO extends BaseDAO<'users'> {
  constructor() {
    super('users');
  }
}

describe('BaseDAO', () => {
  let dao: TestDAO;
  let mockSupabase: MockSupabaseClient;
  let mockQuery: MockQueryBuilder;

  beforeEach(() => {
    dao = new TestDAO();

    // Setup mock query builder chain
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

    // Mock getPooledSupabaseClient
    vi.doMock('@/lib/supabase/server-pooled', () => ({
      getPooledSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
    }));

    // Mock getTenantContext
    vi.doMock('@/lib/tenant/context', () => ({
      getTenantContext: vi.fn(() =>
        Promise.resolve({ id: 'test-tenant-id', name: 'Test Tenant' })
      ),
    }));
  });

  describe('Tenant Isolation', () => {
    it('should include tenant_id in findAll queries', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      await dao.findAll();

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });

    it('should include tenant_id in findById queries', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      await dao.findById('test-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });

    it('should include tenant_id in update queries', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'test-id', tenant_id: 'test-tenant-id' },
        error: null,
      });

      await dao.update('test-id', { email: 'updated@test.com' } as Parameters<typeof dao.update>[1]);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });

    it('should include tenant_id in softDelete queries', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('test-id');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });

  describe('Soft Delete', () => {
    it('should filter out soft-deleted records in findAll', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      await dao.findAll();

      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('should filter out soft-deleted records in findById', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      await dao.findById('test-id');

      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
    });

    it('should set deleted_at when soft deleting', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('test-id');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
    });

    it('should not allow updates to soft-deleted records', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      await dao.update('test-id', { email: 'test@test.com' } as Parameters<typeof dao.update>[1]);

      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
    });
  });

  describe('CRUD Operations', () => {
    it('should create record with tenant_id', async () => {
      const mockUser = {
        id: 'new-id',
        tenant_id: 'test-tenant-id',
        email: 'test@test.com',
      };
      mockQuery.single.mockResolvedValueOnce({ data: mockUser, error: null });

      const result = await dao.create({ email: 'test@test.com' } as Parameters<typeof dao.create>[0]);

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should update record with updated_at timestamp', async () => {
      const mockUser = {
        id: 'test-id',
        tenant_id: 'test-tenant-id',
        email: 'updated@test.com',
      };
      mockQuery.single.mockResolvedValueOnce({ data: mockUser, error: null });

      await dao.update('test-id', { email: 'updated@test.com' } as Parameters<typeof dao.update>[1]);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'updated@test.com',
          updated_at: expect.any(String),
        })
      );
    });

    it('should return null for non-existent record in findById', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await dao.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection error', code: 'CONN_ERROR' },
      });

      await expect(dao.findById('test-id')).rejects.toThrow('Database connection error');
    });

    it('should check if record exists', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: { id: 'test-id' },
        error: null,
      });

      const exists = await dao.exists('test-id');

      expect(exists).toBe(true);
    });

    it('should return false when record does not exist', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      const exists = await dao.exists('non-existent-id');

      expect(exists).toBe(false);
    });

    it('should count records for current tenant', async () => {
      const mockResult = { data: null, error: null, count: 5 };
      mockQuery.is.mockResolvedValueOnce(mockResult);

      const count = await dao.count();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(count).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when tenant context is missing', async () => {
      vi.doMock('@/lib/tenant/context', () => ({
        getTenantContext: vi.fn(() => Promise.resolve(null)),
      }));

      const newDao = new TestDAO();
      await expect(newDao.findAll()).rejects.toThrow(
        'Tenant context required for database operations'
      );
    });

    it('should throw error on create failure', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      await expect(dao.create({ email: 'test@test.com' } as Parameters<typeof dao.create>[0])).rejects.toThrow(
        'Insert failed'
      );
    });

    it('should throw error on update failure', async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Update failed' },
      });

      await expect(dao.update('test-id', { email: 'test@test.com' } as Parameters<typeof dao.update>[1])).rejects.toThrow(
        'Update failed'
      );
    });
  });
});
