import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComplianceDocumentDAO } from '../compliance-document.dao';
import type { Database } from '@/types/database';

type ComplianceDocument = Database['public']['Tables']['compliance_documents']['Row'];
type ComplianceStatus = Database['public']['Enums']['compliance_status'];

describe('ComplianceDocumentDAO', () => {
  let dao: ComplianceDocumentDAO;
  let mockSupabase: any;
  let mockQuery: any;

  const mockDocument: ComplianceDocument = {
    id: 'doc-1',
    tenant_id: 'test-tenant-id',
    name: 'Test Certificate',
    document_type_id: 'type-1',
    location_id: 'location-1',
    location_ids: null,
    issue_date: '2024-01-01',
    expiration_date: '2025-01-01',
    issuing_authority: 'Test Authority',
    document_number: 'DOC-123',
    file_path: '/path/to/file.pdf',
    status: 'active' as ComplianceStatus,
    is_conditional: false,
    conditional_requirements: null,
    conditional_deadline: null,
    renewal_submitted_date: null,
    renewal_cost: null,
    renewal_assigned_to: null,
    failed_inspection_date: null,
    corrective_action_required: null,
    reinspection_date: null,
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new ComplianceDocumentDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
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

  describe('findByLocation', () => {
    it('should find documents for a location', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockDocument], error: null });

      const result = await dao.findByLocation('location-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('location_id.eq.'));
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(mockQuery.order).toHaveBeenCalledWith('expiration_date', { ascending: true });
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findByType', () => {
    it('should find documents by type', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockDocument], error: null });

      const result = await dao.findByType('type-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('document_type_id', 'type-1');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findByStatus', () => {
    it('should find documents by status', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockDocument], error: null });

      const result = await dao.findByStatus('active' as ComplianceStatus);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('findExpiringSoon', () => {
    it('should find documents expiring within specified days', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockDocument], error: null });

      const result = await dao.findExpiringSoon(30);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.lte).toHaveBeenCalledWith('expiration_date', expect.any(String));
      expect(mockQuery.gte).toHaveBeenCalledWith('expiration_date', expect.any(String));
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('create', () => {
    it('should create document with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockDocument, error: null });

      const result = await dao.create({
        name: 'Test Certificate',
        document_type_id: 'type-1',
        file_path: '/path/to/file.pdf',
        expiration_date: '2025-01-01',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          document_type_id: 'type-1',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockDocument);
    });
  });

  describe('update', () => {
    it('should update document', async () => {
      const updatedDocument = { ...mockDocument, status: 'expired' as ComplianceStatus };
      mockQuery.single.mockResolvedValueOnce({ data: updatedDocument, error: null });

      const result = await dao.update('doc-1', { status: 'expired' });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'expired',
          updated_at: expect.any(String),
        })
      );
      expect(result.status).toBe('expired');
    });
  });

  describe('softDelete', () => {
    it('should soft delete document', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('doc-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'doc-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
