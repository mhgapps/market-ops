"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types/database";

// Types for the auth context
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

interface AuthContextType {
  user: AuthUser | null;
  tenant: TenantContext | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  logout: () => Promise<void>;
  refetch: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  tenant: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  logout: async () => {},
  refetch: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider component
 * Wraps the app to provide auth context to all components
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * This is an alternative to useAuth() for components that prefer context pattern
 */
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
