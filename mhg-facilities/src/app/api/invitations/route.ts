import { NextRequest, NextResponse } from "next/server";
import { InvitationService } from "@/services/invitation.service";
import { requireAdmin } from "@/lib/auth/api-auth";
import { inviteUserSchema } from "@/lib/validations/user";

/**
 * GET /api/invitations
 * List pending invitations for the current tenant
 * Requires admin role
 */
export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const invitationService = new InvitationService();
    const invitations = await invitationService.getPendingInvitations();

    return NextResponse.json({
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expires_at: inv.expires_at,
        created_at: inv.created_at,
      })),
    });
  } catch (error) {
    console.error("Error in GET /api/invitations:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list invitations",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/invitations
 * Send an invitation to a new user
 * Requires admin role
 */
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();

    // Validate request body
    const validation = inviteUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const invitationService = new InvitationService();

    const invitation = await invitationService.inviteUser({
      email: validation.data.email,
      role: validation.data.role,
      location_id: validation.data.location_id,
      invited_by: user!.id,
    });

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expires_at,
          createdAt: invitation.created_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/invitations:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("already exists") ||
        error.message.includes("pending invitation")
      ) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes("User limit reached")) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to send invitation",
      },
      { status: 500 },
    );
  }
}
