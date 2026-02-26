import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";
import { getTenantContext } from "@/lib/tenant/context";
import type { AssetVendorRow, AssetVendorInsert } from "@/types/database-extensions";

type AssetVendorWithVendor = AssetVendorRow & {
  vendor: { id: string; name: string };
};

export class AssetVendorDAO {
  private async getClient() {
    const supabase = await getPooledSupabaseClient();
    const tenant = await getTenantContext();
    if (!tenant) {
      throw new Error("Tenant context required for database operations");
    }
    return { supabase, tenantId: tenant.id };
  }

  async findByAssetId(assetId: string): Promise<AssetVendorWithVendor[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_vendors")
      .select("*, vendor:vendors(id, name)")
      .eq("asset_id", assetId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return (data as unknown as AssetVendorWithVendor[]) ?? [];
  }

  async findByVendorId(vendorId: string): Promise<AssetVendorRow[]> {
    const { supabase } = await this.getClient();

    const { data, error } = await supabase
      .from("asset_vendors")
      .select("*")
      .eq("vendor_id", vendorId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
    return (data as unknown as AssetVendorRow[]) ?? [];
  }

  async create(record: AssetVendorInsert): Promise<AssetVendorRow> {
    const { supabase } = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("asset_vendors") as any;
    const { data, error } = await query.insert(record).select().single();

    if (error) throw new Error(error.message);
    return data as AssetVendorRow;
  }

  async bulkCreate(records: AssetVendorInsert[]): Promise<AssetVendorRow[]> {
    if (records.length === 0) return [];

    const { supabase } = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("asset_vendors") as any;
    const { data, error } = await query.insert(records).select();

    if (error) throw new Error(error.message);
    return (data as AssetVendorRow[]) ?? [];
  }

  async softDelete(id: string): Promise<void> {
    const { supabase } = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("asset_vendors") as any;
    const { error } = await query
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
  }

  async softDeleteAllForAsset(assetId: string): Promise<void> {
    const { supabase } = await this.getClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = supabase.from("asset_vendors") as any;
    const { error } = await query
      .update({ deleted_at: new Date().toISOString() })
      .eq("asset_id", assetId)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
  }
}
