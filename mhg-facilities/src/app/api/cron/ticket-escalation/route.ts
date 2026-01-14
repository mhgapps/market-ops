import { NextRequest, NextResponse } from 'next/server';
import { TicketService } from '@/services/ticket.service';
import { NotificationService } from '@/services/notification.service';
import { UserDAO } from '@/dao/user.dao';

/**
 * Cron job to escalate overdue tickets
 * Runs every 6 hours to check for tickets that need escalation
 *
 * Escalation rules:
 * - Critical tickets: >2 hours without response
 * - High priority: >4 hours without response
 * - Medium priority: >8 hours without response
 * - Low priority: >24 hours without response
 *
 * Vercel Cron Schedule: 0 star-slash-6 * * * (Every 6 hours)
 * Replace "star-slash-6" with asterisk-forward-slash-6 in your vercel.json
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketService = new TicketService();
    const notificationService = new NotificationService();
    const userDAO = new UserDAO();

    // Get all tickets that haven't been closed
    const activeTickets = await ticketService.getAllTickets({
      status: ['submitted', 'acknowledged', 'approved', 'in_progress', 'needs_approval', 'on_hold'],
    });

    const escalated = [];
    const errors = [];

    const now = new Date();

    for (const ticket of activeTickets) {
      try {
        const createdAt = new Date(ticket.created_at);
        const hoursSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

        // Determine if ticket should be escalated based on priority
        let shouldEscalate = false;
        let escalationReason = '';

        if (ticket.priority === 'critical' && hoursSinceCreated > 2) {
          shouldEscalate = true;
          escalationReason = `Critical ticket without response for ${Math.floor(hoursSinceCreated)} hours`;
        } else if (ticket.priority === 'high' && hoursSinceCreated > 4) {
          shouldEscalate = true;
          escalationReason = `High priority ticket without response for ${Math.floor(hoursSinceCreated)} hours`;
        } else if (ticket.priority === 'medium' && hoursSinceCreated > 8) {
          shouldEscalate = true;
          escalationReason = `Medium priority ticket without response for ${Math.floor(hoursSinceCreated)} hours`;
        } else if (ticket.priority === 'low' && hoursSinceCreated > 24) {
          shouldEscalate = true;
          escalationReason = `Low priority ticket without response for ${Math.floor(hoursSinceCreated)} hours`;
        }

        if (shouldEscalate) {
          // Get managers and admins to notify
          const managers = await notificationService.getManagers();
          const admins = await notificationService.getAdminUsers();
          const notifyUsers = [...new Set([...managers, ...admins])]; // Dedupe

          if (notifyUsers.length > 0) {
            // Get the user who submitted the ticket (or system)
            const submittedBy = ticket.submitted_by
              ? await userDAO.findById(ticket.submitted_by)
              : null;

            // Send escalation notifications
            await notificationService.notifyTicketStatusChange({
              ticket,
              oldStatus: ticket.status,
              newStatus: ticket.status, // Status doesn't change, just escalating
              changedBy: submittedBy || { id: 'system', full_name: 'System', email: null } as any,
              notifyUsers,
            });

            escalated.push({
              ticketId: ticket.id,
              reason: escalationReason,
              notifiedCount: notifyUsers.length,
            });

            console.log(`Escalated ticket ${ticket.id}: ${escalationReason}`);
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ ticketId: ticket.id, error: errorMsg });
        console.error(`Failed to escalate ticket ${ticket.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      escalatedCount: escalated.length,
      escalated: escalated.slice(0, 10), // Return first 10 for visibility
      errors: errors.length > 0 ? errors : undefined,
      message: `Escalated ${escalated.length} tickets from ${activeTickets.length} active tickets`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ticket escalation cron job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
