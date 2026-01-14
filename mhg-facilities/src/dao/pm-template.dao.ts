import { BaseDAO } from './base.dao';
import type { Database } from '@/types/database-extensions';

type PMTemplate = Database['public']['Tables']['pm_templates']['Row'];
type _PMTemplateInsert = Database['public']['Tables']['pm_templates']['Insert'];

interface PMTemplateWithCount extends PMTemplate {
  schedule_count: number;
}

export class PMTemplateDAO extends BaseDAO<'pm_templates'> {
  constructor() {
    super('pm_templates');
  }

  async findByCategory(category: string): Promise<PMTemplate[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_templates')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('category', category)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findWithScheduleCount(): Promise<PMTemplateWithCount[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from('pm_templates')
      .select(`
        *,
        pm_schedules!pm_schedules_template_id_fkey(id)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((item: any) => ({
      ...(item as PMTemplate),
      schedule_count: item.pm_schedules?.length || 0,
      pm_schedules: undefined
    })) as PMTemplateWithCount[];
  }
}
