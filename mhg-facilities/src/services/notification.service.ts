import { ResendIAO } from '@/iao/resend'
import { UserDAO } from '@/dao/user.dao'
import type { Database } from '@/types/database-extensions'

type Ticket = Database['public']['Tables']['tickets']['Row']
type PMSchedule = Database['public']['Tables']['pm_schedules']['Row']
type ComplianceDocument = Database['public']['Tables']['compliance_documents']['Row']
type User = Database['public']['Tables']['users']['Row']

export class NotificationService {
  constructor(
    private resendIAO = new ResendIAO(),
    private userDAO = new UserDAO()
  ) {}

  /**
   * Send notification when a ticket is assigned
   */
  async notifyTicketAssignment(params: {
    ticket: Ticket
    assignedBy: User
    assignee: User
  }): Promise<void> {
    const { ticket, assignedBy, assignee } = params

    if (!assignee.email) {
      console.warn(`Cannot send ticket assignment email: assignee ${assignee.id} has no email`)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const ticketUrl = `${baseUrl}/tickets/${ticket.id}`

    await this.resendIAO.sendTicketAssignmentEmail({
      to: assignee.email,
      assigneeName: assignee.full_name,
      ticketTitle: ticket.title,
      ticketId: ticket.id,
      ticketUrl,
      assignedBy: assignedBy.full_name,
    })

    console.log(`Sent ticket assignment email to ${assignee.email} for ticket ${ticket.id}`)
  }

  /**
   * Send notification when a ticket status changes
   */
  async notifyTicketStatusChange(params: {
    ticket: Ticket
    oldStatus: string
    newStatus: string
    changedBy: User
    notifyUsers: User[]
  }): Promise<void> {
    const { ticket, oldStatus, newStatus, changedBy, notifyUsers } = params

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const ticketUrl = `${baseUrl}/tickets/${ticket.id}`

    const emailPromises = notifyUsers
      .filter((user) => user.email)
      .map((user) =>
        this.resendIAO.sendTicketStatusChangeEmail({
          to: user.email!,
          recipientName: user.full_name,
          ticketTitle: ticket.title,
          ticketId: ticket.id,
          oldStatus,
          newStatus,
          ticketUrl,
          changedBy: changedBy.full_name,
        })
      )

    await Promise.allSettled(emailPromises)

    console.log(
      `Sent ticket status change emails to ${notifyUsers.length} users for ticket ${ticket.id}`
    )
  }

  /**
   * Send notification when a PM schedule is due
   */
  async notifyPMDue(params: {
    schedule: PMSchedule
    assignee: User
    dueDate: string
  }): Promise<void> {
    const { schedule, assignee, dueDate } = params

    if (!assignee.email) {
      console.warn(`Cannot send PM due email: assignee ${assignee.id} has no email`)
      return
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const scheduleUrl = `${baseUrl}/pm/${schedule.id}`

    await this.resendIAO.sendPMDueReminderEmail({
      to: assignee.email,
      recipientName: assignee.full_name,
      taskName: schedule.name,
      dueDate,
      scheduleId: schedule.id,
      scheduleUrl,
    })

    console.log(`Sent PM due email to ${assignee.email} for schedule ${schedule.id}`)
  }

  /**
   * Send notification when a compliance document is expiring
   */
  async notifyComplianceExpiring(params: {
    document: ComplianceDocument
    recipients: User[]
    daysUntilExpiration: number
  }): Promise<void> {
    const { document, recipients, daysUntilExpiration } = params

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const documentUrl = `${baseUrl}/compliance/${document.id}`

    const expirationDate = document.expiration_date
      ? new Date(document.expiration_date).toLocaleDateString()
      : 'Unknown'

    const emailPromises = recipients
      .filter((user) => user.email)
      .map((user) =>
        this.resendIAO.sendComplianceExpiringEmail({
          to: user.email!,
          recipientName: user.full_name,
          documentName: document.name,
          expirationDate,
          documentId: document.id,
          documentUrl,
          daysUntilExpiration,
        })
      )

    await Promise.allSettled(emailPromises)

    console.log(
      `Sent compliance expiring emails to ${recipients.length} users for document ${document.id}`
    )
  }

  /**
   * Get all admin users for a tenant (for critical notifications)
   */
  async getAdminUsers(): Promise<User[]> {
    return await this.userDAO.findByRole('admin')
  }

  /**
   * Get all managers for a tenant
   */
  async getManagers(): Promise<User[]> {
    return await this.userDAO.findByRole('manager')
  }
}
