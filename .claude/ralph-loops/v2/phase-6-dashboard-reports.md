# Phase 6: Dashboard & Reports (v2)

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

- Phases 1-5 completed
- All core modules working (tickets, assets, vendors, compliance, PM)

---

## PHASE 0: MANDATORY SCHEMA DISCOVERY

### Step 0.1: Read Budgets Table
```bash
cd mhg-facilities

# Budgets table
grep "CREATE TABLE budgets" supabase/migrations/*.sql -A 18
```

### Step 0.2: Document Schema

```markdown
## Budgets Table
- id: UUID
- tenant_id: UUID
- location_id: UUID | null (FK locations)
- category: TEXT | null
- fiscal_year: INT
- annual_budget: DECIMAL(12,2)
- spent_amount: DECIMAL(12,2) (default 0)
- notes: TEXT | null
- created_at, updated_at, deleted_at

## Unique Constraint
UNIQUE(tenant_id, location_id, category, fiscal_year)
```

### Step 0.3: Verify Existing DAOs

Before creating services, confirm which DAOs already exist from previous phases:
```bash
ls src/dao/
```

Expected from previous phases:
- ticket.dao.ts
- asset.dao.ts
- vendor.dao.ts
- compliance-document.dao.ts
- pm-schedule.dao.ts
- location.dao.ts
- user.dao.ts

### Step 0.4: Check Existing Types
```bash
# Find stats types if any exist
grep "Stats\|Count" src/types/*.ts src/types/**/*.ts 2>/dev/null | head -30
```

---

## Anti-Hallucination Checklist

Before writing any query or type, verify:

- [ ] Column exists in migration file
- [ ] DAO methods match actual table columns
- [ ] Aggregate queries use correct column names
- [ ] Join conditions use correct foreign keys
- [ ] Type definitions match actual schema

---

## Task 1: Budget DAO & Service

### 1.1: Verify Schema
```bash
grep "CREATE TABLE budgets" supabase/migrations/*.sql -A 18
```

### 1.2: Create Budget DAO

**File:** `src/dao/budget.dao.ts`

**Behavior:**
- Standard CRUD operations
- Find by location and fiscal year
- Find by fiscal year (all locations)
- Aggregate total budget vs spent

### 1.3: Create Budget Service

**File:** `src/services/budget.service.ts`

**Behavior:**
- CRUD with tenant isolation
- Calculate utilization percentages
- Update spent_amount (called when tickets close with costs)

### 1.4: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 2: Dashboard Service

### 2.1: Create Dashboard Service

**File:** `src/services/dashboard.service.ts`

**Behavior:**
Uses existing DAOs (do NOT recreate them):
- Inject TicketDAO, AssetDAO, ComplianceDocumentDAO, PMScheduleDAO, LocationDAO
- Overview stats (counts from each module)
- Ticket stats (by status, priority, trend over time)
- Asset stats (by status, warranty expirations)
- Compliance stats (by status, upcoming expirations)
- PM stats (completion rate, overdue items)
- Recent activity aggregation

**Critical:** Do not duplicate DAO logic. Call existing DAO methods.

### 2.2: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 3: Dashboard API Routes

### 3.1: Create Routes

**Files:**
- `src/app/api/dashboard/overview/route.ts` - GET
- `src/app/api/dashboard/tickets/route.ts` - GET
- `src/app/api/dashboard/assets/route.ts` - GET
- `src/app/api/dashboard/compliance/route.ts` - GET
- `src/app/api/dashboard/pm/route.ts` - GET
- `src/app/api/dashboard/activity/route.ts` - GET

**Pattern:**
```typescript
// Each route follows this pattern
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/require-auth'
import { DashboardService } from '@/services/dashboard.service'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if ('error' in authResult) return authResult.error

  const service = new DashboardService()
  const data = await service.getSomeStats()
  return NextResponse.json(data)
}
```

### 3.2: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 4: Dashboard Hooks

**File:** `src/hooks/use-dashboard.ts`

**Behavior:**
- TanStack Query hooks for each dashboard endpoint
- Auto-refetch intervals for live data
- Error handling

### 4.1: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 5: Dashboard UI Components

### 5.1: Stat Card

**File:** `src/components/dashboard/stat-card.tsx`

**Props:**
- title: string
- value: number | string
- change?: number (percentage)
- trend?: 'up' | 'down' | 'neutral'
- icon?: ReactNode
- href?: string

**Styling:** Use theme colors only (bg-primary, text-muted-foreground, etc.)

### 5.2: Charts (Recharts)

**Files:**
- `src/components/dashboard/ticket-trend-chart.tsx`
- `src/components/dashboard/status-pie-chart.tsx`
- `src/components/dashboard/priority-bar-chart.tsx`
- `src/components/dashboard/location-chart.tsx`

**Note:** Charts require `"use client"` directive since Recharts uses browser APIs.

Install recharts:
```bash
npm install recharts
```

### 5.3: Activity Feed

**File:** `src/components/dashboard/activity-feed.tsx`

**Features:**
- Recent ticket/asset/compliance/PM activity
- Timestamp display
- Click to navigate
- Limit configurable

### 5.4: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 6: Main Dashboard Page

**File:** `src/app/(dashboard)/page.tsx`

**Role-Based Views:**

**Admin/Manager:**
- Overview stat cards (open tickets, pending approvals, expiring compliance, overdue PM)
- Ticket trend chart
- Status/priority charts
- Activity feed
- Quick action buttons

**Staff:**
- My assigned tickets
- My submitted tickets
- Quick create button
- Location alerts

**Styling:** Mobile-first, responsive at 375px, 768px, 1920px

### 6.1: Validate
```bash
npm run type-check && npm run lint && npm run build
```

---

## Task 7: Reports Service

**File:** `src/services/report.service.ts`

**Behavior:**
- Uses existing DAOs (TicketDAO, AssetDAO, VendorDAO, etc.)
- Ticket reports (by category, location, resolution time)
- Asset reports (value, warranty, maintenance cost)
- Vendor reports (performance, cost)
- Compliance reports (status, expiration calendar)
- PM reports (compliance rate, cost)
- Budget reports (vs actual, by category/location)
- Export to CSV helper

**Critical:** Derive report columns from actual schema. Do not assume columns exist.

### 7.1: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 8: Reports API Routes

**Files:**
- `src/app/api/reports/tickets/route.ts`
- `src/app/api/reports/assets/route.ts`
- `src/app/api/reports/vendors/route.ts`
- `src/app/api/reports/compliance/route.ts`
- `src/app/api/reports/pm/route.ts`
- `src/app/api/reports/budget/route.ts`
- `src/app/api/reports/export/route.ts`

### 8.1: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 9: Reports Hooks

**File:** `src/hooks/use-reports.ts`

**Behavior:**
- TanStack Query hooks for each report type
- Accept filter parameters
- Handle loading/error states

### 9.1: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 10: Report UI Components

**Files:**
- `src/components/reports/report-filters.tsx`
- `src/components/reports/date-range-picker.tsx`
- `src/components/reports/report-table.tsx`
- `src/components/reports/report-chart.tsx`
- `src/components/reports/export-button.tsx`

### 10.1: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 11: Reports Page

**File:** `src/app/(dashboard)/reports/page.tsx`

**Features:**
- Report type selector
- Date range picker
- Filters (location, category, etc.)
- Preview area (table or chart)
- Export buttons (CSV)
- Responsive design

### 11.1: Validate
```bash
npm run type-check && npm run lint && npm run build
```

---

## Task 12: Budget UI

### 12.1: Budget API Routes

**Files:**
- `src/app/api/budgets/route.ts` - GET (list), POST (create)
- `src/app/api/budgets/[id]/route.ts` - GET, PATCH, DELETE

### 12.2: Budget Page

**File:** `src/app/(dashboard)/budgets/page.tsx`

**Features:**
- Fiscal year selector
- Budget vs actual table by location
- Utilization progress bars
- Add/edit budget (admin only)

### 12.3: Validate
```bash
npm run type-check && npm run lint && npm run build
```

---

## Task 13: Settings Pages

### 13.1: Settings Overview

**File:** `src/app/(dashboard)/settings/page.tsx`

**Features:**
- Settings category navigation
- Links to sub-pages

### 13.2: Tenant Settings

**File:** `src/app/(dashboard)/settings/tenant/page.tsx`
**Component:** `src/components/settings/tenant-settings-form.tsx`

**Features:**
- Tenant name
- Branding (logo, colors)
- Default settings
- Plan info (read-only)

### 13.3: Notification Preferences

**File:** `src/app/(dashboard)/settings/notifications/page.tsx`
**Component:** `src/components/settings/notification-preferences.tsx`

**Features:**
- Email/SMS/Push toggles
- Per-event type settings
- Frequency settings

### 13.4: Category Management

**File:** `src/app/(dashboard)/settings/categories/page.tsx`
**Component:** `src/components/settings/category-manager.tsx`

**Features:**
- List ticket/asset categories
- Add/edit/soft-delete categories
- Reorder

### 13.5: Validate
```bash
npm run type-check && npm run lint && npm run build
```

---

## Task 14: UI Polish Components

### 14.1: Empty State

**File:** `src/components/ui/empty-state.tsx`

### 14.2: Skeleton Loaders

**File:** `src/components/ui/skeleton-loaders.tsx`

Skeletons for:
- Dashboard cards
- List pages
- Detail pages
- Charts

### 14.3: Error Boundary

**Files:**
- `src/components/error/error-boundary.tsx`
- `src/app/error.tsx`
- `src/app/(dashboard)/error.tsx`

### 14.4: Validate
```bash
npm run type-check && npm run lint
```

---

## Task 15: Mobile & Onboarding

### 15.1: Mobile Bottom Nav

**File:** `src/components/layout/mobile-bottom-nav.tsx`

Navigation items:
- Dashboard
- Tickets
- Create (prominent)
- More menu

### 15.2: Onboarding Wizard

**File:** `src/components/onboarding/onboarding-wizard.tsx`

Steps:
1. Welcome
2. Add first location
3. Invite team (optional)
4. Set up category
5. Complete

### 15.3: Validate
```bash
npm run type-check && npm run lint && npm run build
```

---

## Task 16: Final Validation

### 16.1: Full Build
```bash
npm run type-check
npm run lint
npm run build
```

### 16.2: Verify All Files Exist
```bash
ls src/services/dashboard.service.ts src/services/report.service.ts src/services/budget.service.ts
ls src/dao/budget.dao.ts
ls src/app/\\(dashboard\\)/page.tsx src/app/\\(dashboard\\)/reports/page.tsx src/app/\\(dashboard\\)/budgets/page.tsx
ls src/components/dashboard/stat-card.tsx src/components/dashboard/activity-feed.tsx
ls src/components/reports/report-filters.tsx src/components/reports/export-button.tsx
```

---

## Completion Criteria

1. [ ] Schema verified from migrations
2. [ ] Budget DAO/Service works
3. [ ] Dashboard service aggregates stats correctly
4. [ ] Dashboard API routes return data
5. [ ] Role-based dashboard shows relevant stats
6. [ ] Dashboard charts render correctly
7. [ ] Activity feed shows recent events
8. [ ] Reports filtered by date range and location
9. [ ] Reports exportable to CSV
10. [ ] Budget tracking shows utilization
11. [ ] Settings pages functional
12. [ ] Tenant branding configurable
13. [ ] Notification preferences saveable
14. [ ] Category management working
15. [ ] Empty states for all list pages
16. [ ] Loading skeletons for async content
17. [ ] Error boundaries catch errors
18. [ ] Onboarding wizard for new tenants
19. [ ] Mobile bottom nav works
20. [ ] All forms validated
21. [ ] UI responsive (375px, 768px, 1920px)
22. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>PHASE_6_COMPLETE</promise>
```

---

## Post-Phase Application Test

After Phase 6 complete, verify full application:

1. [ ] Signup → login → dashboard flow
2. [ ] Create location → invite user → accept invite
3. [ ] Create ticket → assign → complete → verify → close
4. [ ] Create asset → link to ticket → transfer
5. [ ] Add vendor → assign to ticket → rate
6. [ ] Add compliance doc → track expiration
7. [ ] Create PM schedule → generate ticket → complete
8. [ ] View dashboard → generate report → export CSV
9. [ ] Mobile experience smooth at 375px
10. [ ] No console errors
11. [ ] `npm run build` succeeds

---

## START HERE

1. Run schema discovery (Phase 0) - **DO NOT SKIP**
2. Verify existing DAOs from previous phases
3. Begin Task 1 (Budget DAO/Service)
4. Validate after each task
5. Continue until complete
