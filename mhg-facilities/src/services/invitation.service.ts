import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import { sendEmail } from '@/lib/email/smtp'
import { generateInvitationEmail } from '@/lib/email/templates/invitation'
import { UserService } from '@/services/user.service'
import { TenantService } from '@/services/tenant.service'
import type { Database } from '@/types/database'
import type { UserRole } from '@/types/database'

type TenantInvitation = Database['public']['Tables']['tenant_invitations']['Row']

interface InviteUserInput {
  email: string
  role: UserRole
  location_id?: string
  invited_by: string
}

interface AcceptInvitationInput {
  token: string
  password: string
  full_name: string
}

/**
 * Invitation Service - Business logic for user invitations
 * Handles invitation creation, email sending, and acceptance
 */
export class InvitationService {
  constructor(
    private userService = new UserService(),
    private tenantService = new TenantService()
  ) {}

  /**
   * Get tenant-scoped client
   */
  private async getClient() {
    const supabase = await getPooledSupabaseClient()
    const tenant = await getTenantContext()

    if (!tenant) {
      throw new Error('Tenant context required for invitation operations')
    }

    return { supabase, tenantId: tenant.id, tenant }
  }

  /**
   * Invite a user to the tenant
   * Creates invitation record and sends email
   */
  async inviteUser(input: InviteUserInput): Promise<TenantInvitation> {
    const { email, role, invited_by } = input
    const { supabase, tenantId, tenant } = await this.getClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (existingUser) {
      throw new Error('A user with this email already exists in your organization')
    }

    // Check if there's a pending invitation
    const { data: existingInvitation } = await supabase
      .from('tenant_invitations')
      .select('id, expires_at')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .is('accepted_at', null)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvitation) {
      throw new Error('This user already has a pending invitation')
    }

    // Check tenant user limits
    const canAddUser = await this.tenantService.isWithinLimits(tenantId, 'users')
    if (!canAddUser) {
      throw new Error('User limit reached for your plan. Please upgrade to invite more users.')
    }

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .insert({
        tenant_id: tenantId,
        email,
        role,
        invited_by,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!invitation) throw new Error('Failed to create invitation')

    const invData = invitation as TenantInvitation

    // Get inviter details
    const { data: inviter } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', invited_by)
      .single()

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/accept-invite/${invData.token}`

    // Send invitation email
    try {
      const emailContent = generateInvitationEmail({
        recipientName: '',
        recipientEmail: email,
        tenantName: tenant.name,
        role: this.formatRoleName(role),
        inviteLink,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inviterName: (inviter as any)?.full_name || 'Your team',
      })

      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      })
    } catch (error) {
      console.error('Failed to send invitation email:', error)
      // Don't throw - invitation was created successfully
      // Admin can resend if needed
    }

    return invData
  }

  /**
   * Get invitation by token
   */
  async getInvitationByToken(token: string): Promise<(TenantInvitation & { tenant_name: string }) | null> {
    const supabase = await getPooledSupabaseClient()

    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .select(`
        *,
        tenant:tenants!tenant_id (
          name
        )
      `)
      .eq('token', token)
      .is('accepted_at', null)
      .is('deleted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !invitation) return null

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(invitation as any),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenant_name: (invitation as any).tenant?.name || 'Unknown',
    }
  }

  /**
   * Accept an invitation and create user account
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async acceptInvitation(input: AcceptInvitationInput): Promise<{ user: any; session: any }> {
    const { token, password, full_name } = input

    // Get invitation
    const invitation = await this.getInvitationByToken(token)
    if (!invitation) {
      throw new Error('Invalid or expired invitation')
    }

    const supabase = await getPooledSupabaseClient()

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          full_name,
          tenant_id: invitation.tenant_id,
        },
      },
    })

    if (authError) throw new Error(authError.message)
    if (!authData.user) throw new Error('Failed to create user account')

    // Create user in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        tenant_id: invitation.tenant_id,
        auth_user_id: authData.user.id,
        email: invitation.email,
        full_name,
        role: invitation.role,
        is_active: true,
        language_preference: 'en',
        notification_preferences: { email: true, sms: false, push: false },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (userError) {
      // Rollback: Delete auth user if user creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw new Error(userError.message)
    }

    // Mark invitation as accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateResult = (await supabase.from('tenant_invitations')) as any

    await updateResult
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    return {
      user,
      session: authData.session,
    }
  }

  /**
   * Resend invitation email
   */
  async resendInvitation(invitationId: string): Promise<void> {
    const { supabase, tenant } = await this.getClient()

    const { data: invitation, error } = await supabase
      .from('tenant_invitations')
      .select(`
        *,
        inviter:users!invited_by (
          full_name
        )
      `)
      .eq('id', invitationId)
      .is('accepted_at', null)
      .is('deleted_at', null)
      .single()

    if (error || !invitation) {
      throw new Error('Invitation not found or already accepted')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const invData = invitation as any

    if (new Date(invData.expires_at) < new Date()) {
      throw new Error('Invitation has expired. Please create a new invitation.')
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/accept-invite/${invData.token}`

    // Send invitation email
    const emailContent = generateInvitationEmail({
      recipientName: '',
      recipientEmail: invData.email,
      tenantName: tenant.name,
      role: this.formatRoleName(invData.role),
      inviteLink,
      inviterName: invData.inviter?.full_name || 'Your team',
    })

    await sendEmail({
      to: invData.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })
  }

  /**
   * Cancel/revoke an invitation
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    const { supabase, tenantId } = await this.getClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateResult = supabase.from('tenant_invitations') as any

    const { error } = await updateResult.update({ deleted_at: new Date().toISOString() }).eq('id', invitationId).eq('tenant_id', tenantId)

    if (error) throw new Error(error.message)
  }

  /**
   * Format role name for display
   */
  private formatRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      manager: 'Manager',
      staff: 'Staff',
      vendor: 'Vendor',
      readonly: 'Read-Only',
    }
    return roleMap[role] || role
  }
}
