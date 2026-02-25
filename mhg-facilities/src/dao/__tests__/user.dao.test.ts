import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { UserDAO } from "../user.dao";
import type { User, UserRole } from "@/types/database";

interface MockQueryBuilder {
  select: Mock;
  insert: Mock;
  update: Mock;
  eq: Mock;
  in: Mock;
  is: Mock;
  order: Mock;
  single: Mock;
}

interface MockSupabaseClient {
  from: Mock;
  auth: {
    admin: {
      getUserById: Mock;
    };
  };
}

describe("UserDAO", () => {
  let dao: UserDAO;
  let mockSupabase: MockSupabaseClient;
  let mockQuery: MockQueryBuilder;

  const mockUser: User = {
    id: "user-1",
    tenant_id: "test-tenant-id",
    auth_user_id: "auth-uuid-1",
    email: "test@example.com",
    full_name: "Test User",
    role: "user" as UserRole,
    is_active: true,
    must_set_password: false,
    language_preference: "en",
    phone: null,
    location_id: null,
    deactivated_at: null,
    notification_preferences: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    dao = new UserDAO();

    mockQuery = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    mockSupabase = {
      from: vi.fn(() => mockQuery),
      auth: {
        admin: {
          getUserById: vi.fn(),
        },
      },
    };

    vi.doMock("@/lib/supabase/server-pooled", () => ({
      getPooledSupabaseClient: vi.fn(() => Promise.resolve(mockSupabase)),
    }));

    vi.doMock("@/lib/tenant/context", () => ({
      getTenantContext: vi.fn(() =>
        Promise.resolve({ id: "test-tenant-id", name: "Test Tenant" }),
      ),
    }));
  });

  describe("findByEmail", () => {
    it("should return user by email within tenant", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockUser, error: null });

      const result = await dao.findByEmail("test@example.com");

      expect(mockSupabase.from).toHaveBeenCalledWith("users");
      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");
      expect(mockQuery.eq).toHaveBeenCalledWith("email", "test@example.com");
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(result).toEqual(mockUser);
    });

    it("should return null if user not found", async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await dao.findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should throw error for database errors", async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      await expect(dao.findByEmail("test@example.com")).rejects.toThrow(
        "Database error",
      );
    });
  });

  describe("findByAuthUserId", () => {
    it("should find user by auth user ID and tenant", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { email: "test@example.com" } },
        error: null,
      });
      mockQuery.single.mockResolvedValueOnce({ data: mockUser, error: null });

      const result = await dao.findByAuthUserId(
        "auth-user-id",
        "test-tenant-id",
      );

      expect(mockSupabase.auth.admin.getUserById).toHaveBeenCalledWith(
        "auth-user-id",
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");
      expect(mockQuery.eq).toHaveBeenCalledWith("email", "test@example.com");
      expect(result).toEqual(mockUser);
    });

    it("should return null if auth user not found", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: null,
        error: { message: "User not found" },
      });

      const result = await dao.findByAuthUserId(
        "auth-user-id",
        "test-tenant-id",
      );

      expect(result).toBeNull();
    });

    it("should return null if auth user has no email", async () => {
      mockSupabase.auth.admin.getUserById.mockResolvedValueOnce({
        data: { user: { email: null } },
        error: null,
      });

      const result = await dao.findByAuthUserId(
        "auth-user-id",
        "test-tenant-id",
      );

      expect(result).toBeNull();
    });
  });

  describe("findByLocation", () => {
    it("should return users by location within tenant", async () => {
      const mockUsers = [mockUser, { ...mockUser, id: "user-2" }];
      mockQuery.order.mockResolvedValueOnce({ data: mockUsers, error: null });

      const result = await dao.findByLocation("location-1");

      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");
      expect(mockQuery.eq).toHaveBeenCalledWith("location_id", "location-1");
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(mockQuery.order).toHaveBeenCalledWith("full_name", {
        ascending: true,
      });
      expect(result).toEqual(mockUsers);
    });

    it("should return empty array if no users found", async () => {
      mockQuery.order.mockResolvedValueOnce({ data: null, error: null });

      const result = await dao.findByLocation("location-1");

      expect(result).toEqual([]);
    });
  });

  describe("findAdmins", () => {
    it("should return admin and super_admin users", async () => {
      const adminUser = { ...mockUser, role: "admin" as UserRole };
      const superAdminUser = {
        ...mockUser,
        id: "user-2",
        role: "super_admin" as UserRole,
      };
      mockQuery.order.mockResolvedValueOnce({
        data: [adminUser, superAdminUser],
        error: null,
      });

      const result = await dao.findAdmins();

      expect(mockQuery.in).toHaveBeenCalledWith("role", [
        "admin",
        "super_admin",
      ]);
      expect(result).toHaveLength(2);
    });
  });

  describe("findByRole", () => {
    it("should return users with specific role", async () => {
      const managerUser = { ...mockUser, role: "manager" as UserRole };
      mockQuery.order.mockResolvedValueOnce({
        data: [managerUser],
        error: null,
      });

      const result = await dao.findByRole("manager" as UserRole);

      expect(mockQuery.eq).toHaveBeenCalledWith("role", "manager");
      expect(result).toEqual([managerUser]);
    });
  });

  describe("findActive", () => {
    it("should return only active users", async () => {
      const activeUsers = [mockUser, { ...mockUser, id: "user-2" }];
      mockQuery.order.mockResolvedValueOnce({ data: activeUsers, error: null });

      const result = await dao.findActive();

      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");
      expect(mockQuery.eq).toHaveBeenCalledWith("is_active", true);
      expect(mockQuery.is).toHaveBeenCalledWith("deleted_at", null);
      expect(result).toEqual(activeUsers);
    });
  });

  describe("createWithTenant", () => {
    it("should create user with explicit tenant_id", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: mockUser, error: null });

      const result = await dao.createWithTenant("test-tenant-id", {
        email: "new@example.com",
        full_name: "New User",
      });

      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new@example.com",
          full_name: "New User",
          tenant_id: "test-tenant-id",
        }),
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw error if create fails", async () => {
      mockQuery.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Duplicate email" },
      });

      await expect(
        dao.createWithTenant("test-tenant-id", {
          email: "new@example.com",
          full_name: "New User",
        }),
      ).rejects.toThrow("Duplicate email");
    });
  });

  describe("deactivate", () => {
    it("should deactivate user", async () => {
      const deactivatedUser = {
        ...mockUser,
        is_active: false,
        deactivated_at: "2024-01-15T00:00:00Z",
      };
      mockQuery.single.mockResolvedValueOnce({
        data: deactivatedUser,
        error: null,
      });

      const result = await dao.deactivate("user-1");

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          deactivated_at: expect.any(String),
          updated_at: expect.any(String),
        }),
      );
      expect(mockQuery.eq).toHaveBeenCalledWith("id", "user-1");
      expect(mockQuery.eq).toHaveBeenCalledWith("tenant_id", "test-tenant-id");
      expect(result.is_active).toBe(false);
    });

    it("should throw error if user not found", async () => {
      mockQuery.single.mockResolvedValueOnce({ data: null, error: null });

      await expect(dao.deactivate("non-existent")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("reactivate", () => {
    it("should reactivate user", async () => {
      const reactivatedUser = {
        ...mockUser,
        is_active: true,
        deactivated_at: null,
      };
      mockQuery.single.mockResolvedValueOnce({
        data: reactivatedUser,
        error: null,
      });

      const result = await dao.reactivate("user-1");

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          deactivated_at: null,
          updated_at: expect.any(String),
        }),
      );
      expect(result.is_active).toBe(true);
      expect(result.deactivated_at).toBeNull();
    });
  });

  describe("updateRole", () => {
    it("should update user role", async () => {
      const updatedUser = { ...mockUser, role: "manager" as UserRole };
      mockQuery.single.mockResolvedValueOnce({
        data: updatedUser,
        error: null,
      });

      await dao.updateRole("user-1", "manager" as UserRole);

      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          role: "manager",
          updated_at: expect.any(String),
        }),
      );
    });
  });
});
