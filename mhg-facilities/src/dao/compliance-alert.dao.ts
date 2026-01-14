import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled';
import type { Database } from '@/types/database-extensions';

type ComplianceAlert = Database['public']['Tables']['compliance_alerts']['Row'];
type ComplianceAlertInsert = Database['public']['Tables']['compliance_alerts']['Insert'];

export class ComplianceAlertDAO {
  async findByDocument(documentId: string): Promise<ComplianceAlert[]> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = await supabase
      .from('compliance_alerts')
      .select('*')
      .eq('document_id', documentId)
      .order('sent_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async create(data: ComplianceAlertInsert): Promise<ComplianceAlert> {
    const supabase = await getPooledSupabaseClient();

    const { data: created, error } = await supabase
      .from('compliance_alerts')
      .insert({
        document_id: data.document_id,
        alert_type: data.alert_type,
        sent_to: data.sent_to,
        delivery_method: data.delivery_method,
        sent_at: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!created) throw new Error('Failed to create compliance alert');
    return created as ComplianceAlert;
  }
}
