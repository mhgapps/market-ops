import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";

export async function GET() {
  try {
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    // Placeholder - budget reports would require budget DAO implementation
    return NextResponse.json({
      budgets: [],
      message: "Budget reports coming soon",
    });
  } catch (error) {
    console.error("Budget report error:", error);
    return NextResponse.json(
      { error: "Failed to generate budget report" },
      { status: 500 },
    );
  }
}
