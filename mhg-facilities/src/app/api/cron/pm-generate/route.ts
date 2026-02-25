import { NextRequest, NextResponse } from "next/server";
import { PMScheduleService } from "@/services/pm-schedule.service";
import { TicketService } from "@/services/ticket.service";
// NotificationService available for future PM notification implementation
// import { NotificationService } from '@/services/notification.service';

/**
 * Cron job to auto-generate PM work orders from schedules
 * Runs daily to check for due PM tasks and create work orders
 *
 * Vercel Cron Schedule: 0 6 * * * (Daily at 6 AM UTC)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify CRON_SECRET is configured
    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET not configured" },
        { status: 500 },
      );
    }

    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pmService = new PMScheduleService();
    const ticketService = new TicketService();
    // Note: notificationService is available for future use when PM notification is implemented
    // const notificationService = new NotificationService();

    // Get all PM schedules that are due (today and overdue) - parallel fetch
    const [dueToday, overdue] = await Promise.all([
      pmService.getDueToday(),
      pmService.getOverdue(),
    ]);
    const dueSchedules = [...dueToday, ...overdue];

    const generatedTickets = [];
    const errors = [];
    const skipped = [];

    // Generate tickets for each due PM schedule
    for (const schedule of dueSchedules) {
      try {
        // Idempotency check: skip if last_generated_at is within the last 24 hours
        if (schedule.last_generated_at) {
          const lastGenerated = new Date(schedule.last_generated_at);
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          if (lastGenerated > twentyFourHoursAgo) {
            skipped.push({
              scheduleId: schedule.id,
              reason: "Already generated within 24 hours",
            });
            console.log(
              `Skipping PM schedule ${schedule.id}: already generated within 24 hours`,
            );
            continue;
          }
        }

        // PM schedules must have an assigned_to user to generate tickets
        // because submitted_by is a UUID FK on the tickets table
        if (!schedule.assigned_to) {
          skipped.push({
            scheduleId: schedule.id,
            reason: "No assigned_to user on schedule",
          });
          console.log(
            `Skipping PM schedule ${schedule.id}: no assigned_to user`,
          );
          continue;
        }

        // Create ticket from PM schedule (use assigned user as submitter)
        const ticket = await ticketService.createTicket({
          title: `PM: ${schedule.name}`,
          description:
            schedule.description ||
            `Preventive maintenance task: ${schedule.name}`,
          category_id: undefined, // PM tickets don't need a category
          location_id: schedule.location_id || "", // PM schedules should have location
          asset_id: schedule.asset_id || undefined,
          priority: "medium", // PM tasks default to medium priority
          is_emergency: false,
          submitted_by: schedule.assigned_to,
        });

        generatedTickets.push(ticket);

        // Update the schedule's next_due_date and last_generated_at to prevent duplicates
        await pmService.updateSchedule(schedule.id, {
          next_due_date: pmService.calculateNextDueDate(schedule),
          last_generated_at: new Date().toISOString(),
        });

        // Assign to the designated user
        try {
          await ticketService.assignTicket(
            ticket.id,
            schedule.assigned_to,
            schedule.assigned_to,
          );
        } catch (assignError) {
          console.error(`Failed to assign ticket ${ticket.id}:`, assignError);
        }

        console.log(
          `Generated PM ticket ${ticket.id} from schedule ${schedule.id}`,
        );
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({ scheduleId: schedule.id, error: errorMsg });
        console.error(
          `Failed to generate ticket for PM schedule ${schedule.id}:`,
          error,
        );
      }
    }

    const ticketsGenerated = generatedTickets.length;

    return NextResponse.json({
      success: true,
      ticketsGenerated,
      skipped: skipped.length > 0 ? skipped : undefined,
      errors: errors.length > 0 ? errors : undefined,
      message: `Generated ${ticketsGenerated} PM work orders from ${dueSchedules.length} due schedules (${skipped.length} skipped)`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PM generation cron job error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
