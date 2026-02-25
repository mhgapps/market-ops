// Re-export all database types
export * from "./database";

// Tenant Settings types
export interface TenantFeatures {
  compliance_tracking: boolean;
  preventive_maintenance: boolean;
  vendor_portal: boolean;
  budget_tracking: boolean;
  emergency_module: boolean;
  api_access: boolean;
  sso: boolean;
  custom_domain: boolean;
}

export interface TenantBranding {
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  favicon_url: string | null;
}

export interface TenantSettings {
  features: TenantFeatures;
  branding: TenantBranding;
  limits: {
    max_users: number;
    max_locations: number;
    storage_gb: number;
  };
}

// Tenant context type
export interface TenantContext {
  id: string;
  slug: string;
  name: string;
  settings: TenantSettings;
}

// User notification preferences
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form input types (for creating/updating)
export interface CreateTicketInput {
  title: string;
  description?: string;
  category_id?: string;
  location_id: string;
  asset_id?: string;
  priority?: "low" | "medium" | "high" | "critical";
  is_emergency?: boolean;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  category_id?: string;
  location_id?: string;
  asset_id?: string;
  priority?: "low" | "medium" | "high" | "critical";
  status?: string;
  assigned_to?: string;
  vendor_id?: string;
  estimated_cost?: number;
  actual_cost?: number;
  due_date?: string;
}

export interface CreateAssetInput {
  name: string;
  category_id?: string;
  asset_type_id?: string;
  location_id: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiration?: string;
  expected_lifespan_years?: number;
  vendor_id?: string;
  notes?: string;
}

export interface CreateLocationInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  square_footage?: number;
  manager_id?: string;
  emergency_contact_phone?: string;
}

export interface CreateVendorInput {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  emergency_phone?: string;
  address?: string;
  service_categories?: string[];
  is_preferred?: boolean;
  contract_start_date?: string;
  contract_expiration?: string;
  insurance_expiration?: string;
  hourly_rate?: number;
  notes?: string;
}

export interface CreateComplianceDocumentInput {
  name: string;
  document_type_id?: string;
  location_id?: string;
  location_ids?: string[];
  issue_date?: string;
  expiration_date?: string;
  issuing_authority?: string;
  document_number?: string;
  notes?: string;
}

// Dashboard stat types
export interface DashboardStats {
  openTickets: number;
  overdueTickets: number;
  expiringCompliance: number;
  upcomingPM: number;
  budgetRemaining: number;
  budgetPercentUsed: number;
}

// Ticket with relations
export interface TicketWithRelations {
  id: string;
  tenant_id: string;
  ticket_number: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: string;
  created_at: string;
  updated_at: string;
  location: { id: string; name: string } | null;
  asset: {
    id: string;
    name: string;
    warranty_expiration: string | null;
  } | null;
  category: { id: string; name: string } | null;
  submitted_by_user: { id: string; full_name: string } | null;
  assigned_to_user: { id: string; full_name: string } | null;
  vendor: { id: string; name: string } | null;
}

// Asset with relations
export interface AssetWithRelations {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  warranty_expiration: string | null;
  asset_type_id: string | null;
  location: { id: string; name: string } | null;
  category: { id: string; name: string } | null;
  asset_type: { id: string; name: string; category_id: string } | null;
  vendor: { id: string; name: string } | null;
  tickets?: { id: string; title: string; status: string }[];
}
