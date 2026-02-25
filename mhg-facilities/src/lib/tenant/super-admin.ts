import { createClient } from "@/lib/supabase/server";
import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";

export interface SuperAdminContext {
  isSuperAdmin: boolean;
  canAccessAllTenants: boolean;
  userId: string | null;
}

// Check if current user is a platform super admin
export async function getSuperAdminContext(): Promise<SuperAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { isSuperAdmin: false, canAccessAllTenants: false, userId: null };
  }

  // Check if user has platform_admin role in app_metadata
  // This is set during user creation and cannot be modified by the user
  const isPlatformAdmin = user.app_metadata?.platform_role === "platform_admin";

  return {
    isSuperAdmin: isPlatformAdmin,
    canAccessAllTenants: isPlatformAdmin,
    userId: user.id,
  };
}

// Require super admin access (throws if not authorized)
export async function requireSuperAdmin(): Promise<SuperAdminContext> {
  const context = await getSuperAdminContext();
  if (!context.isSuperAdmin) {
    throw new Error("Platform admin access required");
  }
  return context;
}

// Get all tenants (super admin only)
export async function getAllTenants() {
  await requireSuperAdmin();

  const supabase = await getPooledSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from("tenants") as any;
  const { data, error } = await query
    .select(
      `
      *,
      users:users(count),
      locations:locations(count)
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// Get tenant by ID (super admin only)
export async function getTenantById(tenantId: string) {
  await requireSuperAdmin();

  const supabase = await getPooledSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from("tenants") as any;
  const { data, error } = await query
    .select("*")
    .eq("id", tenantId)
    .is("deleted_at", null)
    .single();

  if (error) throw error;
  return data;
}

// Update tenant (super admin only)
export async function updateTenant(
  tenantId: string,
  updates: Record<string, unknown>,
) {
  await requireSuperAdmin();

  const supabase = await getPooledSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from("tenants") as any;
  const { data, error } = await query
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", tenantId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Soft delete tenant (super admin only)
export async function deleteTenant(tenantId: string) {
  await requireSuperAdmin();

  const supabase = await getPooledSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from("tenants") as any;
  const { error } = await query
    .update({ deleted_at: new Date().toISOString(), status: "cancelled" })
    .eq("id", tenantId);

  if (error) throw error;
}
