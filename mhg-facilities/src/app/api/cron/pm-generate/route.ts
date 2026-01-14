import { NextRequest, NextResponse } from 'next/server';
import { PMScheduleService } from '@/services/pm-schedule.service';
import { TicketService } from '@/services/ticket.service';
import { NotificationService } from '@/services/notification.service';

/**
 * Cron job to auto-generate PM work orders from schedules
 * Runs daily to check for due PM tasks and create work orders
 *
 * Vercel Cron Schedule: 0 6 * * * (Daily at 6 AM UTC)
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

    const pmService = new PMScheduleService();
    const ticketService = new TicketService();
    const notificationService = new NotificationService();

    // Get all PM schedules that are due (today and overdue)
    const dueToday = await pmService.getDueToday();
    const overdue = await pmService.getOverdue();
    const dueSchedules = [...dueToday, ...overdue];

    const generatedTickets = [];
    const errors = [];

    // Generate tickets for each due PM schedule
    for (const schedule of dueSchedules) {
      try {
        // Create ticket from PM schedule
        const ticket = await ticketService.createTicket({
          title: `PM: ${schedule.name}`,
          description: schedule.description || `Preventive maintenance task: ${schedule.name}`,
          category_id: undefined, // PM tickets don't need a category
          location_id: schedule.location_id || '', // PM schedules should have location
          asset_id: schedule.asset_id || undefined,
          priority: 'medium', // PM tasks default to medium priority
          is_emergency: false,
          submitted_by: 'system', // System-generated ticket
        });

        generatedTickets.push(ticket);

        // Assign to the designated user if specified
        if (schedule.assigned_to) {
          try {
            await ticketService.assignTicket(ticket.id, schedule.assigned_to, 'system');
          } catch (assignError) {
            console.error(`Failed to assign ticket ${ticket.id}:`, assignError);
          }
        }

        // Note: The schedule's last_completed field will be automatically updated
        // when a PM completion record is created (not implemented here)

        console.log(`Generated PM ticket ${ticket.id} from schedule ${schedule.id}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ scheduleId: schedule.id, error: errorMsg });
        console.error(`Failed to generate ticket for PM schedule ${schedule.id}:`, error);
      }
    }

    const ticketsGenerated = generatedTickets.length;

    return NextResponse.json({
      success: true,
      ticketsGenerated,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${ticketsGenerated} PM work orders from ${dueSchedules.length} due schedules`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('PM generation cron job error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

