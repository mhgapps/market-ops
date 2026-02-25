"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Database } from "@/types/database";

// Type-safe insert types
type TenantInsert = Database["public"]["Tables"]["tenants"]["Insert"];
type UserInsert = Database["public"]["Tables"]["users"]["Insert"];

interface AuthResponse {
  error?: string;
  success?: boolean;
}

/**
 * Generate a URL-friendly slug from a company name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map Supabase errors to user-friendly messages
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Invalid email or password" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "Please verify your email before signing in" };
    }
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signup creates a new tenant and admin user
 */
export async function signup(
  tenantName: string,
  email: string,
  password: string,
  fullName: string,
): Promise<AuthResponse> {
  const supabase = await createClient();

  // Generate a unique slug for the tenant
  const baseSlug = generateSlug(tenantName);
  let slug = baseSlug;
  let slugSuffix = 0;

  // Check if slug is available and generate unique one if needed
  while (true) {
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!existingTenant) break;

    slugSuffix++;
    slug = `${baseSlug}-${slugSuffix}`;
  }

  // Create tenant data with proper typing
  const tenantData: TenantInsert = {
    name: tenantName,
    slug,
    owner_email: email,
    plan: "free",
    status: "trial",
    trial_ends_at: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    max_users: 5,
    max_locations: 3,
    storage_limit_gb: 5,
    features: {
      compliance_tracking: true,
      preventive_maintenance: true,
      vendor_portal: false,
      budget_tracking: false,
      emergency_module: false,
      api_access: false,
      sso: false,
      custom_domain: false,
    },
    branding: {
      primary_color: "#3B82F6",
      secondary_color: "#1E40AF",
      logo_url: null,
      favicon_url: null,
    },
  };

  // Create the tenant first
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert(tenantData as never)
    .select()
    .single();

  if (tenantError) {
    console.error("Tenant creation error:", tenantError);
    return { error: "Failed to create organization. Please try again." };
  }

  const tenantId = (tenant as { id: string }).id;

  // Create the auth user with tenant_id in metadata
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        tenant_id: tenantId,
        full_name: fullName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email`,
    },
  });

  if (authError) {
    // Rollback: delete the tenant if auth signup fails
    await supabase.from("tenants").delete().eq("id", tenantId);

    if (authError.message.includes("User already registered")) {
      return { error: "An account with this email already exists" };
    }
    return { error: authError.message };
  }

  if (!authData.user) {
    // Rollback: delete the tenant if no user created
    await supabase.from("tenants").delete().eq("id", tenantId);
    return { error: "Failed to create user. Please try again." };
  }

  // Create user data with proper typing
  const userData: UserInsert = {
    tenant_id: tenantId,
    email,
    full_name: fullName,
    role: "admin",
    is_active: true,
    language_preference: "en",
    notification_preferences: {
      email: true,
      sms: false,
      push: false,
    },
  };

  // Create the user record in our users table
  const { error: userError } = await supabase
    .from("users")
    .insert(userData as never);

  if (userError) {
    console.error("User record creation error:", userError);
    // Don't rollback here - auth user was created successfully
    // The user record can be created later on first login
  }

  return { success: true };
}

/**
 * Request password reset email
 */
export async function forgotPassword(email: string): Promise<AuthResponse> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    // Don't reveal if email exists or not for security
    console.error("Password reset error:", error);
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

/**
 * Reset password with token
 */
export async function resetPassword(
  code: string,
  newPassword: string,
): Promise<AuthResponse> {
  const supabase = await createClient();

  // First, exchange the code for a session
  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("Code exchange error:", exchangeError);
    return {
      error: "Invalid or expired reset link. Please request a new one.",
    };
  }

  // Now update the password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    console.error("Password update error:", updateError);
    return { error: "Failed to update password. Please try again." };
  }

  // Sign out after password reset
  await supabase.auth.signOut();

  return { success: true };
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<AuthResponse> {
  const supabase = await createClient();

  // The token is actually a code that needs to be exchanged
  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: "email",
  });

  if (error) {
    console.error("Email verification error:", error);
    return { error: "Invalid or expired verification link." };
  }

  return { success: true };
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
