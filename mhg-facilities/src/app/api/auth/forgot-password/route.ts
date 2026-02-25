import { NextResponse } from "next/server";
import { z } from "zod";
import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";
import { ResendIAO } from "@/iao/resend";
import { generatePasswordResetEmail } from "@/lib/email/templates/password-reset";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/forgot-password
 * Generate a password reset link via Supabase Admin API and send
 * a branded email via Resend (bypasses Supabase's default email).
 *
 * Always returns success to prevent email enumeration.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { email } = validation.data;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const supabase = await getPooledSupabaseClient();

    // Generate a recovery link without sending Supabase's default email
    const { data: linkData, error: linkError } =
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: {
          redirectTo: `${appUrl}/reset-password`,
        },
      });

    if (linkError || !linkData?.properties?.action_link) {
      // Don't reveal whether the email exists — log and return success
      console.error(
        "Failed to generate password reset link:",
        linkError?.message,
      );
      return NextResponse.json({ success: true });
    }

    // Send branded email via Resend
    const { subject, html } = generatePasswordResetEmail({
      recipientEmail: email,
      resetLink: linkData.properties.action_link,
    });

    const resend = new ResendIAO();
    await resend.sendEmail({ to: email, subject, html });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in POST /api/auth/forgot-password:", error);
    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true });
  }
}
