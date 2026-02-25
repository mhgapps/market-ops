import { NextResponse } from "next/server";
import { ReportService } from "@/services/report.service";
import { requireAuth } from "@/lib/auth/api-auth";

export async function GET() {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const service = new ReportService();
    const report = await service.getComplianceStatusReport();

    return NextResponse.json(report);
  } catch (error) {
    console.error("Compliance report error:", error);
    return NextResponse.json(
      { error: "Failed to generate compliance report" },
      { status: 500 },
    );
  }
}
