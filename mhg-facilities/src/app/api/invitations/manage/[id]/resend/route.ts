import { NextRequest, NextResponse } from "next/server";
import { InvitationService } from "@/services/invitation.service";
import { requireAdmin } from "@/lib/auth/api-auth";
import { z } from "zod";
import { uuidRegex } from "@/lib/validations/shared";

const idParamSchema = z
  .string()
  .regex(uuidRegex, "Invalid invitation ID format");

/**
 * POST /api/invitations/manage/[id]/resend
 * Resend an invitation email
 * Requires admin role
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;

    const { id } = await params;

    const validation = idParamSchema.safeParse(id);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid invitation ID format" },
        { status: 400 },
      );
    }

    const invitationService = new InvitationService();
    await invitationService.resendInvitation(validation.data);

    return NextResponse.json({ message: "Invitation resent successfully" });
  } catch (error) {
    console.error("Error in POST /api/invitations/manage/[id]/resend:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("not found") ||
        error.message.includes("already accepted")
      ) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("expired")) {
        return NextResponse.json({ error: error.message }, { status: 410 });
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resend invitation",
      },
      { status: 500 },
    );
  }
}
