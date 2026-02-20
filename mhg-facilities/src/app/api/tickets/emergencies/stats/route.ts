import { NextResponse } from 'next/server'
import { TicketService } from '@/services/ticket.service'
import { requireAuth } from '@/lib/auth/api-auth'

/**
 * GET /api/tickets/emergencies/stats
 * Get emergency statistics for dashboard
 */
export async function GET() {
  try {
    const { error } = await requireAuth()
    if (error) return error

    const service = new TicketService()
    const stats = await service.getEmergencyStats()

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching emergency stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch emergency stats' },
      { status: 500 }
    )
  }
}
