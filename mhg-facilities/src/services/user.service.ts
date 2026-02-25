import { UserDAO } from "@/dao/user.dao";
import { TenantService } from "@/services/tenant.service";
import { createClient } from "@/lib/supabase/server";
import type { User, UserRole, Json } from "@/types/database";
import type { NotificationPreferences } from "@/types";

interface CreateUserInput {
  email: string;
  fullName: string;
  role?: UserRole;
  phone?: string;
  locationId?: string;
  languagePreference?: "en" | "es";
  notificationPreferences?: NotificationPreferences;
}

interface UpdateProfileInput {
  fullName?: string;
  phone?: string | null;
  locationId?: string | null;
  languagePreference?: "en" | "es";
  notificationPreferences?: NotificationPreferences;
}

/**
 * User Service - Business logic for user operations
 */
export class UserService {
  constructor(
    private userDAO = new UserDAO(),
    private tenantService = new TenantService(),
  ) {}

  /**
   * Get the currently authenticated user
   * Looks up user by auth_user_id directly (no tenant context needed)
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = await createClient();

    // Get the auth user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return null;

    // Find user in our users table by auth_user_id directly
    // This bypasses tenant context since we're looking up by auth ID
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", authUser.id)
      .is("deleted_at", null)
      .single();

    if (error || !user) {
      return null;
    }

    return user as User;
  }

  /**
   * Get a user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userDAO.findById(id);
  }

  /**
   * Create a new user
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const {
      email,
      fullName,
      role = "staff",
      phone,
      locationId,
      languagePreference = "en",
      notificationPreferences = { email: true, sms: false, push: false },
    } = input;

    // Check if tenant is within user limit
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser?.user_metadata?.tenant_id) {
      const canAddUser = await this.tenantService.isWithinLimits(
        authUser.user_metadata.tenant_id,
        "users",
      );

      if (!canAddUser) {
        throw new Error(
          "User limit reached for your plan. Please upgrade to add more users.",
        );
      }
    }

    // Check if user with email already exists
    const existingUser = await this.userDAO.findByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email already exists");
    }

    // Create the user
    return this.userDAO.create({
      email,
      full_name: fullName,
      role,
      phone: phone ?? null,
      location_id: locationId ?? null,
      language_preference: languagePreference,
      is_active: true,
      notification_preferences: notificationPreferences as unknown as Json,
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<User> {
    const updateData: Record<string, unknown> = {};

    if (input.fullName !== undefined) {
      updateData.full_name = input.fullName;
    }
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    if (input.locationId !== undefined) {
      updateData.location_id = input.locationId;
    }
    if (input.languagePreference !== undefined) {
      updateData.language_preference = input.languagePreference;
    }
    if (input.notificationPreferences !== undefined) {
      updateData.notification_preferences = input.notificationPreferences;
    }

    return this.userDAO.update(userId, updateData);
  }

  /**
   * Deactivate a user
   */
  async deactivateUser(userId: string): Promise<User> {
    return this.userDAO.deactivate(userId);
  }

  /**
   * Reactivate a user
   */
  async reactivateUser(userId: string): Promise<User> {
    return this.userDAO.reactivate(userId);
  }

  /**
   * Change user role
   */
  async changeRole(userId: string, newRole: UserRole): Promise<User> {
    // Validate role transition
    const user = await this.userDAO.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Prevent changing own role
    const currentUser = await this.getCurrentUser();
    if (currentUser?.id === userId) {
      throw new Error("You cannot change your own role");
    }

    return this.userDAO.updateRole(userId, newRole);
  }

  /**
   * Get all active users
   */
  async getActiveUsers(): Promise<User[]> {
    return this.userDAO.findActive();
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    return this.userDAO.findByRole(role);
  }

  /**
   * Get admin users
   */
  async getAdmins(): Promise<User[]> {
    return this.userDAO.findAdmins();
  }

  /**
   * Get users by location
   */
  async getUsersByLocation(locationId: string): Promise<User[]> {
    return this.userDAO.findByLocation(locationId);
  }

  /**
   * Check if user has admin privileges
   */
  isAdmin(user: User): boolean {
    return user.role === "admin" || user.role === "super_admin";
  }

  /**
   * Check if user can manage other users
   */
  canManageUsers(user: User): boolean {
    return this.isAdmin(user);
  }

  /**
   * Check if user can manage locations
   */
  canManageLocations(user: User): boolean {
    return (
      user.role === "admin" ||
      user.role === "super_admin" ||
      user.role === "manager"
    );
  }
}
