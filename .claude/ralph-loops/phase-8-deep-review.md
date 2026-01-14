# Phase 8: Deep Review - Schema Alignment & Full-Stack Verification

## PURPOSE

This phase performs a comprehensive audit of ALL pages and forms to ensure:
1. **Frontend forms match database schema** - Every field in forms corresponds to actual DB columns
2. **API routes respect schema** - All CRUD operations use correct column names
3. **DAOs match database** - No hallucinated columns, correct types
4. **Services follow architecture** - Proper DAO → Service → API flow
5. **Validations match schema** - Zod schemas align with DB constraints
6. **End-to-end wiring** - Data flows correctly from UI → API → DB → UI

**Project Directory**: `mhg-facilities/` - ALL paths relative to this
**Run before starting**: `cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"`

---

## CRITICAL: Schema Reference

The source of truth is: `supabase/migrations/20260113110015_initial_schema.sql`

**Before modifying ANY file, you MUST:**
1. Read the relevant table definition from the migration
2. Verify column names, types, and constraints
3. Check for enum types and their valid values
4. Never assume - always verify against schema

---

## AUDIT METHODOLOGY

For EACH entity (Tickets, Assets, Vendors, Locations, Compliance, PM, Users, Emergencies, Budgets):

### Step 1: Schema Extraction
```sql
-- For each table, document:
-- 1. All columns with types
-- 2. Foreign key relationships
-- 3. Enum constraints
-- 4. NOT NULL constraints
-- 5. Default values
```

### Step 2: Layer-by-Layer Verification
```
Form Component → Validation Schema → API Route → Service → DAO → Database Schema
     ↓                  ↓                ↓           ↓        ↓           ↓
  Form fields     Zod schema       Request body    Methods   Queries   Columns
```

### Step 3: Issue Categories
- **CRITICAL**: Column name mismatch (will cause runtime errors)
- **HIGH**: Type mismatch (will cause data corruption)
- **MEDIUM**: Missing validation (will allow invalid data)
- **LOW**: Style/naming inconsistency

---

## COMPLETE PAGE INVENTORY (EVERY PAGE MUST BE AUDITED)

### Auth Pages (5 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Login | `src/app/(auth)/login/page.tsx` | users, tenants |
| Signup | `src/app/(auth)/signup/page.tsx` | users, tenants |
| Forgot Password | `src/app/(auth)/forgot-password/page.tsx` | users |
| Reset Password | `src/app/(auth)/reset-password/page.tsx` | users |
| Verify Email | `src/app/(auth)/verify-email/page.tsx` | users |

### Dashboard Pages (3 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Dashboard Home | `src/app/(dashboard)/page.tsx` | redirect only |
| Dashboard Main | `src/app/(dashboard)/dashboard/page.tsx` | tickets, assets, compliance, pm_schedules |
| Reports | `src/app/(dashboard)/reports/page.tsx` | tickets, assets, vendors, compliance |

### Tickets Pages (3 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Ticket List | `src/app/(dashboard)/tickets/page.tsx` | tickets |
| Ticket Detail | `src/app/(dashboard)/tickets/[id]/page.tsx` | tickets, ticket_comments, ticket_attachments |
| New Ticket | `src/app/(dashboard)/tickets/new/page.tsx` | tickets |

### Assets Pages (5 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Asset List | `src/app/(dashboard)/assets/page.tsx` | assets |
| Asset Detail | `src/app/(dashboard)/assets/[id]/page.tsx` | assets, asset_history |
| New Asset | `src/app/(dashboard)/assets/new/page.tsx` | assets |
| Edit Asset | `src/app/(dashboard)/assets/[id]/edit/page.tsx` | assets |
| Scan Asset | `src/app/(dashboard)/assets/scan/page.tsx` | assets (qr_code lookup) |

### Vendors Pages (4 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Vendor List | `src/app/(dashboard)/vendors/page.tsx` | vendors |
| Vendor Detail | `src/app/(dashboard)/vendors/[id]/page.tsx` | vendors, vendor_ratings |
| New Vendor | `src/app/(dashboard)/vendors/new/page.tsx` | vendors |
| Edit Vendor | `src/app/(dashboard)/vendors/[id]/edit/page.tsx` | vendors |

### Locations Pages (3 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Location List | `src/app/(dashboard)/locations/page.tsx` | locations |
| Location Detail | `src/app/(dashboard)/locations/[id]/page.tsx` | locations |
| New Location | `src/app/(dashboard)/locations/new/page.tsx` | locations |

### Compliance Pages (4 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Compliance List | `src/app/(dashboard)/compliance/page.tsx` | compliance_documents |
| Compliance Detail | `src/app/(dashboard)/compliance/[id]/page.tsx` | compliance_documents, compliance_document_versions |
| New Compliance | `src/app/(dashboard)/compliance/new/page.tsx` | compliance_documents |
| Edit Compliance | `src/app/(dashboard)/compliance/[id]/edit/page.tsx` | compliance_documents |

### PM Pages (6 pages)
| Page | File | Related Schema |
|------|------|----------------|
| PM Schedule List | `src/app/(dashboard)/pm/page.tsx` | pm_schedules |
| PM Schedule Detail | `src/app/(dashboard)/pm/[id]/page.tsx` | pm_schedules, pm_completions |
| New PM Schedule | `src/app/(dashboard)/pm/new/page.tsx` | pm_schedules |
| Edit PM Schedule | `src/app/(dashboard)/pm/[id]/edit/page.tsx` | pm_schedules |
| PM Templates List | `src/app/(dashboard)/pm/templates/page.tsx` | pm_templates |
| New PM Template | `src/app/(dashboard)/pm/templates/new/page.tsx` | pm_templates |
| PM Template Detail | `src/app/(dashboard)/pm/templates/[id]/page.tsx` | pm_templates |

### Users Page (1 page)
| Page | File | Related Schema |
|------|------|----------------|
| Users List | `src/app/(dashboard)/users/page.tsx` | users |

### Emergency Pages (3 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Emergency List | `src/app/(dashboard)/emergencies/page.tsx` | emergency_incidents |
| Emergency Detail | `src/app/(dashboard)/emergencies/[id]/page.tsx` | emergency_incidents |
| New Emergency | `src/app/(dashboard)/emergencies/new/page.tsx` | emergency_incidents |

### Budgets Page (1 page)
| Page | File | Related Schema |
|------|------|----------------|
| Budgets | `src/app/(dashboard)/budgets/page.tsx` | budgets |

### Approvals Page (1 page)
| Page | File | Related Schema |
|------|------|----------------|
| Approvals | `src/app/(dashboard)/approvals/page.tsx` | cost_approvals, tickets |

### Settings Pages (4 pages)
| Page | File | Related Schema |
|------|------|----------------|
| Settings Hub | `src/app/(dashboard)/settings/page.tsx` | - |
| Profile | `src/app/(dashboard)/settings/profile/page.tsx` | users |
| Notifications | `src/app/(dashboard)/settings/notifications/page.tsx` | users (notification_preferences) |
| Categories | `src/app/(dashboard)/settings/categories/page.tsx` | ticket_categories, asset_categories |
| Tenant | `src/app/(dashboard)/settings/tenant/page.tsx` | tenants |

### Public Pages (1 page)
| Page | File | Related Schema |
|------|------|----------------|
| Accept Invite | `src/app/(public)/accept-invite/[token]/page.tsx` | tenant_invitations, users |

### TOTAL: 44 pages to audit

---

## PAGE AUDIT CHECKLIST (Use for EVERY page)

For each page, verify:
- [ ] All data fetching uses correct column names from schema
- [ ] All form fields map to actual database columns
- [ ] All enum values match schema definitions
- [ ] All foreign key references use correct table/column
- [ ] No hallucinated fields (fields that don't exist in schema)
- [ ] Type-check passes after any modifications
- [ ] Lint passes after any modifications

---

## TASK GROUP A: TICKETS MODULE AUDIT

### A1: Schema Reference - tickets table

From migration, tickets has these columns:
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES ticket_categories(id),
  location_id UUID REFERENCES locations(id),
  asset_id UUID REFERENCES assets(id),
  priority ticket_priority DEFAULT 'medium',  -- ENUM: low, medium, high, critical
  status ticket_status DEFAULT 'submitted',   -- ENUM: submitted, acknowledged, needs_approval, approved, in_progress, completed, verified, closed, rejected, on_hold
  submitted_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),
  parent_ticket_id UUID REFERENCES tickets(id),
  related_ticket_ids UUID[],
  merged_into_ticket_id UUID REFERENCES tickets(id),
  is_duplicate BOOLEAN DEFAULT false,
  estimated_cost DECIMAL(10,2),
  approved_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  is_warranty_claim BOOLEAN DEFAULT false,
  due_date TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  is_emergency BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, ticket_number)
);
```

### A2: Audit ticket-form.tsx

**File**: `src/components/tickets/ticket-form.tsx`

**Checklist**:
- [ ] Verify form fields match schema columns
- [ ] Check `category_id` is UUID, not string
- [ ] Check `priority` uses correct enum values: low, medium, high, critical
- [ ] Check `status` uses correct enum values
- [ ] Verify `location_id` and `asset_id` are optional
- [ ] Check `estimated_cost` is number, not string
- [ ] Verify `is_emergency` and `requires_approval` are boolean
- [ ] Check date fields use proper format

**Action**: Read the file, compare each form field to schema, document mismatches.

### A3: Audit ticket.ts validation

**File**: `src/lib/validations/ticket.ts`

**Checklist**:
- [ ] Zod schema field names match DB columns exactly
- [ ] priority enum matches: z.enum(['low', 'medium', 'high', 'critical'])
- [ ] status enum matches all 10 values
- [ ] UUIDs validated with z.string().uuid()
- [ ] Optional fields marked correctly
- [ ] Number fields use z.number() or z.coerce.number()
- [ ] Date fields use proper validation

### A4: Audit tickets API routes

**Files**:
- `src/app/api/tickets/route.ts` (GET, POST)
- `src/app/api/tickets/[id]/route.ts` (GET, PATCH, DELETE)
- `src/app/api/tickets/[id]/status/route.ts`
- `src/app/api/tickets/[id]/assign/route.ts`
- `src/app/api/tickets/[id]/comments/route.ts`
- `src/app/api/tickets/[id]/attachments/route.ts`
- `src/app/api/tickets/[id]/approval/route.ts`

**Checklist for each**:
- [ ] Request body parsing matches schema
- [ ] Response includes proper fields
- [ ] Error handling for invalid IDs
- [ ] tenant_id filtering in queries
- [ ] Soft delete (deleted_at) not hard delete

### A5: Audit ticket.dao.ts

**File**: `src/dao/ticket.dao.ts`

**Checklist**:
- [ ] All column references match schema
- [ ] Insert operations include tenant_id
- [ ] Select operations filter deleted_at IS NULL
- [ ] Update operations don't modify id, tenant_id, ticket_number
- [ ] Relations correctly join to related tables

### A6: Audit ticket.service.ts

**File**: `src/services/ticket.service.ts`

**Checklist**:
- [ ] Business logic doesn't bypass DAO
- [ ] Proper error handling
- [ ] Status transitions follow valid paths
- [ ] Cost approval workflow correct
- [ ] Notification triggers correct

### A7: Fix Ticket Issues

After audit, create TODO list of issues and fix each one:
```bash
# After each fix:
npm run type-check
npm run lint
```

---

## TASK GROUP B: ASSETS MODULE AUDIT

### B1: Schema Reference - assets table

```sql
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
  status asset_status DEFAULT 'active',  -- ENUM: active, under_maintenance, retired, transferred, disposed
  qr_code TEXT,
  manual_url TEXT,
  spec_sheet_path TEXT,
  photo_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, qr_code)
);
```

### B2: Audit asset-form.tsx

**File**: `src/components/assets/asset-form.tsx`

**Checklist**:
- [ ] `category_id` is UUID selector, references asset_categories
- [ ] `location_id` is UUID selector
- [ ] `vendor_id` is UUID selector
- [ ] `status` uses correct enum: active, under_maintenance, retired, transferred, disposed
- [ ] `purchase_price` is number field
- [ ] `purchase_date` and `warranty_expiration` are date fields
- [ ] `expected_lifespan_years` is integer
- [ ] `qr_code` is text field (unique per tenant)

### B3: Audit assets-vendors.ts validation

**File**: `src/lib/validations/assets-vendors.ts`

### B4: Audit assets API routes

**Files**:
- `src/app/api/assets/route.ts`
- `src/app/api/assets/[id]/route.ts`
- `src/app/api/assets/[id]/transfer/route.ts`
- `src/app/api/assets/qr/[code]/route.ts`

### B5: Audit asset.dao.ts

**File**: `src/dao/asset.dao.ts`

### B6: Audit asset.service.ts

**File**: `src/services/asset.service.ts`

### B7: Fix Asset Issues

---

## TASK GROUP C: VENDORS MODULE AUDIT

### C1: Schema Reference - vendors table

```sql
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
```

### C2: Audit vendor-form.tsx

**File**: `src/components/vendors/vendor-form.tsx`

**Checklist**:
- [ ] `service_categories` is array of strings (TEXT[])
- [ ] `is_preferred` is boolean
- [ ] `contract_start_date`, `contract_expiration`, `insurance_expiration` are DATE
- [ ] `insurance_minimum_required` is DECIMAL(10,2)
- [ ] `hourly_rate` is DECIMAL(8,2)
- [ ] `is_active` is boolean
- [ ] No fields that don't exist in schema

### C3-C6: Audit validation, API, DAO, service

### C7: Fix Vendor Issues

---

## TASK GROUP D: LOCATIONS MODULE AUDIT

### D1: Schema Reference - locations table

```sql
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
  manager_id UUID REFERENCES users(id),
  emergency_contact_phone TEXT,
  status location_status DEFAULT 'active',  -- ENUM: active, temporarily_closed, permanently_closed
  opened_date DATE,
  closed_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### D2: Audit location-form.tsx

**File**: `src/components/locations/location-form.tsx`

**Checklist**:
- [ ] `manager_id` is UUID selector referencing users
- [ ] `status` uses correct enum: active, temporarily_closed, permanently_closed
- [ ] `square_footage` is INT, not string
- [ ] `opened_date`, `closed_date` are DATE
- [ ] No hallucinated fields (e.g., `country`, `region` don't exist)

### D3-D6: Audit validation, API, DAO, service

### D7: Fix Location Issues

---

## TASK GROUP E: COMPLIANCE MODULE AUDIT

### E1: Schema Reference - compliance_documents table

```sql
CREATE TABLE compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  document_type_id UUID REFERENCES compliance_document_types(id),
  location_id UUID REFERENCES locations(id),
  location_ids UUID[],  -- For multi-location documents
  issue_date DATE,
  expiration_date DATE,
  issuing_authority TEXT,
  document_number TEXT,
  file_path TEXT,
  status compliance_status DEFAULT 'active',  -- ENUM: active, expiring_soon, expired, pending_renewal, conditional, failed_inspection, suspended
  is_conditional BOOLEAN DEFAULT false,
  conditional_requirements TEXT,
  conditional_deadline DATE,
  renewal_submitted_date DATE,
  renewal_cost DECIMAL(10,2),
  renewal_assigned_to UUID REFERENCES users(id),
  failed_inspection_date DATE,
  corrective_action_required TEXT,
  reinspection_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### E2: Audit compliance-form.tsx

**File**: `src/components/compliance/compliance-form.tsx`

**Checklist**:
- [ ] `document_type_id` references compliance_document_types
- [ ] `location_id` is single location reference
- [ ] `location_ids` is array for multi-location documents
- [ ] `status` uses all 7 enum values correctly
- [ ] `is_conditional` is boolean
- [ ] `renewal_assigned_to` is UUID referencing users
- [ ] All date fields are DATE type
- [ ] `renewal_cost` is DECIMAL(10,2)

### E3-E6: Audit validation, API, DAO, service

### E7: Fix Compliance Issues

---

## TASK GROUP F: PM MODULE AUDIT

### F1: Schema Reference - pm_schedules & pm_templates

```sql
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

CREATE TABLE pm_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id UUID REFERENCES pm_templates(id),
  name TEXT NOT NULL,
  description TEXT,
  asset_id UUID REFERENCES assets(id),
  location_id UUID REFERENCES locations(id),
  frequency pm_frequency NOT NULL,  -- ENUM: daily, weekly, biweekly, monthly, quarterly, semi_annually, annually
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
```

### F2: Audit pm-schedule-form.tsx

**File**: `src/components/pm/pm-schedule-form.tsx`

**Checklist**:
- [ ] `frequency` uses correct enum: daily, weekly, biweekly, monthly, quarterly, semi_annually, annually
- [ ] `day_of_week` is INT 0-6 (not string, not "Sunday", etc.)
- [ ] `day_of_month` is INT 1-31
- [ ] `month_of_year` is INT 1-12
- [ ] `template_id` is UUID referencing pm_templates
- [ ] `checklist` is JSONB (proper JSON structure)
- [ ] `estimated_duration_hours` is DECIMAL(4,2)
- [ ] `estimated_cost` is DECIMAL(10,2)

### F3-F6: Audit validation, API, DAO, service

### F7: Fix PM Issues

---

## TASK GROUP G: USERS MODULE AUDIT

### G1: Schema Reference - users table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  auth_user_id UUID UNIQUE,  -- Links to Supabase Auth
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,  -- ENUM: super_admin, admin, manager, staff, vendor, readonly
  phone TEXT,
  location_id UUID REFERENCES locations(id),
  language_preference TEXT DEFAULT 'en' CHECK (language_preference IN ('en', 'es')),
  is_active BOOLEAN DEFAULT true,
  deactivated_at TIMESTAMPTZ,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(tenant_id, email)
);
```

### G2: Audit Users pages and API

**Files**:
- `src/app/(dashboard)/users/page.tsx`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/lib/validations/user.ts`
- `src/dao/user.dao.ts`
- `src/services/user.service.ts`

**Checklist**:
- [ ] `role` uses correct enum: super_admin, admin, manager, staff, vendor, readonly
- [ ] `language_preference` only allows 'en' or 'es'
- [ ] `notification_preferences` is JSONB with email, sms, push booleans
- [ ] `is_active` is boolean (not status enum)
- [ ] `deactivated_at` is set when is_active becomes false
- [ ] `auth_user_id` links to Supabase Auth

### G3: Fix User Issues

---

## TASK GROUP H: EMERGENCY MODULE AUDIT

### H1: Schema Reference - emergency_incidents & on_call_schedules

```sql
CREATE TABLE emergency_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  title TEXT NOT NULL,
  description TEXT,
  severity incident_severity NOT NULL,  -- ENUM: high, critical (only 2 values!)
  status incident_status DEFAULT 'active',  -- ENUM: active, contained, resolved
  reported_by UUID REFERENCES users(id),
  reported_at TIMESTAMPTZ DEFAULT now(),
  contained_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

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
```

### H2: Audit Emergency pages and API

**CRITICAL**: `severity` only has 2 values: high, critical
- NOT: low, medium, high, critical
- The schema does NOT include 'medium' or 'low'

**CRITICAL**: `incident_type` does NOT exist in schema!
- If any code references `incident_type`, it's hallucinated
- The schema has: title, description, severity, status

### H3: Fix Emergency Issues

---

## TASK GROUP I: BUDGETS MODULE AUDIT

### I1: Schema Reference - budgets table

```sql
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
  UNIQUE(tenant_id, location_id, category, fiscal_year)
);
```

### I2: Audit Budgets page and API

**Files**:
- `src/app/(dashboard)/budgets/page.tsx`
- `src/app/api/budgets/route.ts`
- `src/app/api/budgets/[id]/route.ts`
- `src/dao/budget.dao.ts`
- `src/services/budget.service.ts`

**Checklist**:
- [ ] `fiscal_year` is INT
- [ ] `annual_budget` is DECIMAL(12,2)
- [ ] `spent_amount` is DECIMAL(12,2)
- [ ] Unique constraint enforced: tenant_id + location_id + category + fiscal_year
- [ ] No hallucinated fields like `monthly_budget`, `quarterly_budget`

### I3: Fix Budget Issues

---

## TASK GROUP J: RELATED TABLES AUDIT

### J1: ticket_categories

```sql
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
```

### J2: asset_categories

```sql
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
```

### J3: compliance_document_types

```sql
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
```

### J4: Audit category DAOs and forms

---

## TASK GROUP K: CROSS-CUTTING CONCERNS

### K1: Verify tenant_id in ALL DAOs

Every DAO must:
1. Filter by tenant_id on all queries
2. Include tenant_id on all inserts
3. Never allow cross-tenant data access

### K2: Verify soft deletes everywhere

Every delete operation must:
1. Set `deleted_at = now()` instead of DELETE
2. Filter `deleted_at IS NULL` on all queries

### K3: Verify enum consistency

Create a reference document mapping all enums:

```typescript
// Enums must match schema EXACTLY
export const TICKET_STATUS = ['submitted', 'acknowledged', 'needs_approval', 'approved', 'in_progress', 'completed', 'verified', 'closed', 'rejected', 'on_hold'] as const
export const TICKET_PRIORITY = ['low', 'medium', 'high', 'critical'] as const
export const ASSET_STATUS = ['active', 'under_maintenance', 'retired', 'transferred', 'disposed'] as const
export const LOCATION_STATUS = ['active', 'temporarily_closed', 'permanently_closed'] as const
export const COMPLIANCE_STATUS = ['active', 'expiring_soon', 'expired', 'pending_renewal', 'conditional', 'failed_inspection', 'suspended'] as const
export const INCIDENT_SEVERITY = ['high', 'critical'] as const  // Only 2!
export const INCIDENT_STATUS = ['active', 'contained', 'resolved'] as const
export const PM_FREQUENCY = ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually'] as const
export const USER_ROLE = ['super_admin', 'admin', 'manager', 'staff', 'vendor', 'readonly'] as const
```

### K4: Verify type definitions

**File**: `src/types/` or `src/types/database.ts`

Ensure TypeScript types match schema exactly.

---

## MANDATORY VALIDATION (CRITICAL - READ EVERY ITERATION)

### After EVERY File Fix

**MANDATORY**: After modifying ANY file, run:

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"
npm run type-check
```

- If type-check fails, FIX IMMEDIATELY before moving to next file
- Do NOT accumulate errors across multiple files
- Do NOT skip this step

### After Completing Each Task Group (A-K)

**MANDATORY**: Run full validation suite:

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"
npm run type-check && npm run lint && npm run build
```

- ALL THREE must pass before proceeding to next task group
- Document results in `.claude/progress.md`:
  ```
  ## Task Group [X] Validation
  - type-check: PASS/FAIL
  - lint: PASS/FAIL
  - build: PASS/FAIL
  - Errors fixed: [count]
  ```

### Before Outputting Completion Promise

**MANDATORY**: Final validation gate:

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"

# Must ALL pass
npm run type-check
npm run lint
npm run build

# Verify no TypeScript errors in key files
npx tsc --noEmit 2>&1 | head -20
```

Only output `<promise>PHASE_8_DEEP_REVIEW_COMPLETE</promise>` if ALL pass with zero errors.

### Lint Rules to Enforce

Common lint issues to watch for:
- `@typescript-eslint/no-unused-vars` - Remove unused imports/variables
- `@typescript-eslint/no-explicit-any` - Add proper types
- `react-hooks/exhaustive-deps` - Fix dependency arrays
- `@next/next/no-img-element` - Use Next.js Image component

---

## ISSUE TRACKING FORMAT

For each issue found, document in `.claude/audit-issues.md`:

```markdown
## [MODULE] - [SEVERITY]

**File**: path/to/file.tsx
**Line**: 42
**Issue**: Form field `incident_type` doesn't exist in schema
**Schema Reference**: emergency_incidents table has: title, description, severity, status
**Fix**: Remove `incident_type` field, use `title` instead

**Status**: [ ] Found [ ] Fixed [ ] Verified
```

---

## COMPLETION CRITERIA

All of the following must be true:

### Page Audit Completion (ALL 44 pages audited)

**Auth Pages (5)**
- [ ] Login page
- [ ] Signup page
- [ ] Forgot Password page
- [ ] Reset Password page
- [ ] Verify Email page

**Dashboard Pages (3)**
- [ ] Dashboard Home (redirect)
- [ ] Dashboard Main
- [ ] Reports page

**Tickets Pages (3)**
- [ ] Ticket List
- [ ] Ticket Detail
- [ ] New Ticket

**Assets Pages (5)**
- [ ] Asset List
- [ ] Asset Detail
- [ ] New Asset
- [ ] Edit Asset
- [ ] Scan Asset

**Vendors Pages (4)**
- [ ] Vendor List
- [ ] Vendor Detail
- [ ] New Vendor
- [ ] Edit Vendor

**Locations Pages (3)**
- [ ] Location List
- [ ] Location Detail
- [ ] New Location

**Compliance Pages (4)**
- [ ] Compliance List
- [ ] Compliance Detail
- [ ] New Compliance
- [ ] Edit Compliance

**PM Pages (7)**
- [ ] PM Schedule List
- [ ] PM Schedule Detail
- [ ] New PM Schedule
- [ ] Edit PM Schedule
- [ ] PM Templates List
- [ ] New PM Template
- [ ] PM Template Detail

**Users Page (1)**
- [ ] Users List

**Emergency Pages (3)**
- [ ] Emergency List
- [ ] Emergency Detail
- [ ] New Emergency

**Budgets Page (1)**
- [ ] Budgets page

**Approvals Page (1)**
- [ ] Approvals page

**Settings Pages (5)**
- [ ] Settings Hub
- [ ] Profile
- [ ] Notifications
- [ ] Categories
- [ ] Tenant

**Public Pages (1)**
- [ ] Accept Invite

### Schema Alignment (Manual Verification)
1. [ ] ALL form fields map to actual database columns
2. [ ] ALL Zod validation schemas match database constraints
3. [ ] ALL API routes use correct column names
4. [ ] ALL DAOs query existing columns only
5. [ ] ALL enum values match schema definitions exactly
6. [ ] ALL UUIDs are properly validated
7. [ ] ALL decimal/number fields have correct precision
8. [ ] ALL date fields use correct types (DATE vs TIMESTAMPTZ)
9. [ ] ALL tenant_id filtering is in place
10. [ ] ALL soft deletes use deleted_at

### Build Validation (MUST PASS - Zero Errors)
11. [ ] `npm run type-check` passes with 0 errors
12. [ ] `npm run lint` passes with 0 errors (warnings OK)
13. [ ] `npm run build` passes successfully

### Runtime Verification
14. [ ] No runtime errors when testing each form in browser

---

## RALPH LOOP CONFIGURATION

### Completion Promise

When ALL completion criteria are met:

```
<promise>PHASE_8_DEEP_REVIEW_COMPLETE</promise>
```

### Command to Run

```bash
/ralph-wiggum:ralph-loop "Execute the deep review spec from .claude/ralph-loops/phase-8-deep-review.md" --completion-promise "PHASE_8_DEEP_REVIEW_COMPLETE" --max-iterations 100
```

**Note**: 100 iterations accounts for 44 pages + DAOs + Services + APIs + validations + fixes

### Workflow Per Iteration

1. **Start**: Read `.claude/progress.md` for current state
2. **Pick**: Select next task from incomplete task groups (A → K)
3. **Read**: Read the source file(s) to audit
4. **Compare**: Compare to schema reference in this spec
5. **Document**: Add any issues to `.claude/audit-issues.md`
6. **Fix**: Fix each issue ONE FILE AT A TIME
7. **Validate After Each File** (MANDATORY):
   ```bash
   cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"
   npm run type-check
   ```
   - If fails: Fix errors immediately before touching next file
8. **After Task Group Complete** (MANDATORY):
   ```bash
   npm run type-check && npm run lint && npm run build
   ```
   - ALL must pass before moving to next task group
9. **Update**: Update `.claude/progress.md` with validation results
10. **Commit**: `git add -A && git commit -m "audit(phase8): [description]"`

### Context Management

**At START of each iteration:**
```bash
cat .claude/progress.md | head -50
cat .claude/audit-issues.md 2>/dev/null | tail -30
```

**At END of each iteration:**
Update `.claude/progress.md` with:
- Current task group and subtask
- Issues found this iteration
- Fixes applied
- Validation results
- Next action

---

## IMPORTANT NOTES

1. **Read schema FIRST** before auditing any code
2. **Document ALL issues** before fixing (creates audit trail)
3. **Fix one file at a time** and validate
4. **Don't assume** - always verify against migration file
5. **Pay attention to enums** - they're a common source of bugs
6. **incident_type does NOT exist** - this is a known hallucination
7. **incident_severity only has 2 values** (high, critical)
8. **Test forms in browser** after fixes

---

## QUICK REFERENCE: Common Hallucinations to Watch For

These columns/fields DO NOT exist in the schema:

| Module | Hallucinated Field | Actual Alternative |
|--------|-------------------|-------------------|
| Emergency | `incident_type` | Use `title` + `description` |
| Emergency | `severity: 'low'` or `'medium'` | Only `high` or `critical` |
| Asset | `condition` | Use `status` |
| Location | `country`, `region` | Only: address, city, state, zip |
| Ticket | `urgency` | Use `priority` |
| Ticket | `type` | Use `category_id` |
| User | `first_name`, `last_name` | Use `full_name` |
| User | `status` | Use `is_active` boolean |
| Budget | `monthly_budget` | Use `annual_budget` only |
| PM | `frequency: 'yearly'` | Use `annually` |
