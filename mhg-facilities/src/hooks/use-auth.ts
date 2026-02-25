"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import api from "@/lib/api-client";
import type { UserRole } from "@/types/database";

// Types for the auth state
interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone: string | null;
  locationId: string | null;
  languagePreference: "en" | "es";
  isActive: boolean;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

interface TenantContext {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  features: Record<string, boolean>;
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url: string | null;
    favicon_url: string | null;
  };
  limits: {
    maxUsers: number;
    maxLocations: number;
    storageGb: number;
  };
}

interface AuthResponse {
  user: AuthUser;
  tenant: TenantContext;
}

// Query key for auth data
export const AUTH_QUERY_KEY = ["auth", "me"] as const;

/**
 * Hook to access authentication state
 * Uses TanStack Query for caching and automatic refetching
 */
export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch auth data
  const { data, isLoading, error, refetch } = useQuery<AuthResponse>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<AuthResponse>("/api/auth/me");
      return response;
    },
    retry: false, // Don't retry on 401
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call logout action (server-side)
      const { logout: logoutAction } = await import("@/app/(auth)/actions");
      await logoutAction();
    } catch {
      // Logout action redirects, so errors here can be ignored
    } finally {
      // Clear auth cache
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      // Redirect to login
      router.push("/login");
      router.refresh();
    }
  }, [queryClient, router]);

  // Derived state
  const isAuthenticated = !!data?.user && !error;
  const user = data?.user ?? null;
  const tenant = data?.tenant ?? null;

  return {
    user,
    tenant,
    isLoading,
    isAuthenticated,
    error: error instanceof Error ? error.message : null,
    logout,
    refetch,
  };
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(allowedRoles: UserRole[]): boolean {
  const { user } = useAuth();
  return user ? allowedRoles.includes(user.role) : false;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  return useHasRole(["admin", "super_admin"]);
}

/**
 * Hook to check if user can manage resources
 */
export function useCanManage(
  resource: "users" | "locations" | "tickets" | "assets",
): boolean {
  const { user } = useAuth();

  if (!user) return false;

  switch (resource) {
    case "users":
      return ["admin", "super_admin"].includes(user.role);
    case "locations":
      return ["admin", "super_admin", "manager"].includes(user.role);
    case "tickets":
      return ["admin", "super_admin", "manager", "staff"].includes(user.role);
    case "assets":
      return ["admin", "super_admin", "manager"].includes(user.role);
    default:
      return false;
  }
}
