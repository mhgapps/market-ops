import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database-extensions";

type OnCallSchedule = Database["public"]["Tables"]["on_call_schedules"]["Row"];
type _OnCallScheduleInsert =
  Database["public"]["Tables"]["on_call_schedules"]["Insert"];
type _OnCallScheduleUpdate =
  Database["public"]["Tables"]["on_call_schedules"]["Update"];

export class OnCallScheduleDAO extends BaseDAO<"on_call_schedules"> {
  constructor() {
    super("on_call_schedules");
  }

  /**
   * Find schedules by date range
   */
  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<OnCallSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
      .order("start_date", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to find schedules by date range: ${error.message}`,
      );
    }

    return data || [];
  }

  /**
   * Find current on-call person for location
   */
  async findCurrentOnCall(locationId?: string): Promise<OnCallSchedule | null> {
    const { supabase, tenantId } = await this.getClient();
    const today = new Date().toISOString().split("T")[0];

    let query = supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .lte("start_date", today)
      .gte("end_date", today);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query
      .eq("is_primary", true)
      .order("start_date", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to find current on-call: ${error.message}`);
    }

    return data;
  }

  /**
   * Find schedules by user
   */
  async findByUserId(userId: string): Promise<OnCallSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to find schedules by user: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find schedules by location
   */
  async findByLocation(locationId: string): Promise<OnCallSchedule[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("location_id", locationId)
      .is("deleted_at", null)
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error(`Failed to find schedules by location: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check for overlapping schedules
   */
  async hasOverlap(
    userId: string,
    startDate: string,
    endDate: string,
    excludeId?: string,
  ): Promise<boolean> {
    const { supabase, tenantId } = await this.getClient();

    let query = supabase
      .from(this.tableName)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data, error } = await query.limit(1);

    if (error) {
      throw new Error(`Failed to check for overlap: ${error.message}`);
    }

    return (data || []).length > 0;
  }
}
