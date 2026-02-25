import { getPooledSupabaseClient } from "@/lib/supabase/server-pooled";
import { getTenantContext } from "@/lib/tenant/context";
import { sendEmail } from "@/lib/email/smtp";
import { generateInvitationEmail } from "@/lib/email/templates/invitation";
import { InvitationDAO } from "@/dao/invitation.dao";
import { UserService } from "@/services/user.service";
import { TenantService } from "@/services/tenant.service";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/database";

type TenantInvitation =
  Database["public"]["Tables"]["tenant_invitations"]["Row"];

interface InviteUserInput {
  email: string;
  role: UserRole;
  location_id?: string;
  invited_by: string;
}

interface AcceptInvitationInput {
  token: string;
  full_name: string;
}

/**
 * Invitation Service - Business logic for user invitations
 * Handles invitation creation, email sending, and acceptance
 *
 * Architecture:
 * - Tenant-scoped operations (inviteUser, resendInvitation, cancelInvitation)
 *   use InvitationDAO which provides tenant isolation via BaseDAO
 * - Public operations (getInvitationByToken, acceptInvitation) use
 *   getPooledSupabaseClient() directly since they run without auth/tenant context
 */
export class InvitationService {
  constructor(
    private invitationDAO = new InvitationDAO(),
    private userService = new UserService(),
    private tenantService = new TenantService(),
  ) {}

  /**
   * Get all pending invitations for the current tenant
   * Delegates to DAO's findPending() which filters by tenant, not accepted, not expired, not deleted
   */
  async getPendingInvitations(): Promise<TenantInvitation[]> {
    return this.invitationDAO.findPending();
  }

  /**
   * Invite a user to the tenant
   * Creates invitation record and sends email
   */
  async inviteUser(input: InviteUserInput): Promise<TenantInvitation> {
    const { email, role, location_id, invited_by } = input;
    const tenant = await getTenantContext();

    if (!tenant) {
      throw new Error("Tenant context required for invitation operations");
    }

    // Check if user already exists (uses DAO's tenant-scoped client)
    const { supabase, tenantId } = await this.getTenantClient();

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("email", email)
      .is("deleted_at", null)
      .single();

    if (existingUser) {
      throw new Error(
        "A user with this email already exists in your organization",
      );
    }

    // Check if there's a pending invitation via DAO
    const existingInvitation = await this.invitationDAO.findByEmail(email);
    if (
      existingInvitation &&
      !existingInvitation.accepted_at &&
      new Date(existingInvitation.expires_at) > new Date()
    ) {
      throw new Error("This user already has a pending invitation");
    }

    // Check tenant user limits
    const canAddUser = await this.tenantService.isWithinLimits(
      tenantId,
      "users",
    );
    if (!canAddUser) {
      throw new Error(
        "User limit reached for your plan. Please upgrade to invite more users.",
      );
    }

    // Create invitation via DAO (auto-sets tenant_id)
    const insertData: Record<string, unknown> = {
      email,
      role,
      invited_by,
    };
    if (location_id) {
      insertData.location_id = location_id;
    }

    const invitation = await this.invitationDAO.create(
      insertData as Partial<
        Database["public"]["Tables"]["tenant_invitations"]["Insert"]
      >,
    );

    // Get inviter details
    const { data: inviter } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", invited_by)
      .single();

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/accept-invite/${invitation.token}`;

    // Send invitation email
    try {
      const inviterRecord = inviter as { full_name: string } | null;
      const emailContent = generateInvitationEmail({
        recipientName: "",
        recipientEmail: email,
        tenantName: tenant.name,
        role: this.formatRoleName(role),
        inviteLink,
        inviterName: inviterRecord?.full_name || "Your team",
      });

      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't throw - invitation was created successfully
      // Admin can resend if needed
    }

    return invitation;
  }

  /**
   * Get invitation by token (public endpoint, no tenant context required)
   */
  async getInvitationByToken(
    token: string,
  ): Promise<
    (TenantInvitation & { tenant_name: string; location_id?: string }) | null
  > {
    const supabase = await getPooledSupabaseClient();

    const { data: invitation, error } = await supabase
      .from("tenant_invitations")
      .select(
        `
        *,
        tenant:tenants!tenant_id (
          name
        )
      `,
      )
      .eq("token", token)
      .is("accepted_at", null)
      .is("deleted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !invitation) return null;

    const invRecord = invitation as TenantInvitation & {
      tenant: { name: string } | null;
    };

    return {
      ...invRecord,
      tenant_name: invRecord.tenant?.name || "Unknown",
    } as TenantInvitation & { tenant_name: string; location_id?: string };
  }

  /**
   * Accept an invitation and create user account (public endpoint, no tenant context required)
   */
  async acceptInvitation(
    input: AcceptInvitationInput,
  ): Promise<{ user: Record<string, unknown>; session: unknown }> {
    const { token, full_name } = input;

    // Get invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) {
      throw new Error("Invalid or expired invitation");
    }

    const supabase = await getPooledSupabaseClient();

    // Create auth user without password via admin API
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: invitation.email,
        email_confirm: true,
        user_metadata: {
          full_name,
          tenant_id: invitation.tenant_id,
        },
      });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Failed to create user account");

    // Create user in users table with must_set_password flag
    const userInsert: Record<string, unknown> = {
      tenant_id: invitation.tenant_id,
      auth_user_id: authData.user.id,
      email: invitation.email,
      full_name,
      role: invitation.role,
      is_active: true,
      must_set_password: true,
      language_preference: "en",
      notification_preferences: { email: true, sms: false, push: false },
    };

    if (invitation.location_id) {
      userInsert.location_id = invitation.location_id;
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .insert(userInsert as never)
      .select()
      .single();

    if (userError) {
      // Rollback: Delete auth user if user creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(userError.message);
    }

    // Mark invitation as accepted with proper error handling
    const { error: acceptError } = await supabase
      .from("tenant_invitations")
      .update({ accepted_at: new Date().toISOString() } as never)
      .eq("id", invitation.id);

    if (acceptError) {
      // Critical: If marking accepted fails, we have a user but the invitation
      // remains "pending" and could be accepted again creating duplicates.
      // Log the error but don't rollback the user - they were created successfully.
      console.error(
        `Failed to mark invitation ${invitation.id} as accepted: ${acceptError.message}. ` +
          "Manual cleanup may be required to prevent duplicate acceptance.",
      );
    }

    // Generate a session via magic link so the user is logged in immediately
    let session = null;
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: invitation.email,
    });

    if (linkData?.properties?.hashed_token) {
      const { data: otpData } = await supabase.auth.verifyOtp({
        token_hash: linkData.properties.hashed_token,
        type: "magiclink",
      });
      session = otpData?.session ?? null;
    }

    return {
      user,
      session,
    };
  }

  /**
   * Resend invitation email (tenant-scoped, uses DAO)
   */
  async resendInvitation(invitationId: string): Promise<void> {
    const tenant = await getTenantContext();
    if (!tenant) {
      throw new Error("Tenant context required for invitation operations");
    }

    // Use DAO to get invitation with tenant isolation
    const invitation = await this.invitationDAO.findById(invitationId);

    if (!invitation || invitation.accepted_at) {
      throw new Error("Invitation not found or already accepted");
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error(
        "Invitation has expired. Please create a new invitation.",
      );
    }

    // Get inviter name
    const { supabase } = await this.getTenantClient();
    let inviterRecord: { full_name: string } | null = null;
    if (invitation.invited_by) {
      const { data: inviter } = await supabase
        .from("users")
        .select("full_name")
        .eq("id", invitation.invited_by)
        .single();
      inviterRecord = inviter as { full_name: string } | null;
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/accept-invite/${invitation.token}`;

    // Send invitation email
    const emailContent = generateInvitationEmail({
      recipientName: "",
      recipientEmail: invitation.email,
      tenantName: tenant.name,
      role: this.formatRoleName(invitation.role),
      inviteLink,
      inviterName: inviterRecord?.full_name || "Your team",
    });

    await sendEmail({
      to: invitation.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });
  }

  /**
   * Cancel/revoke an invitation (tenant-scoped, uses DAO soft delete)
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await this.invitationDAO.softDelete(invitationId);
  }

  /**
   * Get a tenant-scoped Supabase client for queries not covered by the DAO
   * (e.g., cross-table queries on the users table)
   */
  private async getTenantClient() {
    const supabase = await getPooledSupabaseClient();
    const tenant = await getTenantContext();

    if (!tenant) {
      throw new Error("Tenant context required for invitation operations");
    }

    return { supabase, tenantId: tenant.id, tenant };
  }

  /**
   * Format role name for display
   */
  private formatRoleName(role: string): string {
    const roleMap: Record<string, string> = {
      admin: "Administrator",
      manager: "Manager",
      staff: "Staff",
      vendor: "Vendor",
      readonly: "Read-Only",
    };
    return roleMap[role] || role;
  }
}
