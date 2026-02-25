import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/auth/session
 * Returns the current session status
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return NextResponse.json(
        {
          authenticated: false,
          error: error.message,
        },
        { status: 401 },
      );
    }

    if (!session) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    // Calculate session expiry
    const expiresAt = session.expires_at
      ? new Date(session.expires_at * 1000).toISOString()
      : null;

    return NextResponse.json({
      authenticated: true,
      expiresAt,
      tenantId: session.user?.user_metadata?.tenant_id ?? null,
    });
  } catch (error) {
    console.error("Error in /api/auth/session:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
