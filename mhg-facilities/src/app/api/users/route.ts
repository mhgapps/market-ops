import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { requireManager } from "@/lib/auth/api-auth";
import type { UserRole } from "@/types/database";

/**
 * GET /api/users
 * Get all users for the current tenant
 * Requires manager or admin role
 */
export async function GET(request: NextRequest) {
  try {
    const { error } = await requireManager();
    if (error) return error;

    const userService = new UserService();

    // Check query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim().toLowerCase();
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const locationId = searchParams.get("locationId");
    const activeOnly = searchParams.get("activeOnly") === "true";

    let users;

    const validRoles: UserRole[] = [
      "super_admin",
      "admin",
      "manager",
      "staff",
      "vendor",
      "readonly",
    ];
    if (role) {
      if (!validRoles.includes(role as UserRole)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 },
        );
      }
      users = await userService.getUsersByRole(role as UserRole);
    } else if (locationId) {
      users = await userService.getUsersByLocation(locationId);
    } else if (activeOnly) {
      users = await userService.getActiveUsers();
    } else {
      // Get all users via UserDAO
      const userDAO = new (await import("@/dao/user.dao")).UserDAO();
      users = await userDAO.findAll();
    }

    if (status && !["all", "active", "inactive"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be one of: all, active, inactive" },
        { status: 400 },
      );
    }

    if (status === "active") {
      users = users.filter((u) => u.is_active);
    } else if (status === "inactive") {
      users = users.filter((u) => !u.is_active);
    }

    if (search) {
      users = users.filter((u) => {
        const name = (u.full_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        return name.includes(search) || email.includes(search);
      });
    }

    // Transform users for response (remove sensitive data)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      fullName: u.full_name,
      role: u.role,
      phone: u.phone,
      locationId: u.location_id,
      languagePreference: u.language_preference,
      isActive: u.is_active,
      notificationPreferences: u.notification_preferences,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
    }));

    return NextResponse.json({ users: transformedUsers });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch users",
      },
      { status: 500 },
    );
  }
}
