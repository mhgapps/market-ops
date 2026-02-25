import { BaseDAO } from "./base.dao";
import type { Database } from "@/types/database-extensions";

type AssetHistory = Database["public"]["Tables"]["asset_history"]["Row"];
type AssetHistoryInsert =
  Database["public"]["Tables"]["asset_history"]["Insert"];

/**
 * Asset History DAO
 * Note: This is an audit-only table with no soft deletes
 */
export class AssetHistoryDAO extends BaseDAO<"asset_history"> {
  constructor() {
    super("asset_history");
  }

  /**
   * Find all history for an asset
   */
  async findByAssetId(assetId: string): Promise<AssetHistory[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("asset_id", assetId)
      .order("performed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to find asset history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find history by ticket
   */
  async findByTicketId(ticketId: string): Promise<AssetHistory[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("ticket_id", ticketId)
      .order("performed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to find history by ticket: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find history by vendor
   */
  async findByVendorId(vendorId: string): Promise<AssetHistory[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("vendor_id", vendorId)
      .order("performed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to find history by vendor: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find history by maintenance type
   */
  async findByMaintenanceType(
    assetId: string,
    maintenanceType:
      | "repair"
      | "preventive"
      | "inspection"
      | "replacement"
      | "warranty_claim",
  ): Promise<AssetHistory[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("asset_id", assetId)
      .eq("maintenance_type", maintenanceType)
      .order("performed_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to find history by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get total maintenance cost for an asset
   */
  async getTotalCost(assetId: string): Promise<number> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from(this.tableName)
      .select("cost")
      .eq("asset_id", assetId);

    if (error) {
      throw new Error(`Failed to get total cost: ${error.message}`);
    }

    const history = (data || []) as AssetHistory[];
    return history.reduce((sum, record) => sum + (Number(record.cost) || 0), 0);
  }

  /**
   * Create history record (no tenant isolation - uses asset_id)
   */
  async createHistory(data: AssetHistoryInsert): Promise<AssetHistory> {
    const { supabase } = await this.getClient();

    const { data: newHistory, error } = await supabase
      .from(this.tableName)
      .insert(data as never)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create asset history: ${error.message}`);
    }

    return newHistory;
  }
}
