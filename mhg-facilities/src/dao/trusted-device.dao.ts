import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";

export interface TrustedDevice {
  id: string;
  tenant_id: string;
  user_id: string;
  auth_user_id: string;
  device_token_hash: string;
  device_name: string | null;
  ip_address: string | null;
  trusted_at: string;
  expires_at: string;
  last_used_at: string;
  revoked_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// Helper type for query results
interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * Trusted Device DAO - Database access for trusted_devices table
 *
 * Does NOT extend BaseDAO because trusted device lookups happen without
 * tenant context (during login flow before authentication is established).
 * Uses getPooledSupabaseClient() directly with explicit tenant/user filtering.
 *
 * CRITICAL: Soft deletes only (deleted_at column). Never hard delete.
 */
export class TrustedDeviceDAO {
  /**
   * Find an active trusted device by its token hash.
   * Filters out revoked, deleted, and expired records.
   */
  async findByTokenHash(tokenHash: string): Promise<TrustedDevice | null> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = (await supabase
      .from("trusted_devices")
      .select("*")
      .eq("device_token_hash", tokenHash)
      .is("revoked_at", null)
      .is("deleted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single()) as unknown as QueryResult<TrustedDevice>;

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(
        `Failed to find trusted device by token hash: ${error.message}`,
      );
    }

    return data;
  }

  /**
   * Find all active (non-revoked, non-deleted) devices for a user.
   * Used for the device management UI.
   */
  async findByUserId(userId: string): Promise<TrustedDevice[]> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = (await supabase
      .from("trusted_devices")
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .is("deleted_at", null)
      .order("last_used_at", { ascending: false })) as unknown as QueryResult<
      TrustedDevice[]
    >;

    if (error) {
      throw new Error(
        `Failed to find trusted devices for user: ${error.message}`,
      );
    }

    return data ?? [];
  }

  /**
   * Create a new trusted device record.
   * The expires_at defaults to 180 days from now (set by database default).
   */
  async create(data: {
    tenant_id: string;
    user_id: string;
    auth_user_id: string;
    device_token_hash: string;
    device_name: string | null;
    ip_address: string | null;
  }): Promise<TrustedDevice> {
    const supabase = await getPooledSupabaseClient();

    const { data: device, error } = await supabase
      .from("trusted_devices")
      .insert(data as never)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create trusted device: ${error.message}`);
    }
    if (!device) {
      throw new Error("Failed to create trusted device: no data returned");
    }

    return device as unknown as TrustedDevice;
  }

  /**
   * Update the last_used_at timestamp when a device is used for authentication.
   */
  async updateLastUsed(id: string): Promise<void> {
    const supabase = await getPooledSupabaseClient();

    const { error } = await supabase
      .from("trusted_devices")
      .update({ last_used_at: new Date().toISOString() } as never)
      .eq("id", id)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `Failed to update trusted device last_used_at: ${error.message}`,
      );
    }
  }

  /**
   * Soft-revoke a specific device for a user.
   * Sets revoked_at to prevent future use without deleting the record.
   * Scoped by userId to prevent cross-user revocation.
   */
  async revoke(id: string, userId: string): Promise<void> {
    const supabase = await getPooledSupabaseClient();

    const { error } = await supabase
      .from("trusted_devices")
      .update({ revoked_at: new Date().toISOString() } as never)
      .eq("id", id)
      .eq("user_id", userId)
      .is("revoked_at", null)
      .is("deleted_at", null);

    if (error) {
      throw new Error(`Failed to revoke trusted device: ${error.message}`);
    }
  }

  /**
   * Revoke all active devices for a user.
   * Used when a user changes their password or requests a full logout.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    const supabase = await getPooledSupabaseClient();

    const { error } = await supabase
      .from("trusted_devices")
      .update({ revoked_at: new Date().toISOString() } as never)
      .eq("user_id", userId)
      .is("revoked_at", null)
      .is("deleted_at", null);

    if (error) {
      throw new Error(
        `Failed to revoke all trusted devices for user: ${error.message}`,
      );
    }
  }
}
