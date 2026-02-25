import { NextResponse } from "next/server";
import { TicketService } from "@/services/ticket.service";
import { requireAuth } from "@/lib/auth/api-auth";

/**
 * GET /api/tickets/emergencies/active
 * Get all active emergency tickets
 */
export async function GET() {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const service = new TicketService();
    const tickets = await service.getActiveEmergencies();

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error("Error fetching active emergencies:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch active emergencies",
      },
      { status: 500 },
    );
  }
}
