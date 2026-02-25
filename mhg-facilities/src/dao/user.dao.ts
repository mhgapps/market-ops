import { BaseDAO } from "@/dao/base.dao";
import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";
import type { User, UserRole, Json } from "@/types/database";

type UserInsert = {
  tenant_id: string;
  email: string;
  full_name: string;
  role?: UserRole;
  phone?: string | null;
  location_id?: string | null;
  language_preference?: "en" | "es";
  is_active?: boolean;
  deactivated_at?: string | null;
  notification_preferences?: Json;
  deleted_at?: string | null;
};

// Helper type for query results
interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

/**
 * User DAO - Database access for users table with tenant isolation
 */
export class UserDAO extends BaseDAO<"users"> {
  constructor() {
    super("users");
  }

  /**
   * Find user by email within current tenant
   */
  async findByEmail(email: string): Promise<User | null> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .is("deleted_at", null)
      .single()) as unknown as QueryResult<User>;

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Find user by Supabase auth user ID
   * Note: This method doesn't require tenant context as it's used for auth
   */
  async findByAuthUserId(
    authUserId: string,
    tenantId: string,
  ): Promise<User | null> {
    const supabase = await getPooledSupabaseClient();

    // First get the user's email from Supabase auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.getUserById(authUserId);

    if (authError || !authUser?.user?.email) {
      return null;
    }

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("email", authUser.user.email)
      .is("deleted_at", null)
      .single()) as unknown as QueryResult<User>;

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Find users by location within current tenant
   */
  async findByLocation(locationId: string): Promise<User[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("location_id", locationId)
      .is("deleted_at", null)
      .order("full_name", { ascending: true })) as unknown as QueryResult<
      User[]
    >;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Find admin users within current tenant
   */
  async findAdmins(): Promise<User[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .in("role", ["admin", "super_admin"])
      .is("deleted_at", null)
      .order("full_name", { ascending: true })) as unknown as QueryResult<
      User[]
    >;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Find users by role within current tenant
   */
  async findByRole(role: UserRole): Promise<User[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("role", role)
      .is("deleted_at", null)
      .order("full_name", { ascending: true })) as unknown as QueryResult<
      User[]
    >;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Find active users within current tenant
   */
  async findActive(): Promise<User[]> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = (await supabase
      .from("users")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name", { ascending: true })) as unknown as QueryResult<
      User[]
    >;

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  /**
   * Create user with explicit tenant_id (used during signup when no tenant context)
   */
  async createWithTenant(
    tenantId: string,
    userData: Omit<UserInsert, "tenant_id">,
  ): Promise<User> {
    const supabase = await getPooledSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .insert({ ...userData, tenant_id: tenantId } as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Failed to create user");

    return data as User;
  }

  /**
   * Deactivate user (soft deactivation, not deletion)
   */
  async deactivate(id: string): Promise<User> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: false,
        deactivated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("User not found");

    return data as User;
  }

  /**
   * Reactivate user
   */
  async reactivate(id: string): Promise<User> {
    const { supabase, tenantId } = await this.getClient();

    const { data, error } = await supabase
      .from("users")
      .update({
        is_active: true,
        deactivated_at: null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .select()
      .single();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("User not found");

    return data as User;
  }

  /**
   * Update user role
   */
  async updateRole(id: string, role: UserRole): Promise<User> {
    return this.update(id, { role });
  }
}
