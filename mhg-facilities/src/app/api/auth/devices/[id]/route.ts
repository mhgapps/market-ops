import { NextRequest, NextResponse } from "next/server";
import { DeviceAuthService } from "@/services/device-auth.service";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * DELETE /api/auth/devices/[id]
 * Revoke a specific trusted device.
 * If the revoked device is the current one, clears the device_token cookie.
 * Requires authentication.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, error } = await requireAuth();
    if (error) return error;

    const { id } = await params;

    const deviceAuthService = new DeviceAuthService();

    // Hash the current cookie token to detect if we're revoking the current device
    const deviceToken = request.cookies.get("device_token")?.value;
    const currentTokenHash = deviceToken
      ? deviceAuthService.hashToken(deviceToken)
      : undefined;

    // Check if the target device is the current one before revoking
    let isCurrentDevice = false;
    if (currentTokenHash) {
      const devices = await deviceAuthService.listDevices(user!.id);
      const target = devices.find((d) => d.id === id);
      isCurrentDevice = target?.device_token_hash === currentTokenHash;
    }

    await deviceAuthService.revokeDevice(id, user!.id);

    const response = NextResponse.json({ success: true });

    // Clear the cookie if the revoked device is the current one
    if (isCurrentDevice) {
      response.cookies.set("device_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    console.error("Error in DELETE /api/auth/devices/[id]:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 },
    );
  }
}
