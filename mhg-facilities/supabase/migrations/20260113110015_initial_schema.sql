-- =====================================================
-- MHG FACILITIES MANAGEMENT SYSTEM
-- Initial Database Schema Migration
-- =====================================================
-- Multi-tenant architecture with full data isolation
-- CRITICAL: All tenant-scoped tables have tenant_id column
-- CRITICAL: All tables use soft deletes (deleted_at column)
-- =====================================================

-- =====================
-- EXTENSIONS
-- =====================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- ENUM TYPES
-- =====================

CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin',
  'manager',
  'staff',
  'vendor',
  'readonly'
);

CREATE TYPE tenant_plan AS ENUM (
  'trial',
  'free',
  'starter',
  'professional',
  'enterprise'
);

CREATE TYPE tenant_status AS ENUM (
  'active',
  'suspended',
  'cancelled',
  'trial'
);

CREATE TYPE location_status AS ENUM (
  'active',
  'temporarily_closed',
  'permanently_closed'
);

CREATE TYPE asset_status AS ENUM (
  'active',
  'under_maintenance',
  'retired',
  'transferred',
  'disposed'
);

CREATE TYPE ticket_status AS ENUM (
  'submitted',
  'acknowledged',
  'needs_approval',
  'approved',
  'in_progress',
  'completed',
  'verified',
  'closed',
  'rejected',
  'on_hold'
);

CREATE TYPE ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

CREATE TYPE compliance_status AS ENUM (
  'active',
  'expiring_soon',
  'expired',
  'pending_renewal',
  'conditional',
  'failed_inspection',
  'suspended'
);

CREATE TYPE approval_status AS ENUM (
  'pending',
  'approved',
  'denied'
);

CREATE TYPE invoice_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'disputed'
);

CREATE TYPE incident_status AS ENUM (
  'active',
  'contained',
  'resolved'
);

CREATE TYPE incident_severity AS ENUM (
  'high',
  'critical'
);

CREATE TYPE pm_frequency AS ENUM (
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semi_annually',
  'annually'
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'push',
  'slack'
);

-- =====================
-- TENANTS TABLE
-- =====================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Subscription & billing
  plan tenant_plan DEFAULT 'trial',
  status tenant_status DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT now() + INTERVAL '14 days',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,

  -- Limits
  max_users INT DEFAULT 5,
  max_locations INT DEFAULT 3,
  storage_limit_gb INT DEFAULT 5,

  -- Feature flags
  features JSONB DEFAULT '{
    "compliance_tracking": true,
    "preventive_maintenance": true,
    "vendor_portal": false,
    "budget_tracking": false,
    "emergency_module": false,
    "api_access": false,
    "sso": false,
    "custom_domain": false
  }'::JSONB,

  -- Branding
  branding JSONB DEFAULT '{
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF",
    "logo_url": null,
    "favicon_url": null
  }'::JSONB,

  -- Custom domain
  custom_domain TEXT UNIQUE,
  domain_verified_at TIMESTAMPTZ,

  -- Contact info
  owner_email TEXT NOT NULL,
  billing_email TEXT,
  phone TEXT,
  address TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- LOCATIONS TABLE
-- Created before users to avoid circular dependency
-- =====================

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  square_footage INT,
  manager_id UUID, -- FK added after users table
  emergency_contact_phone TEXT,
  status location_status DEFAULT 'active',
  opened_date DATE,
  closed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- USERS TABLE
-- =====================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  auth_user_id UUID UNIQUE, -- Links to Supabase Auth
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  phone TEXT,
  location_id UUID REFERENCES locations(id),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Email unique per tenant
  UNIQUE(tenant_id, email)
);

-- Add manager FK to locations
ALTER TABLE locations
  ADD CONSTRAINT fk_locations_manager
  FOREIGN KEY (manager_id) REFERENCES users(id);

-- =====================
-- TENANT INVITATIONS
-- =====================

CREATE TABLE tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  role user_role NOT NULL,
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- VENDORS
-- =====================

CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  emergency_phone TEXT,
  address TEXT,
  service_categories TEXT[],
  is_preferred BOOLEAN DEFAULT false,
  contract_start_date DATE,
  contract_expiration DATE,
  insurance_expiration DATE,
  insurance_minimum_required DECIMAL(10,2),
  hourly_rate DECIMAL(8,2),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- ASSET CATEGORIES
-- =====================

CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  default_lifespan_years INT,
  parent_category_id UUID REFERENCES asset_categories(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- ASSETS
-- =====================

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  category_id UUID REFERENCES asset_categories(id),
  location_id UUID REFERENCES locations(id),
  serial_number TEXT,
  model TEXT,
  manufacturer TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  warranty_expiration DATE,
  expected_lifespan_years INT,
  vendor_id UUID REFERENCES vendors(id),
  status asset_status DEFAULT 'active',
  qr_code TEXT,
  manual_url TEXT,
  spec_sheet_path TEXT,
  photo_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- QR code unique per tenant
  UNIQUE(tenant_id, qr_code)
);

-- =====================
-- ASSET TRANSFERS (Audit trail - no soft delete)
-- =====================

CREATE TABLE asset_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  from_location_id UUID REFERENCES locations(id),
  to_location_id UUID REFERENCES locations(id),
  transferred_by UUID REFERENCES users(id),
  transferred_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  notes TEXT
);

-- =====================
-- TICKET CATEGORIES
-- =====================

CREATE TABLE ticket_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  default_priority ticket_priority DEFAULT 'medium',
  default_assignee_id UUID REFERENCES users(id),
  preferred_vendor_id UUID REFERENCES vendors(id),
  approval_threshold DECIMAL(10,2),
  escalation_hours INT DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- TICKETS
-- =====================

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES ticket_categories(id),
  location_id UUID REFERENCES locations(id),
  asset_id UUID REFERENCES assets(id),
  priority ticket_priority DEFAULT 'medium',
  status ticket_status DEFAULT 'submitted',

  -- Assignment
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),

  -- Relationships
  parent_ticket_id UUID REFERENCES tickets(id),
  related_ticket_ids UUID[],
  merged_into_ticket_id UUID REFERENCES tickets(id),
  is_duplicate BOOLEAN DEFAULT false,

  -- Financials
  estimated_cost DECIMAL(10,2),
  approved_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  is_warranty_claim BOOLEAN DEFAULT false,

  -- Timestamps
  due_date TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- Flags
  is_emergency BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Ticket number unique per tenant
  UNIQUE(tenant_id, ticket_number)
);

-- =====================
-- TICKET STATUS HISTORY (Audit trail - no soft delete)
-- =====================

CREATE TABLE ticket_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  from_status ticket_status,
  to_status ticket_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- TICKET COMMENTS
-- =====================

CREATE TABLE ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  user_id UUID REFERENCES users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- TICKET ATTACHMENTS
-- =====================

CREATE TABLE ticket_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size_bytes INT CHECK (file_size_bytes <= 52428800),
  uploaded_by UUID REFERENCES users(id),
  attachment_type TEXT CHECK (attachment_type IN ('initial', 'progress', 'completion', 'invoice', 'quote')),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- COST APPROVALS (Audit trail - no soft delete)
-- =====================

CREATE TABLE cost_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id),
  estimated_cost DECIMAL(10,2) NOT NULL,
  vendor_quote_path TEXT,
  requested_by UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  status approval_status DEFAULT 'pending',
  denial_reason TEXT,
  notes TEXT
);

-- =====================
-- VENDOR RATINGS (Audit trail - no soft delete)
-- =====================

CREATE TABLE vendor_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  ticket_id UUID REFERENCES tickets(id),
  rated_by UUID REFERENCES users(id),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  response_time_rating INT CHECK (response_time_rating BETWEEN 1 AND 5),
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  cost_rating INT CHECK (cost_rating BETWEEN 1 AND 5),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- COMPLIANCE DOCUMENT TYPES
-- =====================

CREATE TABLE compliance_document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  name_es TEXT,
  description TEXT,
  default_alert_days INT[] DEFAULT '{90, 60, 30, 14, 7}',
  renewal_checklist JSONB,
  is_location_specific BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- COMPLIANCE DOCUMENTS
-- =====================

CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  document_type_id UUID REFERENCES compliance_document_types(id),
  location_id UUID REFERENCES locations(id),
  location_ids UUID[],
  issue_date DATE,
  expiration_date DATE,
  issuing_authority TEXT,
  document_number TEXT,
  file_path TEXT,
  status compliance_status DEFAULT 'active',

  -- Conditional/Provisional tracking
  is_conditional BOOLEAN DEFAULT false,
  conditional_requirements TEXT,
  conditional_deadline DATE,

  -- Renewal tracking
  renewal_submitted_date DATE,
  renewal_cost DECIMAL(10,2),
  renewal_assigned_to UUID REFERENCES users(id),

  -- Failed inspection tracking
  failed_inspection_date DATE,
  corrective_action_required TEXT,
  reinspection_date DATE,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- COMPLIANCE DOCUMENT VERSIONS (Audit trail - no soft delete)
-- =====================

CREATE TABLE compliance_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES compliance_documents(id),
  file_path TEXT NOT NULL,
  version_number INT NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- COMPLIANCE ALERTS (Audit trail - no soft delete)
-- =====================

CREATE TABLE compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES compliance_documents(id),
  alert_type TEXT CHECK (alert_type IN ('90_day', '60_day', '30_day', '14_day', '7_day', 'expired', 'failed_inspection')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_to TEXT[],
  delivery_method TEXT CHECK (delivery_method IN ('email', 'sms', 'both'))
);

-- =====================
-- PM TEMPLATES
-- =====================

CREATE TABLE pm_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  checklist JSONB,
  estimated_duration_hours DECIMAL(4,2),
  default_vendor_id UUID REFERENCES vendors(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- PM SCHEDULES
-- =====================

CREATE TABLE pm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id UUID REFERENCES pm_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  asset_id UUID REFERENCES assets(id),
  location_id UUID REFERENCES locations(id),
  frequency pm_frequency NOT NULL,
  day_of_week INT CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INT CHECK (day_of_month BETWEEN 1 AND 31),
  month_of_year INT CHECK (month_of_year BETWEEN 1 AND 12),
  assigned_to UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  estimated_cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- PM COMPLETIONS (Audit trail - no soft delete)
-- =====================

CREATE TABLE pm_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES pm_schedules(id),
  ticket_id UUID REFERENCES tickets(id),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  completed_by UUID REFERENCES users(id),
  checklist_results JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- BUDGETS
-- =====================

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID REFERENCES locations(id),
  category TEXT,
  fiscal_year INT NOT NULL,
  annual_budget DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- One budget per location/category/year
  UNIQUE(tenant_id, location_id, category, fiscal_year)
);

-- =====================
-- ASSET HISTORY (Audit trail - no soft delete)
-- =====================

CREATE TABLE asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id),
  ticket_id UUID REFERENCES tickets(id),
  maintenance_type TEXT CHECK (maintenance_type IN ('repair', 'preventive', 'inspection', 'replacement', 'warranty_claim')),
  description TEXT,
  cost DECIMAL(10,2),
  performed_by TEXT,
  vendor_id UUID REFERENCES vendors(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- ON-CALL SCHEDULES
-- =====================

CREATE TABLE on_call_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID REFERENCES locations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- EMERGENCY INCIDENTS
-- =====================

CREATE TABLE emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  title TEXT NOT NULL,
  description TEXT,
  severity incident_severity NOT NULL,
  status incident_status DEFAULT 'active',
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMPTZ DEFAULT now(),
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- =====================
-- HELPER FUNCTIONS
-- =====================

-- Get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = p_user_id AND deleted_at IS NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check if user is admin or above
CREATE OR REPLACE FUNCTION is_admin_or_above(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = p_user_id
    AND role IN ('admin', 'super_admin')
    AND deleted_at IS NULL
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get user's location
CREATE OR REPLACE FUNCTION get_user_location(p_user_id UUID)
RETURNS UUID AS $$
  SELECT location_id FROM users WHERE id = p_user_id AND deleted_at IS NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Get user's tenant
CREATE OR REPLACE FUNCTION get_user_tenant(p_user_id UUID)
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = p_user_id AND deleted_at IS NULL;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Check for duplicate tickets
CREATE OR REPLACE FUNCTION check_duplicate_ticket(
  p_tenant_id UUID,
  p_location_id UUID,
  p_asset_id UUID,
  p_title TEXT,
  p_hours_back INT DEFAULT 48
)
RETURNS SETOF tickets AS $$
BEGIN
  RETURN QUERY
  SELECT t.*
  FROM tickets t
  WHERE t.tenant_id = p_tenant_id
    AND t.location_id = p_location_id
    AND (p_asset_id IS NULL OR t.asset_id = p_asset_id)
    AND t.deleted_at IS NULL
    AND t.status NOT IN ('closed', 'rejected')
    AND t.created_at > now() - (p_hours_back || ' hours')::INTERVAL
    AND similarity(t.title, p_title) > 0.3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_trgm extension for similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================
-- AUTO-INCREMENT TICKET NUMBER PER TENANT
-- =====================

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
BEGIN
  SELECT COALESCE(MAX(ticket_number), 0) + 1
  INTO next_number
  FROM tickets
  WHERE tenant_id = NEW.tenant_id;

  NEW.ticket_number = next_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION generate_ticket_number();

-- =====================
-- UPDATED_AT TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER trigger_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_compliance_documents_updated_at BEFORE UPDATE ON compliance_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_pm_schedules_updated_at BEFORE UPDATE ON pm_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_emergency_incidents_updated_at BEFORE UPDATE ON emergency_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================
-- TICKET STATUS HISTORY TRIGGER
-- =====================

CREATE OR REPLACE FUNCTION log_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO ticket_status_history (ticket_id, from_status, to_status)
    VALUES (NEW.id, OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_ticket_status
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_status_change();

-- =====================
-- INDEXES
-- =====================

-- Tenant isolation indexes (critical for performance)
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_tenant ON locations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_tenant ON assets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_tenant ON vendors(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_tenant ON tickets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_documents_tenant ON compliance_documents(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_schedules_tenant ON pm_schedules(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_budgets_tenant ON budgets(tenant_id) WHERE deleted_at IS NULL;

-- Ticket indexes
CREATE INDEX idx_tickets_status ON tickets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_priority ON tickets(priority) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_location ON tickets(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_tickets_title_trgm ON tickets USING gin(title gin_trgm_ops);

-- Asset indexes
CREATE INDEX idx_assets_location ON assets(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warranty ON assets(warranty_expiration) WHERE deleted_at IS NULL AND warranty_expiration IS NOT NULL;
CREATE INDEX idx_assets_qr_code ON assets(qr_code) WHERE qr_code IS NOT NULL;

-- Compliance indexes
CREATE INDEX idx_compliance_expiration ON compliance_documents(expiration_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_status ON compliance_documents(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_compliance_location ON compliance_documents(location_id) WHERE deleted_at IS NULL;

-- PM indexes
CREATE INDEX idx_pm_schedules_active ON pm_schedules(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_pm_schedules_next_due ON pm_schedules(next_due_date) WHERE deleted_at IS NULL AND is_active = true;

-- Vendor indexes
CREATE INDEX idx_vendors_active ON vendors(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_vendors_preferred ON vendors(is_preferred) WHERE deleted_at IS NULL AND is_preferred = true;

-- User indexes
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_users_location ON users(location_id) WHERE deleted_at IS NULL;

-- =====================
-- ROW LEVEL SECURITY (RLS)
-- =====================

-- RLS is NOT enabled on these tables.
-- Tenant isolation is enforced at the application layer (DAO).
-- All queries filter by tenant_id in the BaseDAO class.
-- This approach provides simpler management while maintaining security
-- through the service role key and application-level checks.

-- =====================
-- STORAGE BUCKETS
-- =====================

-- These are created via Supabase Dashboard or separate migration
-- Included here for reference:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
--   ('ticket-photos', 'ticket-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
--   ('ticket-documents', 'ticket-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
--   ('compliance-docs', 'compliance-docs', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
--   ('asset-photos', 'asset-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
--   ('asset-manuals', 'asset-manuals', false, 104857600, ARRAY['application/pdf']),
--   ('vendor-invoices', 'vendor-invoices', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']);
