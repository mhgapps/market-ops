import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/services/user.service";
import { requireAdmin } from "@/lib/auth/api-auth";

/**
 * POST /api/users/[id]/deactivate
 * Deactivate a user account
 * Requires admin role
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user: currentUser, error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    // Prevent users from deactivating themselves
    if (currentUser?.id === id) {
      return NextResponse.json(
        { error: "You cannot deactivate your own account" },
        { status: 403 },
      );
    }

    const userService = new UserService();
    const deactivatedUser = await userService.deactivateUser(id);

    // Transform user for response
    const transformedUser = {
      id: deactivatedUser.id,
      email: deactivatedUser.email,
      fullName: deactivatedUser.full_name,
      role: deactivatedUser.role,
      isActive: deactivatedUser.is_active,
    };

    return NextResponse.json({ user: transformedUser });
  } catch (error) {
    console.error("Error in POST /api/users/[id]/deactivate:", error);

    if (error instanceof Error) {
      if (error.message === "User not found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to deactivate user",
      },
      { status: 500 },
    );
  }
}
