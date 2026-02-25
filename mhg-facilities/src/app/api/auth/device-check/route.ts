import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DeviceAuthService } from "@/services/device-auth.service";
import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";

const MHG_EMAIL_DOMAIN = "markethospitalitygroup.com";

const deviceCheckSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * POST /api/auth/device-check
 * Check if the current device is trusted for the given email.
 * Public endpoint (no auth required).
 * Does NOT reveal whether the email exists.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = deviceCheckSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    // For MHG domain emails, check if user is registered
    if (email.toLowerCase().endsWith(`@${MHG_EMAIL_DOMAIN}`)) {
      const supabase = await getPooledSupabaseClient();
      const { data: mhgTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", "mhg")
        .is("deleted_at", null)
        .single();

      if (mhgTenant) {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id")
          .eq("tenant_id", (mhgTenant as { id: string }).id)
          .eq("email", email.toLowerCase())
          .is("deleted_at", null)
          .single();

        if (!existingUser) {
          return NextResponse.json({ trusted: false, registered: false });
        }
      }
    }

    // Read device_token from cookies
    const deviceToken = request.cookies.get("device_token")?.value;

    if (!deviceToken) {
      return NextResponse.json({ trusted: false });
    }

    const deviceAuthService = new DeviceAuthService();
    const device = await deviceAuthService.verifyDevice(email, deviceToken);

    return NextResponse.json({ trusted: device !== null });
  } catch (error) {
    console.error("Error in POST /api/auth/device-check:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
