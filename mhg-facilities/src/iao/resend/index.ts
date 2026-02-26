/**
 * Resend IAO (Integration Access Object)
 * Wraps Resend email API for sending notifications
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export class ResendIAO {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || "";
    this.fromEmail =
      process.env.RESEND_FROM_EMAIL || "MOPS <mops@msmhg.com>";

    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured - emails will not be sent");
    }
  }

  /**
   * Send an email via Resend
   */
  async sendEmail({
    to,
    subject,
    html,
    from,
    replyTo,
  }: SendEmailParams): Promise<SendEmailResponse | null> {
    if (!this.apiKey) {
      console.warn("Resend API key not configured, skipping email send");
      return null;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          from: from || this.fromEmail,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          reply_to: replyTo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Resend API error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      throw error;
    }
  }

  /**
   * Send ticket assignment notification
   */
  async sendTicketAssignmentEmail(params: {
    to: string;
    assigneeName: string;
    ticketTitle: string;
    ticketId: string;
    ticketUrl: string;
    assignedBy: string;
  }): Promise<SendEmailResponse | null> {
    const { to, assigneeName, ticketTitle, ticketId, ticketUrl, assignedBy } =
      params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #111827; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Ticket Assigned</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              Hi ${assigneeName},
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              ${assignedBy} has assigned you a new ticket:
            </p>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; border-left: 4px solid #111827; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">
                ${ticketTitle}
              </h2>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Ticket ID: #${ticketId.slice(0, 8)}
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${ticketUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View Ticket
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
              MarketOps<br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `New Ticket Assigned: ${ticketTitle}`,
      html,
    });
  }

  /**
   * Send ticket status change notification
   */
  async sendTicketStatusChangeEmail(params: {
    to: string;
    recipientName: string;
    ticketTitle: string;
    ticketId: string;
    oldStatus: string;
    newStatus: string;
    ticketUrl: string;
    changedBy: string;
  }): Promise<SendEmailResponse | null> {
    const {
      to,
      recipientName,
      ticketTitle,
      ticketId,
      oldStatus,
      newStatus,
      ticketUrl,
      changedBy,
    } = params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #111827; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Ticket Status Updated</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              Hi ${recipientName},
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              ${changedBy} has updated the status of a ticket:
            </p>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; border-left: 4px solid #111827; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">
                ${ticketTitle}
              </h2>
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                Ticket ID: #${ticketId.slice(0, 8)}
              </p>
              <div style="display: flex; align-items: center; gap: 10px; margin-top: 15px;">
                <span style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">
                  ${oldStatus}
                </span>
                <span style="color: #6b7280;">→</span>
                <span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">
                  ${newStatus}
                </span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${ticketUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View Ticket
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
              MarketOps<br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Ticket Status Updated: ${ticketTitle}`,
      html,
    });
  }

  /**
   * Send PM schedule due reminder
   */
  async sendPMDueReminderEmail(params: {
    to: string;
    recipientName: string;
    taskName: string;
    dueDate: string;
    scheduleId: string;
    scheduleUrl: string;
  }): Promise<SendEmailResponse | null> {
    const { to, recipientName, taskName, dueDate, scheduleId, scheduleUrl } =
      params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #111827; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PM Task Due Soon</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              Hi ${recipientName},
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              This is a reminder that you have a preventive maintenance task due soon:
            </p>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">
                ${taskName}
              </h2>
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                Schedule ID: #${scheduleId.slice(0, 8)}
              </p>
              <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 14px;">
                Due Date: ${dueDate}
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${scheduleUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View PM Schedule
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
              MarketOps<br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `PM Task Due Soon: ${taskName}`,
      html,
    });
  }

  /**
   * Send new ticket created notification to managers/admins
   */
  async sendNewTicketEmail(params: {
    to: string;
    recipientName: string;
    ticketNumber: string;
    ticketTitle: string;
    ticketDescription: string | null;
    priority: string;
    locationName: string;
    submittedBy: string;
    ticketUrl: string;
    isEmergency: boolean;
  }): Promise<SendEmailResponse | null> {
    const {
      to,
      recipientName,
      ticketNumber,
      ticketTitle,
      ticketDescription,
      priority,
      locationName,
      submittedBy,
      ticketUrl,
      isEmergency,
    } = params;

    const priorityColors: Record<string, string> = {
      critical: "#dc2626",
      high: "#f97316",
      medium: "#3b82f6",
      low: "#6b7280",
    };
    const priorityColor = priorityColors[priority] || "#6b7280";

    const headerBackground = isEmergency
      ? "#dc2626"
      : "#111827";

    const headerText = isEmergency
      ? "EMERGENCY Ticket Submitted"
      : "New Ticket Submitted";

    const truncatedDescription =
      ticketDescription && ticketDescription.length > 200
        ? ticketDescription.slice(0, 200) + "..."
        : ticketDescription;

    const descriptionBlock = truncatedDescription
      ? `<p style="margin: 10px 0 0 0; color: #374151; font-size: 14px;">${truncatedDescription}</p>`
      : "";

    const subject = isEmergency
      ? `EMERGENCY: #${ticketNumber} - ${ticketTitle}`
      : `New Ticket: #${ticketNumber} - ${ticketTitle}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${headerBackground}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${headerText}</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              Hi ${recipientName},
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              A new ${isEmergency ? "emergency " : ""}ticket has been submitted:
            </p>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; border-left: 4px solid ${isEmergency ? "#dc2626" : "#111827"}; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: ${isEmergency ? "#dc2626" : "#111827"};">
                #${ticketNumber} - ${ticketTitle}
              </h2>
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                <strong>Priority:</strong> <span style="color: ${priorityColor}; font-weight: 600;">${priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
              </p>
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                <strong>Location:</strong> ${locationName}
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                <strong>Submitted by:</strong> ${submittedBy}
              </p>
              ${descriptionBlock}
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${ticketUrl}" style="display: inline-block; background: ${isEmergency ? "#dc2626" : "#111827"}; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View Ticket
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
              MarketOps<br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Send compliance document expiring reminder
   */
  async sendComplianceExpiringEmail(params: {
    to: string;
    recipientName: string;
    documentName: string;
    expirationDate: string;
    documentId: string;
    documentUrl: string;
    daysUntilExpiration: number;
  }): Promise<SendEmailResponse | null> {
    const {
      to,
      recipientName,
      documentName,
      expirationDate,
      documentId,
      documentUrl,
      daysUntilExpiration,
    } = params;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #111827; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Compliance Document Expiring</h1>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              Hi ${recipientName},
            </p>

            <p style="font-size: 16px; color: #4b5563; margin-bottom: 20px;">
              A compliance document is expiring in <strong>${daysUntilExpiration} days</strong>:
            </p>

            <div style="background: #ffffff; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb; border-left: 4px solid #dc2626; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #111827;">
                ${documentName}
              </h2>
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">
                Document ID: #${documentId.slice(0, 8)}
              </p>
              <p style="margin: 0; font-weight: 600; color: #dc2626; font-size: 14px;">
                Expiration Date: ${expirationDate}
              </p>
            </div>

            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; color: #991b1b;">
                Please renew this document before it expires to maintain compliance.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${documentUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                View Document
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 0;">
              MarketOps<br>
              This is an automated notification. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: `Compliance Document Expiring Soon: ${documentName}`,
      html,
    });
  }
}
