import { NextRequest, NextResponse } from "next/server";
import { BudgetService } from "@/services/budget.service";
import { requireAuth } from "@/lib/auth/api-auth";

export async function GET(request: NextRequest) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const service = new BudgetService();
    const { searchParams } = new URL(request.url);

    const fiscalYearParam = searchParams.get("fiscal_year");
    const fiscalYear = fiscalYearParam
      ? parseInt(fiscalYearParam)
      : service.getCurrentFiscalYear();

    const summary = await service.getBudgetSummaryEnriched(fiscalYear);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error fetching budget summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget summary" },
      { status: 500 },
    );
  }
}
