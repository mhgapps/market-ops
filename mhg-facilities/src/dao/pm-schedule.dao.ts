import { BaseDAO } from './base.dao';
import type { Database } from '@/types/database';

type PMSchedule = Database['public']['Tables']['pm_schedules']['Row'];
type _PMScheduleInsert = Database['public']['Tables']['pm_schedules']['Insert'];
type PMFrequency = Database['public']['Enums']['pm_frequency'];

interface PMScheduleWithCompletions extends PMSchedule {
  completions?: Array<{
    id: string;
    scheduled_date: string;
    completed_date: string | null;
    completed_by: string | null;
  }>;
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
      .lte('next_due_date', today)
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
