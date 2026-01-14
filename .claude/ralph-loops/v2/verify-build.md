# MHG Facilities - Build Verification Loop

## CRITICAL LOOP INSTRUCTIONS

**YOU ARE IN A RALPH LOOP. FOLLOW THESE RULES:**

1. **NEVER say "the next iteration will..."** - Keep working NOW
2. **NEVER end with a summary** - Summaries signal completion
3. **NEVER output the promise until ALL verification tasks pass**
4. **If you find a missing feature, IMPLEMENT IT before continuing**
5. **Run validation after every fix**

---

## Project Directory

**IMPORTANT**: All paths relative to `mhg-facilities/`. Run: `cd mhg-facilities`

---

## Purpose

This loop verifies the build against:
1. The original plan (`facilities-management-plan-v2.md`)
2. The actual database schema (`supabase/migrations/*.sql`)
3. The folder structure specified in the plan

It identifies GAPS and FIXES them.

---

## VERIFICATION TASK 1: Schema Alignment

### 1.1: Document All Tables from Migration

Run these commands and record each table:

```bash
cd mhg-facilities
grep "CREATE TABLE" supabase/migrations/*.sql | grep -v "^--"
```

Expected tables from plan:
- [ ] tenants
- [ ] users
- [ ] locations
- [ ] tickets
- [ ] ticket_categories
- [ ] ticket_comments
- [ ] ticket_attachments
- [ ] ticket_status_history
- [ ] assets
- [ ] asset_categories
- [ ] asset_transfers
- [ ] vendors
- [ ] vendor_contacts
- [ ] vendor_ratings
- [ ] compliance_document_types
- [ ] compliance_documents
- [ ] compliance_document_versions
- [ ] compliance_alerts
- [ ] pm_templates
- [ ] pm_schedules
- [ ] pm_completions
- [ ] budgets
- [ ] invitations
- [ ] on_call_schedules (optional)
- [ ] emergencies (optional)

### 1.2: Document All Enums

```bash
grep "CREATE TYPE" supabase/migrations/*.sql
```

Expected enums:
- [ ] user_role
- [ ] ticket_status
- [ ] ticket_priority
- [ ] location_status
- [ ] asset_status
- [ ] vendor_status
- [ ] compliance_status
- [ ] pm_frequency

### 1.3: Verify DAOs Match Schema

For EACH table, verify a corresponding DAO exists:

```bash
ls src/dao/
```

**Gap Detection:**
- If DAO missing for a table → Create it
- If DAO has wrong column names → Fix it

---

## VERIFICATION TASK 2: DAO Layer Completeness

### Check each DAO exists and has correct methods:

| Table | DAO File | Status |
|-------|----------|--------|
| tenants | tenant.dao.ts | [ ] |
| users | user.dao.ts | [ ] |
| locations | location.dao.ts | [ ] |
| tickets | ticket.dao.ts | [ ] |
| ticket_categories | ticket-category.dao.ts | [ ] |
| ticket_comments | ticket-comment.dao.ts | [ ] |
| ticket_attachments | ticket-attachment.dao.ts | [ ] |
| assets | asset.dao.ts | [ ] |
| asset_categories | asset-category.dao.ts | [ ] |
| vendors | vendor.dao.ts | [ ] |
| vendor_contacts | vendor-contact.dao.ts | [ ] |
| compliance_document_types | compliance-document-type.dao.ts | [ ] |
| compliance_documents | compliance-document.dao.ts | [ ] |
| pm_templates | pm-template.dao.ts | [ ] |
| pm_schedules | pm-schedule.dao.ts | [ ] |
| budgets | budget.dao.ts | [ ] |

### Verification Command:

```bash
for dao in tenant user location ticket ticket-category ticket-comment ticket-attachment asset asset-category vendor vendor-contact compliance-document-type compliance-document pm-template pm-schedule budget; do
  if [ -f "src/dao/${dao}.dao.ts" ]; then
    echo "✅ ${dao}.dao.ts exists"
  else
    echo "❌ ${dao}.dao.ts MISSING"
  fi
done
```

**If any are missing, CREATE THEM following the BaseDAO pattern.**

---

## VERIFICATION TASK 3: Service Layer Completeness

### Check each Service exists:

| Entity | Service File | Status |
|--------|--------------|--------|
| Tenant | tenant.service.ts | [ ] |
| User | user.service.ts | [ ] |
| Location | location.service.ts | [ ] |
| Ticket | ticket.service.ts | [ ] |
| TicketCategory | ticket-category.service.ts | [ ] |
| Asset | asset.service.ts | [ ] |
| AssetCategory | asset-category.service.ts | [ ] |
| Vendor | vendor.service.ts | [ ] |
| Compliance | compliance-document.service.ts | [ ] |
| ComplianceType | compliance-document-type.service.ts | [ ] |
| PM Template | pm-template.service.ts | [ ] |
| PM Schedule | pm-schedule.service.ts | [ ] |
| Budget | budget.service.ts | [ ] |
| Dashboard | dashboard.service.ts | [ ] |
| Report | report.service.ts | [ ] |
| Invitation | invitation.service.ts | [ ] |

### Verification Command:

```bash
for svc in tenant user location ticket ticket-category asset asset-category vendor compliance-document compliance-document-type pm-template pm-schedule budget dashboard report invitation; do
  if [ -f "src/services/${svc}.service.ts" ]; then
    echo "✅ ${svc}.service.ts exists"
  else
    echo "❌ ${svc}.service.ts MISSING"
  fi
done
```

**If any are missing, CREATE THEM using the appropriate DAOs.**

---

## VERIFICATION TASK 4: API Routes Completeness

### Required API Routes (from plan):

```
src/app/api/
├── auth/
│   ├── me/route.ts
│   └── session/route.ts
├── tickets/
│   ├── route.ts
│   └── [id]/route.ts
├── ticket-categories/
│   ├── route.ts
│   └── [id]/route.ts
├── assets/
│   ├── route.ts
│   └── [id]/route.ts
├── asset-categories/
│   ├── route.ts
│   └── [id]/route.ts
├── vendors/
│   ├── route.ts
│   └── [id]/route.ts
├── compliance/
│   ├── route.ts
│   └── [id]/route.ts
├── compliance-document-types/
│   ├── route.ts
│   └── [id]/route.ts
├── pm-templates/
│   ├── route.ts
│   └── [id]/route.ts
├── pm/
│   ├── route.ts
│   └── [id]/route.ts
├── locations/
│   ├── route.ts
│   └── [id]/route.ts
├── users/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── [id]/deactivate/route.ts
├── invitations/
│   ├── route.ts
│   └── [token]/route.ts
├── budgets/
│   ├── route.ts
│   └── [id]/route.ts
├── dashboard/
│   ├── overview/route.ts
│   ├── tickets/route.ts
│   ├── assets/route.ts
│   ├── compliance/route.ts
│   ├── pm/route.ts
│   └── activity/route.ts
├── reports/
│   ├── tickets/route.ts
│   ├── assets/route.ts
│   ├── vendors/route.ts
│   ├── compliance/route.ts
│   ├── pm/route.ts
│   ├── budget/route.ts
│   └── export/route.ts
└── cron/
    ├── compliance-alerts/route.ts
    └── pm-generate/route.ts
```

### Verification Command:

```bash
echo "=== Checking API routes ==="
routes=(
  "auth/me"
  "auth/session"
  "tickets"
  "tickets/[id]"
  "ticket-categories"
  "ticket-categories/[id]"
  "assets"
  "assets/[id]"
  "asset-categories"
  "asset-categories/[id]"
  "vendors"
  "vendors/[id]"
  "compliance"
  "compliance/[id]"
  "compliance-document-types"
  "compliance-document-types/[id]"
  "pm-templates"
  "pm-templates/[id]"
  "pm"
  "pm/[id]"
  "locations"
  "locations/[id]"
  "users"
  "users/[id]"
  "invitations"
  "budgets"
  "budgets/[id]"
  "dashboard/overview"
  "dashboard/tickets"
  "dashboard/assets"
  "dashboard/compliance"
  "dashboard/pm"
  "dashboard/activity"
  "reports/tickets"
  "reports/assets"
  "reports/vendors"
  "reports/compliance"
  "reports/pm"
  "reports/budget"
  "reports/export"
  "cron/compliance-alerts"
  "cron/pm-generate"
)

for route in "${routes[@]}"; do
  if [ -f "src/app/api/${route}/route.ts" ]; then
    echo "✅ api/${route}/route.ts"
  else
    echo "❌ api/${route}/route.ts MISSING"
  fi
done
```

**If any are missing, CREATE THEM using the corresponding Service.**

---

## VERIFICATION TASK 5: Page Completeness

### Required Pages (from plan folder structure):

```
src/app/(dashboard)/
├── page.tsx (dashboard home)
├── tickets/
│   ├── page.tsx
│   ├── new/page.tsx
│   └── [id]/page.tsx
├── assets/
│   ├── page.tsx
│   ├── scan/page.tsx
│   └── [id]/page.tsx
├── compliance/
│   ├── page.tsx
│   └── [id]/page.tsx
├── pm/
│   ├── page.tsx
│   └── calendar/page.tsx
├── vendors/
│   ├── page.tsx
│   └── [id]/page.tsx
├── budgets/
│   └── page.tsx
├── reports/
│   └── page.tsx
├── locations/
│   ├── page.tsx
│   └── [id]/page.tsx
├── users/
│   └── page.tsx
└── settings/
    ├── page.tsx
    ├── profile/page.tsx
    ├── tenant/page.tsx
    ├── notifications/page.tsx
    └── categories/page.tsx
```

### Verification Command:

```bash
echo "=== Checking Pages ==="
pages=(
  "(dashboard)/page.tsx"
  "(dashboard)/tickets/page.tsx"
  "(dashboard)/tickets/new/page.tsx"
  "(dashboard)/tickets/[id]/page.tsx"
  "(dashboard)/assets/page.tsx"
  "(dashboard)/assets/[id]/page.tsx"
  "(dashboard)/compliance/page.tsx"
  "(dashboard)/compliance/[id]/page.tsx"
  "(dashboard)/pm/page.tsx"
  "(dashboard)/vendors/page.tsx"
  "(dashboard)/vendors/[id]/page.tsx"
  "(dashboard)/budgets/page.tsx"
  "(dashboard)/reports/page.tsx"
  "(dashboard)/locations/page.tsx"
  "(dashboard)/locations/[id]/page.tsx"
  "(dashboard)/users/page.tsx"
  "(dashboard)/settings/page.tsx"
  "(dashboard)/settings/profile/page.tsx"
)

for page in "${pages[@]}"; do
  if [ -f "src/app/${page}" ]; then
    echo "✅ ${page}"
  else
    echo "❌ ${page} MISSING"
  fi
done
```

**If any are missing, CREATE THEM with basic scaffolding.**

---

## VERIFICATION TASK 6: Component Completeness

### Required Components (from plan):

```
src/components/
├── tickets/
│   ├── ticket-form.tsx
│   ├── ticket-list.tsx
│   ├── ticket-detail.tsx
│   ├── ticket-status-badge.tsx
│   └── duplicate-warning.tsx
├── assets/
│   ├── asset-form.tsx
│   ├── asset-list.tsx
│   └── warranty-banner.tsx
├── compliance/
│   ├── document-form.tsx
│   ├── expiration-calendar.tsx
│   └── status-badge.tsx
├── vendors/
│   ├── vendor-form.tsx
│   └── vendor-list.tsx
├── pm/
│   ├── pm-schedule-form.tsx
│   └── pm-calendar.tsx
├── dashboard/
│   ├── stat-card.tsx
│   ├── ticket-trend-chart.tsx
│   ├── status-pie-chart.tsx
│   ├── priority-bar-chart.tsx
│   └── activity-feed.tsx
├── reports/
│   ├── report-filters.tsx
│   ├── date-range-picker.tsx
│   ├── report-table.tsx
│   └── export-button.tsx
├── settings/
│   ├── tenant-settings-form.tsx
│   ├── notification-preferences.tsx
│   └── category-manager.tsx
├── locations/
│   └── location-form.tsx
├── users/
│   ├── invite-user-modal.tsx
│   └── edit-user-modal.tsx
├── layout/
│   ├── sidebar.tsx
│   ├── header.tsx
│   ├── mobile-nav.tsx
│   └── mobile-bottom-nav.tsx
├── auth/
│   └── require-role.tsx
├── ui/
│   ├── empty-state.tsx
│   └── skeleton-loaders.tsx
├── error/
│   └── error-boundary.tsx
└── onboarding/
    └── onboarding-wizard.tsx
```

### Verification Command:

```bash
echo "=== Checking Components ==="
components=(
  "tickets/ticket-form.tsx"
  "tickets/ticket-list.tsx"
  "tickets/ticket-status-badge.tsx"
  "assets/asset-form.tsx"
  "assets/asset-list.tsx"
  "compliance/status-badge.tsx"
  "vendors/vendor-form.tsx"
  "pm/pm-schedule-form.tsx"
  "dashboard/stat-card.tsx"
  "dashboard/activity-feed.tsx"
  "reports/report-filters.tsx"
  "reports/export-button.tsx"
  "locations/location-form.tsx"
  "users/invite-user-modal.tsx"
  "layout/sidebar.tsx"
  "layout/header.tsx"
  "layout/mobile-nav.tsx"
  "auth/require-role.tsx"
  "ui/empty-state.tsx"
)

for comp in "${components[@]}"; do
  if [ -f "src/components/${comp}" ]; then
    echo "✅ ${comp}"
  else
    echo "❌ ${comp} MISSING"
  fi
done
```

**If any critical components are missing, CREATE THEM.**

---

## VERIFICATION TASK 7: Hooks Completeness

### Required Hooks:

```bash
ls src/hooks/
```

Expected:
- [ ] use-auth.ts
- [ ] use-tickets.ts
- [ ] use-assets.ts
- [ ] use-vendors.ts
- [ ] use-compliance.ts
- [ ] use-pm.ts
- [ ] use-locations.ts
- [ ] use-users.ts
- [ ] use-dashboard.ts
- [ ] use-reports.ts

**If any are missing, CREATE THEM using TanStack Query pattern.**

---

## VERIFICATION TASK 8: Validation Schemas

### Required Zod Schemas:

```bash
ls src/lib/validations/
```

Expected:
- [ ] ticket.ts
- [ ] asset.ts
- [ ] vendor.ts
- [ ] compliance.ts (or compliance-pm.ts)
- [ ] location.ts
- [ ] user.ts
- [ ] budget.ts

**If any are missing, CREATE THEM based on schema.**

---

## VERIFICATION TASK 9: Core Features from Plan

### 9.1: Ticket Features

Check these features are implemented:

- [ ] Ticket creation with photos
- [ ] Ticket status workflow (submitted → acknowledged → in_progress → completed → verified → closed)
- [ ] Ticket assignment
- [ ] Ticket comments
- [ ] Ticket attachments
- [ ] Priority levels (low, medium, high, critical)
- [ ] Cost tracking on tickets
- [ ] Cost approval workflow

### 9.2: Asset Features

- [ ] Asset CRUD
- [ ] Asset categories
- [ ] Asset transfer between locations
- [ ] Warranty tracking
- [ ] QR code generation (optional)

### 9.3: Vendor Features

- [ ] Vendor CRUD
- [ ] Vendor contacts
- [ ] Vendor ratings
- [ ] Link vendors to tickets

### 9.4: Compliance Features

- [ ] Compliance document types
- [ ] Compliance documents with expiration
- [ ] Status tracking (active, expiring_soon, expired, etc.)
- [ ] Expiration alerts (cron job)

### 9.5: PM Features

- [ ] PM templates
- [ ] PM schedules with frequency
- [ ] PM ticket generation (cron job)

### 9.6: Dashboard Features

- [ ] Overview stats
- [ ] Charts (recharts)
- [ ] Activity feed

### 9.7: Reports Features

- [ ] Report filtering
- [ ] CSV export

---

## VERIFICATION TASK 10: Final Build Test

```bash
npm run type-check
npm run lint
npm run build
```

ALL THREE MUST PASS.

---

## Gap Resolution Process

When you find a gap:

1. **Identify the missing piece** (DAO, Service, Route, Page, Component)
2. **Check the schema** for that entity
   ```bash
   grep "CREATE TABLE entity_name" supabase/migrations/*.sql -A 30
   ```
3. **Create the missing file** following existing patterns
4. **Run validation**
   ```bash
   npm run type-check && npm run lint
   ```
5. **Continue to next verification task**

---

## Completion Criteria

ALL of these must be true:

1. [ ] All DAOs exist for all tables
2. [ ] All Services exist
3. [ ] All API routes exist
4. [ ] All pages exist
5. [ ] Critical components exist
6. [ ] All hooks exist
7. [ ] All validation schemas exist
8. [ ] `npm run type-check` passes
9. [ ] `npm run lint` passes
10. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>BUILD_VERIFIED</promise>
```

---

## START HERE

1. Run Task 1 (Schema Alignment) - document all tables
2. Run Task 2 (DAO Verification) - check/create DAOs
3. Run Task 3 (Service Verification) - check/create Services
4. Run Task 4 (API Route Verification) - check/create routes
5. Run Task 5 (Page Verification) - check/create pages
6. Run Task 6 (Component Verification) - check/create components
7. Run Task 7 (Hooks Verification) - check/create hooks
8. Run Task 8 (Validation Verification) - check/create schemas
9. Run Task 9 (Feature Verification) - spot check features
10. Run Task 10 (Final Build) - must pass

**FIX GAPS AS YOU FIND THEM. DO NOT JUST REPORT THEM.**
