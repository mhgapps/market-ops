import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";
import type { Database } from "@/types/database-extensions";

type PMCompletion = Database["public"]["Tables"]["pm_completions"]["Row"];
type PMCompletionInsert =
  Database["public"]["Tables"]["pm_completions"]["Insert"];

export class PMCompletionDAO {
  async findBySchedule(scheduleId: string): Promise<PMCompletion[]> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = await supabase
      .from("pm_completions")
      .select("*")
      .eq("schedule_id", scheduleId)
      .order("scheduled_date", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async findById(id: string): Promise<PMCompletion | null> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = await supabase
      .from("pm_completions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data;
  }

  async create(data: PMCompletionInsert): Promise<PMCompletion> {
    const supabase = await getPooledSupabaseClient();

    const { data: created, error } = await supabase
      .from("pm_completions")
      .insert({
        schedule_id: data.schedule_id,
        ticket_id: data.ticket_id,
        scheduled_date: data.scheduled_date,
        completed_date: data.completed_date,
        completed_by: data.completed_by,
        checklist_results: data.checklist_results || null,
        notes: data.notes || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!created) throw new Error("Failed to create PM completion");
    return created as PMCompletion;
  }
}
