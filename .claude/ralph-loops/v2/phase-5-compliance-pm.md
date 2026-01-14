# Phase 5: Compliance & Preventive Maintenance (v2)

## CRITICAL LOOP INSTRUCTIONS

**YOU ARE IN A RALPH LOOP. FOLLOW THESE RULES:**

1. **NEVER say "the next iteration will..."** - Keep working NOW
2. **NEVER end with a summary** - Summaries signal completion
3. **NEVER output the promise until ALL tasks pass validation**
4. **NEVER hallucinate column names** - Always verify from schema first

---

## Project Directory

**IMPORTANT**: All paths relative to `mhg-facilities/`. Run: `cd mhg-facilities`

---

## Prerequisites

- Phases 1-4 completed
- Tickets, Assets, Vendors working

---

## PHASE 0: MANDATORY SCHEMA DISCOVERY

### Step 0.1: Read Compliance Tables
```bash
cd mhg-facilities

# Compliance document types
grep "CREATE TABLE compliance_document_types" supabase/migrations/*.sql -A 15

# Compliance documents
grep "CREATE TABLE compliance_documents" supabase/migrations/*.sql -A 35

# Compliance alerts (audit table)
grep "CREATE TABLE compliance_alerts" supabase/migrations/*.sql -A 12

# Compliance document versions (audit table)
grep "CREATE TABLE compliance_document_versions" supabase/migrations/*.sql -A 10
```

### Step 0.2: Read PM Tables
```bash
# PM templates
grep "CREATE TABLE pm_templates" supabase/migrations/*.sql -A 12

# PM schedules
grep "CREATE TABLE pm_schedules" supabase/migrations/*.sql -A 25

# PM completions (audit table)
grep "CREATE TABLE pm_completions" supabase/migrations/*.sql -A 12
```

### Step 0.3: Read Enums
```bash
grep "CREATE TYPE compliance_status" supabase/migrations/*.sql -A 10
grep "CREATE TYPE pm_frequency" supabase/migrations/*.sql -A 10
```

### Step 0.4: Document Schema

```markdown
## Compliance Document Types
- id: UUID
- tenant_id: UUID
- name: TEXT
- name_es: TEXT | null
- description: TEXT | null
- default_alert_days: INT[] (default '{90, 60, 30, 14, 7}')
- renewal_checklist: JSONB | null
- is_location_specific: BOOLEAN
- created_at, deleted_at

## Compliance Documents
- id: UUID
- tenant_id: UUID
- name: TEXT
- document_type_id: UUID (FK compliance_document_types)
- location_id: UUID | null (FK locations)
- location_ids: UUID[] | null (for multi-location docs)
- issue_date: DATE | null
- expiration_date: DATE | null
- issuing_authority: TEXT | null
- document_number: TEXT | null
- file_path: TEXT | null
- status: compliance_status (7 values!)
- is_conditional: BOOLEAN
- conditional_requirements: TEXT | null
- conditional_deadline: DATE | null
- renewal_submitted_date: DATE | null
- renewal_cost: DECIMAL | null
- renewal_assigned_to: UUID | null
- failed_inspection_date: DATE | null
- corrective_action_required: TEXT | null
- reinspection_date: DATE | null
- notes: TEXT | null
- created_at, updated_at, deleted_at

## Compliance Status Values (EXACT)
'active', 'expiring_soon', 'expired', 'pending_renewal',
'conditional', 'failed_inspection', 'suspended'

## PM Schedules
- id: UUID
- tenant_id: UUID
- template_id: UUID | null (FK pm_templates)
- name: TEXT
- description: TEXT | null
- asset_id: UUID | null
- location_id: UUID | null
- frequency: pm_frequency
- day_of_week: INT (0-6) | null
- day_of_month: INT (1-31) | null
- month_of_year: INT (1-12) | null
- assigned_to: UUID | null
- vendor_id: UUID | null
- estimated_cost: DECIMAL | null
- is_active: BOOLEAN
- last_generated_at: TIMESTAMPTZ | null
- next_due_date: DATE | null
- created_at, updated_at, deleted_at

## PM Frequency Values (EXACT)
'daily', 'weekly', 'biweekly', 'monthly',
'quarterly', 'semi_annually', 'annually'
```

---

## Task 1: Compliance Document Type DAO & Service

### 1.1: Verify Schema
```bash
grep "CREATE TABLE compliance_document_types" supabase/migrations/*.sql -A 15
```

### 1.2: Create DAO

**File:** `src/dao/compliance-document-type.dao.ts`

### 1.3: Create Service

**File:** `src/services/compliance-document-type.service.ts`

---

## Task 2: Compliance Document DAO & Service

### 2.1: Create DAO

**File:** `src/dao/compliance-document.dao.ts`

**Methods:**
- `findByStatus(status)`
- `findByLocation(locationId)`
- `findExpiringSoon(days)` - Documents expiring within N days
- `findExpired()` - Past expiration date
- `findConditional()` - Conditional approvals
- `findFailedInspections()` - Failed inspections

### 2.2: Create Service

**File:** `src/services/compliance-document.service.ts`

**Features:**
- Status determination based on expiration date
- Expiration alerts at configurable intervals
- Conditional approval tracking
- Failed inspection workflow

---

## Task 3: PM Template DAO & Service

### 3.1: Create DAO

**File:** `src/dao/pm-template.dao.ts`

### 3.2: Create Service

**File:** `src/services/pm-template.service.ts`

---

## Task 4: PM Schedule DAO & Service

### 4.1: Create DAO

**File:** `src/dao/pm-schedule.dao.ts`

**Methods:**
- `findActive()` - Where is_active = true
- `findByAsset(assetId)`
- `findByLocation(locationId)`
- `findDueToday()` - next_due_date = today
- `findOverdue()` - next_due_date < today

### 4.2: Create Service

**File:** `src/services/pm-schedule.service.ts`

**Features:**
- Calculate next due date from frequency
- Generate work orders (tickets) from schedules
- Track completions

---

## Task 5: API Routes

### 5.1: Compliance Routes

**Files:**
- `src/app/api/compliance-document-types/route.ts`
- `src/app/api/compliance-document-types/[id]/route.ts`
- `src/app/api/compliance/route.ts`
- `src/app/api/compliance/[id]/route.ts`

### 5.2: PM Routes

**Files:**
- `src/app/api/pm-templates/route.ts`
- `src/app/api/pm-templates/[id]/route.ts`
- `src/app/api/pm/route.ts`
- `src/app/api/pm/[id]/route.ts`

---

## Task 6: Cron Jobs

### 6.1: Compliance Alerts Cron

**File:** `src/app/api/cron/compliance-alerts/route.ts`

**Triggers:** Daily at 9 AM UTC

**Logic:**
1. Find documents expiring within alert thresholds
2. Send notifications (email)
3. Log alerts sent

### 6.2: PM Generation Cron

**File:** `src/app/api/cron/pm-generate/route.ts`

**Triggers:** Daily at 6 AM UTC

**Logic:**
1. Find schedules due today
2. Create tickets for each
3. Update last_generated_at and next_due_date

### 6.3: Vercel Cron Config

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/compliance-alerts",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/pm-generate",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## Task 7: Validation Schemas

**File:** `src/lib/validations/compliance-pm.ts`

```typescript
export const complianceStatusSchema = z.enum([
  'active', 'expiring_soon', 'expired', 'pending_renewal',
  'conditional', 'failed_inspection', 'suspended'
])

export const pmFrequencySchema = z.enum([
  'daily', 'weekly', 'biweekly', 'monthly',
  'quarterly', 'semi_annually', 'annually'
])
```

---

## Task 8: Hooks

**Files:**
- `src/hooks/use-compliance.ts`
- `src/hooks/use-pm.ts`

---

## Task 9: Compliance UI Components

**Files:**
- `src/components/compliance/status-badge.tsx`
- `src/components/compliance/expiration-countdown.tsx`
- `src/components/compliance/conditional-banner.tsx`
- `src/components/compliance/failed-inspection-banner.tsx`
- `src/components/compliance/compliance-form.tsx`
- `src/components/compliance/compliance-calendar.tsx`

---

## Task 10: Compliance Pages

**Files:**
- `src/app/(dashboard)/compliance/page.tsx`
- `src/app/(dashboard)/compliance/[id]/page.tsx`

---

## Task 11: PM UI Components

**Files:**
- `src/components/pm/pm-schedule-form.tsx`
- `src/components/pm/pm-calendar.tsx`

---

## Task 12: PM Pages

**Files:**
- `src/app/(dashboard)/pm/page.tsx`
- `src/app/(dashboard)/pm/[id]/page.tsx`

---

## Validation After Each Task

```bash
npm run type-check  # MUST pass
npm run lint        # MUST pass
npm run build       # MUST pass
```

---

## Completion Criteria

1. [ ] Schema fully documented
2. [ ] Compliance document types CRUD works
3. [ ] Compliance documents with status tracking work
4. [ ] Expiration countdown displays correctly
5. [ ] Conditional/failed inspection banners show
6. [ ] Compliance calendar shows expiring docs
7. [ ] PM templates CRUD works
8. [ ] PM schedules with frequency calculation work
9. [ ] PM calendar shows scheduled tasks
10. [ ] Cron jobs configured
11. [ ] All forms validated
12. [ ] UI responsive
13. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>PHASE_5_COMPLETE</promise>
```

---

## START HERE

1. Run schema discovery (Phase 0) - **DO NOT SKIP**
2. Document all compliance and PM columns
3. Begin Task 1
4. Validate after each task
5. Continue until complete
