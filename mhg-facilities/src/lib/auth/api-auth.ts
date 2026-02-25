import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UserService } from "@/services/user.service";
import type { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  tenant_id: string;
  is_active: boolean;
}

/**
 * Require authentication for API routes
 * Returns user or error response
 */
export async function requireAuth(): Promise<{
  user: AuthUser | null;
  error: NextResponse | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 },
        ),
      };
    }

    // Get user from database
    const userService = new UserService();
    const user = await userService.getCurrentUser();

    if (!user) {
      return {
        user: null,
        error: NextResponse.json({ error: "User not found" }, { status: 404 }),
      };
    }

    if (!user.is_active) {
      return {
        user: null,
        error: NextResponse.json(
          { error: "Account is deactivated" },
          { status: 403 },
        ),
      };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id,
        is_active: user.is_active,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in requireAuth:", error);
    return {
      user: null,
      error: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      ),
    };
  }
}

/**
 * Require specific role(s) for API routes
 * Returns user or error response
 */
export async function requireRole(roles: UserRole[]): Promise<{
  user: AuthUser | null;
  error: NextResponse | null;
}> {
  const { user, error } = await requireAuth();

  if (error) {
    return { user: null, error };
  }

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  if (!roles.includes(user.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      ),
    };
  }

  return { user, error: null };
}

/**
 * Check if user has admin or higher role
 */
export async function requireAdmin() {
  return requireRole(["admin", "super_admin"]);
}

/**
 * Check if user has manager or higher role
 */
export async function requireManager() {
  return requireRole(["admin", "super_admin", "manager"]);
}
