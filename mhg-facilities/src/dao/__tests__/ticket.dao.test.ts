import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TicketDAO } from '../ticket.dao';
import type { Database, TicketStatus, TicketPriority } from '@/types/database';

type Ticket = Database['public']['Tables']['tickets']['Row'];

describe('TicketDAO', () => {
  let dao: TicketDAO;
  let mockSupabase: any;
  let mockQuery: any;

  const mockTicket: Ticket = {
    id: 'ticket-1',
    tenant_id: 'test-tenant-id',
    ticket_number: 'T-001',
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'open' as TicketStatus,
    priority: 'medium' as TicketPriority,
    category_id: 'category-1',
    location_id: 'location-1',
    asset_id: null,
    submitted_by: 'user-1',
    assigned_to: null,
    assigned_to_vendor: null,
    due_date: null,
    completed_at: null,
    actual_cost: null,
    estimated_cost: null,
    cost_approval_status: null,
    cost_approved_by: null,
    cost_approved_at: null,
    resolution_notes: null,
    metadata: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new TicketDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
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

  describe('findByStatus', () => {
    it('should find tickets by single status', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockTicket], error: null });

      const result = await dao.findByStatus('open' as TicketStatus);

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open']);
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockTicket]);
    });

    it('should find tickets by multiple statuses', async () => {
      const tickets = [mockTicket, { ...mockTicket, id: 'ticket-2', status: 'in_progress' }];
      mockQuery.order.mockResolvedValueOnce({ data: tickets, error: null });

      const result = await dao.findByStatus(['open', 'in_progress'] as TicketStatus[]);

      expect(mockQuery.in).toHaveBeenCalledWith('status', ['open', 'in_progress']);
      expect(result).toHaveLength(2);
    });
  });

  describe('findByLocation', () => {
    it('should find tickets for a specific location', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockTicket], error: null });

      const result = await dao.findByLocation('location-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('location_id', 'location-1');
      expect(mockQuery.is).toHaveBeenCalledWith('deleted_at', null);
      expect(result).toEqual([mockTicket]);
    });
  });

  describe('findByAssignee', () => {
    it('should find tickets assigned to a user', async () => {
      const assignedTicket = { ...mockTicket, assigned_to: 'user-1' };
      mockQuery.order.mockResolvedValueOnce({ data: [assignedTicket], error: null });

      const result = await dao.findByAssignee('user-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('assigned_to', 'user-1');
      expect(result).toEqual([assignedTicket]);
    });

    it('should order by priority then created_at', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      await dao.findByAssignee('user-1');

      expect(mockQuery.order).toHaveBeenCalledWith('priority', { ascending: false });
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });
  });

  describe('findBySubmitter', () => {
    it('should find tickets submitted by a user', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [mockTicket], error: null });

      const result = await dao.findBySubmitter('user-1');

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.eq).toHaveBeenCalledWith('submitted_by', 'user-1');
      expect(result).toEqual([mockTicket]);
    });
  });

  describe('findWithRelations', () => {
    it('should return ticket with all related data', async () => {
      const ticketWithRelations = {
        ...mockTicket,
        category: { id: 'cat-1', name: 'Maintenance', name_es: 'Mantenimiento' },
        location: { id: 'loc-1', name: 'Building A', address: '123 Main St' },
        submitted_by_user: { id: 'user-1', full_name: 'John Doe', email: 'john@test.com' },
      };
      mockQuery.single.mockResolvedValueOnce({ data: ticketWithRelations, error: null });

      // Mock comment and attachment counts
      const mockCountQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        is: vi.fn().mockResolvedValueOnce({ count: 3, error: null }),
      };
      mockSupabase.from
        .mockReturnValueOnce(mockQuery) // initial ticket query
        .mockReturnValueOnce(mockCountQuery) // comments count
        .mockReturnValueOnce(mockCountQuery); // attachments count

      const result = await dao.findWithRelations('ticket-1');

      expect(mockQuery.select).toHaveBeenCalledWith(expect.stringContaining('category:'));
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ticket-1');
      expect(result).toBeTruthy();
      expect(result?.comments_count).toBe(3);
      expect(result?.attachments_count).toBe(3);
    });

    it('should return null if ticket not found', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      const result = await dao.findWithRelations('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findRecent', () => {
    it('should return recent tickets with default limit', async () => {
      const recentTickets = Array(10)
        .fill(null)
        .map((_, i) => ({ ...mockTicket, id: `ticket-${i}` }));
      mockQuery.limit.mockResolvedValueOnce({ data: recentTickets, error: null });

      const result = await dao.findRecent();

      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toHaveLength(10);
    });

    it('should accept custom limit', async () => {
      mockQuery.limit.mockResolvedValueOnce({ data: [], error: null });

      await dao.findRecent(5);

      expect(mockQuery.limit).toHaveBeenCalledWith(5);
    });
  });

  describe('findOverdue', () => {
    it('should find overdue tickets', async () => {
      const overdueTicket = {
        ...mockTicket,
        due_date: '2024-01-01T00:00:00Z',
        status: 'open' as TicketStatus,
      };
      mockQuery.order.mockResolvedValueOnce({ data: [overdueTicket], error: null });

      const result = await dao.findOverdue();

      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
      expect(mockQuery.not).toHaveBeenCalledWith('status', 'in', '(closed,rejected)');
      expect(mockQuery.not).toHaveBeenCalledWith('due_date', 'is', null);
      expect(mockQuery.lt).toHaveBeenCalledWith('due_date', expect.any(String));
      expect(mockQuery.order).toHaveBeenCalledWith('due_date', { ascending: true });
      expect(result).toEqual([overdueTicket]);
    });

    it('should not include closed or rejected tickets', async () => {
      mockQuery.order.mockResolvedValueOnce({ data: [], error: null });

      await dao.findOverdue();

      expect(mockQuery.not).toHaveBeenCalledWith('status', 'in', '(closed,rejected)');
    });
  });

  describe('findByPriority', () => {
    it('should find tickets by priority', async () => {
      const highPriorityTickets = [
        { ...mockTicket, priority: 'high' as TicketPriority },
        { ...mockTicket, id: 'ticket-2', priority: 'high' as TicketPriority },
      ];
      mockQuery.order.mockResolvedValueOnce({ data: highPriorityTickets, error: null });

      const result = await dao.findByPriority('high' as TicketPriority);

      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'high');
      expect(result).toEqual(highPriorityTickets);
    });
  });

  describe('create', () => {
    it('should create ticket with tenant_id', async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockTicket, error: null });

      const result = await dao.create({
        ticket_number: 'T-001',
        title: 'Test Ticket',
        description: 'Test Description',
        status: 'open',
        priority: 'medium',
        location_id: 'location-1',
        submitted_by: 'user-1',
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          ticket_number: 'T-001',
          tenant_id: 'test-tenant-id',
        })
      );
      expect(result).toEqual(mockTicket);
    });
  });

  describe('update', () => {
    it('should update ticket with updated_at timestamp', async () => {
      const updatedTicket = { ...mockTicket, status: 'in_progress' as TicketStatus };
      mockQuery.single.mockResolvedValueOnce({ data: updatedTicket, error: null });

      const result = await dao.update('ticket-1', { status: 'in_progress' });

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'in_progress',
          updated_at: expect.any(String),
        })
      );
      expect(result.status).toBe('in_progress');
    });
  });

  describe('softDelete', () => {
    it('should soft delete ticket', async () => {
      mockQuery.update.mockResolvedValueOnce({ data: null, error: null });

      await dao.softDelete('ticket-1');

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ticket-1');
      expect(mockQuery.eq).toHaveBeenCalledWith('tenant_id', 'test-tenant-id');
    });
  });
});
