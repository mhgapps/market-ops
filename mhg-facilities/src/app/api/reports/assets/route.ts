import { NextRequest, NextResponse } from "next/server";
import { ReportService } from "@/services/report.service";
import type { AssetReportFilters } from "@/services/report.service";
import { requireAuth } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;

    const filters: AssetReportFilters = {};

    // Status filter
    const statusParam = searchParams.get("status");
    if (statusParam) {
      filters.status = statusParam.split(",");
    }

    // Category filter
    const categoryId = searchParams.get("category_id");
    if (categoryId) {
      filters.categoryId = categoryId;
    }

    // Location filter
    const locationId = searchParams.get("location_id");
    if (locationId) {
      filters.locationId = locationId;
    }

    const service = new ReportService();
    const report = await service.getAssetReport(filters);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Asset report error:", error);
    return NextResponse.json(
      { error: "Failed to generate asset report" },
      { status: 500 },
    );
  }
}
