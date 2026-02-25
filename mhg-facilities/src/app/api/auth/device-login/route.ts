import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DeviceAuthService } from "@/services/device-auth.service";
import { createClient } from "@/lib/supabase/server";

const deviceLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/device-login
 * Sign in via trusted device (no password required).
 * Public endpoint (no auth required).
 *
 * Uses admin magic link flow on the server to create a session
 * when the device_token cookie is valid for the given email.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = deviceLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    // Read device_token from cookies
    const deviceToken = request.cookies.get("device_token")?.value;

    if (!deviceToken) {
      return NextResponse.json(
        { error: "Device not trusted" },
        { status: 401 },
      );
    }

    const deviceAuthService = new DeviceAuthService();
    const result = await deviceAuthService.signInWithTrustedDevice(
      email,
      deviceToken,
    );

    if (!result) {
      return NextResponse.json(
        { error: "Device not trusted" },
        { status: 401 },
      );
    }

    // Set the session on the cookie-based Supabase client so auth
    // cookies are written to the browser. Without this, the admin-
    // generated session only exists in memory and the client has no
    // auth after navigation.
    const supabase = await createClient();
    await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in POST /api/auth/device-login:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
