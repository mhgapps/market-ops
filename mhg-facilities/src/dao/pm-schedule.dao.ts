import { BaseDAO } from './base.dao';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type _PMScheduleInsert = Database['public']['Tables']['pm_schedules']['Insert'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

export interface PMScheduleFilters {
  asset_id?: string;
  location_id?: string;
  frequency?: PMFrequency;
  is_active?: boolean;
}

interface PMScheduleWithCompletions extends PMSchedule {
  completions?: Array<{
    id: string;
    scheduled_date: string;
    completed_date: string | null;
    completed_by: string | null;
  }>;
}

// Enriched schedule with flattened relation names
export interface PMScheduleWithRelations extends PMSchedule {
  asset_name: string | null;
  location_name: string | null;
  assigned_to_name: string | null;
  vendor_name: string | null;
  last_completed_at: string | null;
}

// Raw shape returned by Supabase with joined relations
interface PMScheduleWithRelationsRaw extends PMSchedule {
  assets?: { name: string } | null;
  locations?: { name: string } | null;
  users?: { full_name: string } | null;
  vendors?: { name: string } | null;
  pm_completions?: Array<{ completed_date: string | null }>;
}

// Select query with joins for related entity names
const PM_SCHEDULE_SELECT_WITH_RELATIONS = `
  *,
  assets(name),
  locations(name),
  users:assigned_to(full_name),
  vendors(name),
  pm_completions(completed_date)
`;

/**
 * Transform raw Supabase query result with nested relations into flat enriched object
 */
function transformScheduleWithRelations(raw: PMScheduleWithRelationsRaw): PMScheduleWithRelations {
  // Get the most recent completion date
  const completions = raw.pm_completions || [];
  const sortedCompletions = completions
    .filter(c => c.completed_date !== null)
    .sort((a, b) => {
      const dateA = a.completed_date || '';
      const dateB = b.completed_date || '';
      return dateB.localeCompare(dateA);
    });
  const lastCompletedAt = sortedCompletions.length > 0 ? sortedCompletions[0].completed_date : null;

  // Remove nested objects and add flat fields
  const { assets, locations, users, vendors, pm_completions: _pm_completions, ...baseSchedule } = raw;

  return {
    ...baseSchedule,
    asset_name: assets?.name || null,
    location_name: locations?.name || null,
    assigned_to_name: users?.full_name || null,
    vendor_name: vendors?.name || null,
    last_completed_at: lastCompletedAt,
  };
}

export class PMScheduleDAO extends BaseDAO<'pm_schedules'> {
  constructor() {
    super('pm_schedules');
  }

  async findActive(): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Find PM schedules with combined filters.
   * All provided filters are applied together (AND logic).
   */
  async findWithFilters(filters: PMScheduleFilters): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    let query = supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters.asset_id !== undefined) {
      query = query.eq('asset_id', filters.asset_id);
    }

    if (filters.location_id !== undefined) {
      query = query.eq('location_id', filters.location_id);
    }

    if (filters.frequency !== undefined) {
      query = query.eq('frequency', filters.frequency);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByAsset(assetId: string): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('asset_id', assetId)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByLocation(locationId: string): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findDueToday(): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('next_due_date', today)  // Changed from lte to eq - only items due exactly today
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findOverdue(): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lt('next_due_date', today)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true});

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findByFrequency(frequency: PMFrequency): Promise<PMSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('frequency', frequency)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findWithCompletions(id: string): Promise<PMScheduleWithCompletions | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select(`
        *,
        pm_completions!pm_completions_schedule_id_fkey(
          id,
          scheduled_date,
          completed_date,
          completed_by
        )
      `)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = data;
    return {
      ...(result as PMSchedule),
      completions: result.pm_completions || []
    } as PMScheduleWithCompletions;
  }

  /**
   * Find active PM schedules with joined asset/location/user/vendor names.
   */
  async findActiveWithRelations(): Promise<PMScheduleWithRelations[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select(PM_SCHEDULE_SELECT_WITH_RELATIONS)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((item) =>
      transformScheduleWithRelations(item as unknown as PMScheduleWithRelationsRaw)
    );
  }

  /**
   * Find all PM schedules with joined relations (enriched response).
   */
  async findAllWithRelations(): Promise<PMScheduleWithRelations[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select(PM_SCHEDULE_SELECT_WITH_RELATIONS)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return (data || []).map((item) =>
      transformScheduleWithRelations(item as unknown as PMScheduleWithRelationsRaw)
    );
  }

  /**
   * Find PM schedules with combined filters and enriched relations.
   */
  async findWithFiltersAndRelations(filters: PMScheduleFilters): Promise<PMScheduleWithRelations[]> {
    const { supabase, tenantId } = await this.getClient();

    let query = supabase
      .from('pm_schedules')
      .select(PM_SCHEDULE_SELECT_WITH_RELATIONS)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters.asset_id !== undefined) {
      query = query.eq('asset_id', filters.asset_id);
    }

    if (filters.location_id !== undefined) {
      query = query.eq('location_id', filters.location_id);
    }

    if (filters.frequency !== undefined) {
      query = query.eq('frequency', filters.frequency);
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await query.order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((item) =>
      transformScheduleWithRelations(item as unknown as PMScheduleWithRelationsRaw)
    );
  }

  /**
   * Find a single PM schedule by ID with enriched relations.
   */
  async findByIdWithRelations(id: string): Promise<PMScheduleWithRelations | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_schedules')
      .select(PM_SCHEDULE_SELECT_WITH_RELATIONS)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return transformScheduleWithRelations(data as unknown as PMScheduleWithRelationsRaw);
  }

  /**
   * Find due today PM schedules with enriched relations.
   */
  async findDueTodayWithRelations(): Promise<PMScheduleWithRelations[]> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('pm_schedules')
      .select(PM_SCHEDULE_SELECT_WITH_RELATIONS)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('next_due_date', today)  // Changed from lte to eq - only items due exactly today
      .is('deleted_at', null)
      .order('next_due_date', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((item) =>
      transformScheduleWithRelations(item as unknown as PMScheduleWithRelationsRaw)
    );
  }

  // ============================================================
  // COUNT METHODS (for dashboard performance)
  // ============================================================

  /**
   * Count overdue PM schedules
   */
  async countOverdue(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
      .from('pm_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .lt('next_due_date', today)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count total PM schedules
   */
  async countTotal(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from('pm_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }

  /**
   * Count active PM schedules
   */
  async countActive(): Promise<number> {
    const { supabase, tenantId } = await this.getClient();

    const { count, error } = await supabase
      .from('pm_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return count ?? 0;
  }
}
