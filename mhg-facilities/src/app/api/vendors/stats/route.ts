import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { VendorService } from "@/services/vendor.service";

/**
 * GET /api/vendors/stats
 * Get aggregate vendor statistics
 */
export async function GET() {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const service = new VendorService();
    const stats = await service.getVendorStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor stats" },
      { status: 500 },
    );
  }
}
