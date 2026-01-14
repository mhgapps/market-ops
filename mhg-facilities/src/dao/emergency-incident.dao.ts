import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database-extensions'

type EmergencyIncident = Database['public']['Tables']['emergency_incidents']['Row']
type EmergencyIncidentInsert = Database['public']['Tables']['emergency_incidents']['Insert']
type EmergencyIncidentUpdate = Database['public']['Tables']['emergency_incidents']['Update']

export class EmergencyIncidentDAO extends BaseDAO<'emergency_incidents'> {
  constructor() {
    super('emergency_incidents')
  }

  /**
   * Find active incidents
   */
  async findActive(): Promise<EmergencyIncident[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .order('severity', { ascending: false })
      .order('reported_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find active incidents: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find incidents by status
   */
  async findByStatus(status: string): Promise<EmergencyIncident[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', status)
      .is('deleted_at', null)
      .order('reported_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find incidents by status: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find incidents by location
   */
  async findByLocation(locationId: string): Promise<EmergencyIncident[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .is('deleted_at', null)
      .order('reported_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find incidents by location: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find incidents by severity
   */
  async findBySeverity(severity: string): Promise<EmergencyIncident[]> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('severity', severity)
      .is('deleted_at', null)
      .order('reported_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find incidents by severity: ${error.message}`)
    }

    return data || []
  }

  /**
   * Find recent incidents (last 30 days)
   */
  async findRecent(days: number = 30): Promise<EmergencyIncident[]> {
    const { supabase, tenantId } = await this.getClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('reported_at', cutoffDate.toISOString())
      .order('reported_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find recent incidents: ${error.message}`)
    }

    return data || []
  }

  /**
   * Mark incident as contained
   */
  async markContained(id: string): Promise<EmergencyIncident> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        status: 'contained',
        contained_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark incident as contained: ${error.message}`)
    }

    return data
  }

  /**
   * Mark incident as resolved
   */
  async markResolved(id: string, resolutionNotes: string): Promise<EmergencyIncident> {
    const { supabase, tenantId } = await this.getClient()

    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolutionNotes,
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to mark incident as resolved: ${error.message}`)
    }

    return data
  }
}
