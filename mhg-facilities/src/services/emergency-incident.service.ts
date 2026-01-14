import { EmergencyIncidentDAO } from '@/dao/emergency-incident.dao'
import { OnCallScheduleDAO } from '@/dao/on-call-schedule.dao'
import { LocationDAO } from '@/dao/location.dao'
import { UserDAO } from '@/dao/user.dao'
import { NotificationService } from './notification.service'
import type { Database } from '@/types/database-extensions'

type EmergencyIncident = Database['public']['Tables']['emergency_incidents']['Row']
type EmergencyIncidentInsert = Database['public']['Tables']['emergency_incidents']['Insert']

export interface CreateIncidentInput {
  location_id: string
  title: string
  description?: string
  severity: 'high' | 'critical'
  reported_by: string
}

export interface IncidentStats {
  active: number
  resolved_30_days: number
  total_30_days: number
}

/**
 * Emergency Incident Service
 * Handles business logic for emergency incident management
 *
 * Status Flow:
 * active → contained → resolved
 */
export class EmergencyIncidentService {
  constructor(
    private incidentDAO = new EmergencyIncidentDAO(),
    private onCallDAO = new OnCallScheduleDAO(),
    private locationDAO = new LocationDAO(),
    private userDAO = new UserDAO(),
    private notificationService = new NotificationService()
  ) {}

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Get all incidents for the tenant
   */
  async getAllIncidents(): Promise<EmergencyIncident[]> {
    return this.incidentDAO.findAll()
  }

  /**
   * Get active incidents
   */
  async getActiveIncidents(): Promise<EmergencyIncident[]> {
    return this.incidentDAO.findActive()
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(id: string): Promise<EmergencyIncident> {
    const incident = await this.incidentDAO.findById(id)
    if (!incident) {
      throw new Error('Emergency incident not found')
    }
    return incident
  }

  /**
   * Get incidents by location
   */
  async getIncidentsByLocation(locationId: string): Promise<EmergencyIncident[]> {
    return this.incidentDAO.findByLocation(locationId)
  }

  /**
   * Get recent incidents (default 30 days)
   */
  async getRecentIncidents(days: number = 30): Promise<EmergencyIncident[]> {
    return this.incidentDAO.findRecent(days)
  }

  /**
   * Get incidents by status
   */
  async getIncidentsByStatus(status: 'active' | 'contained' | 'resolved'): Promise<EmergencyIncident[]> {
    return this.incidentDAO.findByStatus(status)
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(): Promise<IncidentStats> {
    const [activeIncidents, recentIncidents] = await Promise.all([
      this.incidentDAO.findActive(),
      this.incidentDAO.findRecent(30),
    ])

    const resolvedIn30Days = recentIncidents.filter(
      (incident) => incident.status === 'resolved'
    ).length

    return {
      active: activeIncidents.length,
      resolved_30_days: resolvedIn30Days,
      total_30_days: recentIncidents.length,
    }
  }

  // ============================================================
  // COMMANDS
  // ============================================================

  /**
   * Create a new emergency incident
   */
  async createIncident(data: CreateIncidentInput): Promise<EmergencyIncident> {
    // Validate location exists
    const location = await this.locationDAO.findById(data.location_id)
    if (!location) {
      throw new Error('Location not found')
    }

    // Validate reporter exists
    const reporter = await this.userDAO.findById(data.reported_by)
    if (!reporter) {
      throw new Error('Reporter user not found')
    }

    // Create the incident
    const incident = await this.incidentDAO.create({
      location_id: data.location_id,
      title: data.title,
      description: data.description ?? null,
      severity: data.severity,
      status: 'active',
      reported_by: data.reported_by,
      reported_at: new Date().toISOString(),
    } as EmergencyIncidentInsert)

    // For critical incidents, notify on-call staff
    if (data.severity === 'critical') {
      this.notifyOnCallStaff(incident, location.id).catch((err) =>
        console.error('Failed to notify on-call staff:', err)
      )
    }

    return incident
  }

  /**
   * Mark incident as contained
   */
  async markContained(id: string): Promise<EmergencyIncident> {
    const incident = await this.getIncidentById(id)

    if (incident.status !== 'active') {
      throw new Error('Only active incidents can be marked as contained')
    }

    return this.incidentDAO.markContained(id)
  }

  /**
   * Mark incident as resolved
   */
  async markResolved(id: string, resolutionNotes: string): Promise<EmergencyIncident> {
    const incident = await this.getIncidentById(id)

    if (incident.status === 'resolved') {
      throw new Error('Incident is already resolved')
    }

    if (!resolutionNotes || resolutionNotes.trim().length === 0) {
      throw new Error('Resolution notes are required')
    }

    return this.incidentDAO.markResolved(id, resolutionNotes)
  }

  /**
   * Update incident details
   */
  async updateIncident(
    id: string,
    data: { title?: string; description?: string; severity?: 'high' | 'critical' }
  ): Promise<EmergencyIncident> {
    await this.getIncidentById(id)
    return this.incidentDAO.update(id, data)
  }

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  /**
   * Notify on-call staff about a critical incident
   */
  async notifyOnCallStaff(incident: EmergencyIncident, locationId: string): Promise<void> {
    // Find current on-call person for this location
    const onCallSchedule = await this.onCallDAO.findCurrentOnCall(locationId)

    if (!onCallSchedule) {
      // If no location-specific on-call, find any on-call
      const anyOnCall = await this.onCallDAO.findCurrentOnCall()
      if (!anyOnCall) {
        console.warn('No on-call staff found for emergency notification')
        // Fall back to notifying all admins/managers
        const [admins, managers] = await Promise.all([
          this.notificationService.getAdminUsers(),
          this.notificationService.getManagers(),
        ])
        const recipients = [...admins, ...managers]
        if (recipients.length === 0) {
          console.error('No one to notify about critical incident!')
          return
        }
        // Log for now - notification would be sent in production
        console.log(
          `Would notify ${recipients.length} admins/managers about critical incident ${incident.id}`
        )
        return
      }
    }

    // Get the on-call user
    const scheduleToUse = onCallSchedule || (await this.onCallDAO.findCurrentOnCall())
    if (scheduleToUse) {
      const onCallUser = await this.userDAO.findById(scheduleToUse.user_id)
      if (onCallUser) {
        console.log(
          `Would send emergency notification to ${onCallUser.full_name} (${onCallUser.email}) for incident ${incident.id}`
        )
        // In production, this would send SMS/push/email
      }
    }
  }
}
