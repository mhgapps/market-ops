# Phase 6: Dashboard & Reports

## Prerequisites

- Phase 1-5 completed
- All core modules working (tickets, assets, vendors, compliance, PM)

## Context

The dashboard provides at-a-glance insights and the reporting module enables data export and analysis. This phase brings everything together.

## Coding Standards (MUST FOLLOW)

**Before writing any code, internalize these rules:**

| Rule | ✅ DO | ❌ DON'T |
|------|-------|----------|
| Colors | `bg-primary`, `text-muted-foreground`, `bg-destructive` | `bg-blue-500`, `#3B82F6`, `text-red-600` |
| Architecture | DAO → Service → API Route | Database queries in routes |
| HTTP Client | `api.get()`, `api.post()` from `@/lib/api-client` | Raw `fetch()` in components |
| Components | Server components by default | `"use client"` without hooks/events |
| Animations | `animate-in fade-in slide-in-from-bottom-4` | Framer Motion for simple effects |
| Deletes | `deleted_at = new Date()` (soft delete) | `DELETE FROM table` (hard delete) |
| Validation | Zod schemas at API boundary | Manual if/throw checks |
| File Size | <300 lines per component | Monolithic 500+ line files |

**Full standards documented in:** `.claude/ralph-loops/README.md` → "Coding Standards & Architecture"

## Objective

Implement role-based dashboards with key metrics and comprehensive reporting capabilities.

## Tasks

### 1. Dashboard Stats Service

**File:** `src/services/dashboard.service.ts`

```typescript
class DashboardService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private assetDAO = new AssetDAO(),
    private complianceDAO = new ComplianceDocumentDAO(),
    private pmScheduleDAO = new PMScheduleDAO(),
    private locationDAO = new LocationDAO()
  )

  // Overview stats
  getOverviewStats(): Promise<OverviewStats>

  // Ticket stats
  getTicketStats(): Promise<TicketStats>
  getTicketsByStatus(): Promise<StatusCount[]>
  getTicketsByPriority(): Promise<PriorityCount[]>
  getTicketTrend(days: number): Promise<TrendData[]>
  getAverageResolutionTime(): Promise<number>

  // Asset stats
  getAssetStats(): Promise<AssetStats>
  getAssetsByStatus(): Promise<StatusCount[]>
  getExpiringWarranties(days: number): Promise<Asset[]>

  // Compliance stats
  getComplianceStats(): Promise<ComplianceStats>
  getComplianceByStatus(): Promise<StatusCount[]>
  getUpcomingExpirations(days: number): Promise<ComplianceDocument[]>

  // PM stats
  getPMStats(): Promise<PMStats>
  getPMCompletionRate(months: number): Promise<number>
  getOverduePM(): Promise<PMSchedule[]>

  // Location stats
  getLocationStats(): Promise<LocationStats>
  getTicketsByLocation(): Promise<LocationTicketCount[]>

  // User activity
  getRecentActivity(limit: number): Promise<ActivityItem[]>
}
```

### 2. Dashboard API Routes

**Files:**
- `src/app/api/dashboard/overview/route.ts` - GET overview stats
- `src/app/api/dashboard/tickets/route.ts` - GET ticket stats
- `src/app/api/dashboard/assets/route.ts` - GET asset stats
- `src/app/api/dashboard/compliance/route.ts` - GET compliance stats
- `src/app/api/dashboard/pm/route.ts` - GET PM stats
- `src/app/api/dashboard/activity/route.ts` - GET recent activity

### 3. Main Dashboard Page (Role-Based)

**File:** `src/app/(dashboard)/page.tsx`

**Admin/Manager Dashboard:**
- Overview cards: open tickets, pending approvals, expiring compliance, overdue PM
- Ticket trend chart (7/30 days)
- Tickets by status pie chart
- Tickets by priority bar chart
- Recent activity feed
- Quick action buttons

**Staff Dashboard:**
- My assigned tickets list
- My submitted tickets status
- Quick create ticket button
- Location-specific alerts

### 4. Dashboard Stat Cards

**File:** `src/components/dashboard/stat-card.tsx`

```typescript
interface StatCardProps {
  title: string
  value: number | string
  change?: number  // Percentage change
  trend?: 'up' | 'down' | 'neutral'
  icon?: ReactNode
  href?: string  // Click to navigate
}
```

### 5. Dashboard Charts

**Files:**
- `src/components/dashboard/ticket-trend-chart.tsx` - Line chart
- `src/components/dashboard/status-pie-chart.tsx` - Pie chart
- `src/components/dashboard/priority-bar-chart.tsx` - Bar chart
- `src/components/dashboard/location-chart.tsx` - Horizontal bar

**Use Recharts library** - Install with `npm install recharts`

**Note:** Recharts requires "use client" directive as it uses browser APIs

### 6. Activity Feed Component

**File:** `src/components/dashboard/activity-feed.tsx`

**Features:**
- Recent ticket creations, updates, completions
- Compliance expirations
- PM completions
- User sign-ins (admin only)
- Timestamp and user info
- Click to navigate to item

### 7. Reports Service

**File:** `src/services/report.service.ts`

```typescript
class ReportService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private assetDAO = new AssetDAO(),
    private vendorDAO = new VendorDAO(),
    private complianceDAO = new ComplianceDocumentDAO(),
    private pmScheduleDAO = new PMScheduleDAO()
  )

  // Ticket reports
  getTicketReport(filters: TicketReportFilters): Promise<TicketReportData>
  getTicketsByCategory(dateRange: DateRange): Promise<CategoryReport[]>
  getTicketsByLocation(dateRange: DateRange): Promise<LocationReport[]>
  getResolutionTimeReport(dateRange: DateRange): Promise<ResolutionReport>

  // Asset reports
  getAssetReport(filters: AssetReportFilters): Promise<AssetReportData>
  getAssetValueReport(): Promise<AssetValueReport>
  getWarrantyReport(): Promise<WarrantyReport>
  getMaintenanceCostReport(assetId?: string): Promise<MaintenanceCostReport>

  // Vendor reports
  getVendorPerformanceReport(dateRange: DateRange): Promise<VendorPerformanceReport[]>
  getVendorCostReport(dateRange: DateRange): Promise<VendorCostReport[]>

  // Compliance reports
  getComplianceStatusReport(): Promise<ComplianceStatusReport>
  getExpirationCalendarReport(months: number): Promise<ExpirationCalendarReport>

  // PM reports
  getPMComplianceReport(dateRange: DateRange): Promise<PMComplianceReport>
  getPMCostReport(dateRange: DateRange): Promise<PMCostReport>

  // Budget reports
  getBudgetVsActualReport(fiscalYear: number): Promise<BudgetReport>
  getSpendingByCategory(fiscalYear: number): Promise<SpendingReport[]>
  getSpendingByLocation(fiscalYear: number): Promise<SpendingReport[]>

  // Export helpers
  exportToCSV(data: any[], filename: string): Blob
  exportToPDF(report: ReportData, template: string): Blob
}
```

### 8. Reports API Routes

**Files:**
- `src/app/api/reports/tickets/route.ts` - GET with query params
- `src/app/api/reports/assets/route.ts` - GET with query params
- `src/app/api/reports/vendors/route.ts` - GET with query params
- `src/app/api/reports/compliance/route.ts` - GET with query params
- `src/app/api/reports/pm/route.ts` - GET with query params
- `src/app/api/reports/budget/route.ts` - GET with query params
- `src/app/api/reports/export/route.ts` - POST (generate export)

### 9. Reports Page

**File:** `src/app/(dashboard)/reports/page.tsx`

**Features:**
- Report type selector
- Date range picker
- Additional filters (location, category, etc.)
- Preview area
- Export buttons (CSV, PDF)
- Saved report configurations

### 10. Report Components

**Files:**
- `src/components/reports/report-filters.tsx` - Filter controls
- `src/components/reports/date-range-picker.tsx` - Date range selection
- `src/components/reports/report-table.tsx` - Data table with sorting
- `src/components/reports/report-chart.tsx` - Visual chart
- `src/components/reports/export-button.tsx` - Export actions

### 11. Budget Management (Simple Version)

**Files:**
- `src/dao/budget.dao.ts`
- `src/services/budget.service.ts`

```typescript
class BudgetService {
  getBudgets(fiscalYear: number): Promise<Budget[]>
  getBudgetByLocation(locationId: string, fiscalYear: number): Promise<Budget | null>
  createBudget(data: CreateBudgetInput): Promise<Budget>
  updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget>
  updateSpentAmount(id: string, amount: number): Promise<Budget>  // Called when tickets are closed
  getBudgetUtilization(fiscalYear: number): Promise<BudgetUtilization[]>
}
```

### 12. Budget Page

**File:** `src/app/(dashboard)/budgets/page.tsx`

**Features:**
- Fiscal year selector
- Budget vs actual by location
- Budget vs actual by category
- Progress bars showing utilization
- Add/edit budget entries (admin)

### 13. Settings Pages

**Files:**
- `src/app/(dashboard)/settings/page.tsx` - Settings overview
- `src/app/(dashboard)/settings/tenant/page.tsx` - Tenant settings (admin)
- `src/app/(dashboard)/settings/notifications/page.tsx` - Notification preferences
- `src/app/(dashboard)/settings/categories/page.tsx` - Manage ticket/asset categories

### 14. Tenant Settings

**File:** `src/components/settings/tenant-settings-form.tsx`

**Features:**
- Tenant name
- Branding (colors, logo upload)
- Default ticket settings
- Notification defaults
- Plan info (read-only)

### 15. Notification Preferences

**File:** `src/components/settings/notification-preferences.tsx`

**Features:**
- Email notifications toggle
- SMS notifications toggle (if enabled)
- Push notifications toggle
- Per-event type settings
- Frequency settings (immediate, daily digest)

### 16. Category Management

**File:** `src/components/settings/category-manager.tsx`

**Features:**
- List all categories (ticket, asset)
- Add new category
- Edit category
- Soft delete category
- Reorder categories

### 17. Empty States

**File:** `src/components/ui/empty-state.tsx`

```typescript
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}
```

Create empty states for all list pages.

### 18. Loading States

**File:** `src/components/ui/skeleton-loaders.tsx`

Create skeleton loaders for:
- Dashboard cards
- List pages
- Detail pages
- Charts

### 19. Error Boundaries

**Files:**
- `src/components/error/error-boundary.tsx`
- `src/app/error.tsx` - Root error UI
- `src/app/(dashboard)/error.tsx` - Dashboard error UI

### 20. Onboarding Flow

**File:** `src/components/onboarding/onboarding-wizard.tsx`

For new tenants after signup:
1. Welcome step
2. Add first location
3. Invite team members (optional)
4. Set up first ticket category
5. Complete

### 21. Mobile Optimization

**File:** `src/components/layout/mobile-bottom-nav.tsx`

Bottom navigation for mobile:
- Dashboard
- Tickets
- Create (prominent)
- More menu

### 22. PWA Configuration (Optional)

**Files:**
- `public/manifest.json` - PWA manifest
- `src/app/manifest.ts` - Next.js manifest

Enable installable PWA for mobile devices.

## Completion Criteria

1. [ ] Role-based dashboard shows relevant stats
2. [ ] Dashboard charts render correctly
3. [ ] Activity feed shows recent events
4. [ ] Reports can be filtered by date range and location
5. [ ] Reports exportable to CSV
6. [ ] Budget tracking shows utilization
7. [ ] Settings pages functional
8. [ ] Tenant branding configurable
9. [ ] Notification preferences saveable
10. [ ] Category management working
11. [ ] Empty states for all list pages
12. [ ] Loading skeletons for async content
13. [ ] Error boundaries catch and display errors
14. [ ] Onboarding wizard for new tenants
15. [ ] Mobile bottom nav works
16. [ ] All forms have proper validation
17. [ ] UI responsive at 375px, 768px, 1920px
18. [ ] `npm run type-check && npm run lint && npm run build` passes

## Validation Commands (Run After Each Task)

```bash
npm run type-check
npm run lint
npm run build
```

**CRITICAL**: Run after each numbered task. Fix errors before proceeding.

## RALPH Loop Configuration

### Completion Promise

When ALL completion criteria are met and ALL validation commands pass, output:

```
<promise>PHASE_6_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-6-dashboard-reports.md)" --completion-promise "PHASE_6_COMPLETE" --max-iterations 50
```

### If Stuck After 18+ Iterations

If you're not making progress after 18 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 6 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_6_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## File Checklist

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── page.tsx (main dashboard)
│   │   ├── error.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   ├── budgets/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── tenant/page.tsx
│   │       ├── notifications/page.tsx
│   │       └── categories/page.tsx
│   ├── error.tsx
│   └── api/
│       ├── dashboard/
│       │   ├── overview/route.ts
│       │   ├── tickets/route.ts
│       │   ├── assets/route.ts
│       │   ├── compliance/route.ts
│       │   ├── pm/route.ts
│       │   └── activity/route.ts
│       └── reports/
│           ├── tickets/route.ts
│           ├── assets/route.ts
│           ├── vendors/route.ts
│           ├── compliance/route.ts
│           ├── pm/route.ts
│           ├── budget/route.ts
│           └── export/route.ts
├── components/
│   ├── dashboard/
│   │   ├── stat-card.tsx
│   │   ├── ticket-trend-chart.tsx
│   │   ├── status-pie-chart.tsx
│   │   ├── priority-bar-chart.tsx
│   │   ├── location-chart.tsx
│   │   └── activity-feed.tsx
│   ├── reports/
│   │   ├── report-filters.tsx
│   │   ├── date-range-picker.tsx
│   │   ├── report-table.tsx
│   │   ├── report-chart.tsx
│   │   └── export-button.tsx
│   ├── settings/
│   │   ├── tenant-settings-form.tsx
│   │   ├── notification-preferences.tsx
│   │   └── category-manager.tsx
│   ├── onboarding/
│   │   └── onboarding-wizard.tsx
│   ├── layout/
│   │   └── mobile-bottom-nav.tsx
│   ├── ui/
│   │   ├── empty-state.tsx
│   │   └── skeleton-loaders.tsx
│   └── error/
│       └── error-boundary.tsx
├── dao/
│   └── budget.dao.ts
├── services/
│   ├── dashboard.service.ts
│   ├── report.service.ts
│   └── budget.service.ts
└── hooks/
    ├── use-dashboard.ts
    └── use-reports.ts

public/
└── manifest.json (optional PWA)
```

## Context Management (CRITICAL)

To prevent context overflow across iterations:

### At the START of each iteration:

```bash
# 1. Read progress file
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/services/dashboard*.ts src/services/report*.ts src/components/dashboard/ 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with completed tasks, files created, and validation results.

### Commit After Each Task

```bash
git add -A && git commit -m "feat(dashboard): [task description]"
# or
git add -A && git commit -m "feat(reports): [task description]"
```

### DO NOT:
- Re-read files from Phase 1-5 (they're complete)
- Explain completed work in conversation
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create/update `.claude/progress.md`:

```markdown
# Phase 6 Progress

## Current Task
Task 1: Dashboard Stats Service

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/services/dashboard.service.ts
```

Then begin implementation. This phase ties everything together. Run validation commands after each task.

When complete, output: `<promise>PHASE_6_COMPLETE</promise>`

## Post-Phase Checklist

After completing Phase 6, verify the entire application:

1. [ ] Complete signup → login → dashboard flow
2. [ ] Create location → invite user → user accepts
3. [ ] Create ticket → assign → complete → verify → close
4. [ ] Create asset → link to ticket → transfer asset
5. [ ] Add vendor → assign to ticket → rate vendor
6. [ ] Add compliance doc → upload version → track expiration
7. [ ] Create PM schedule → generate ticket → complete PM
8. [ ] View dashboard stats → generate report → export CSV
9. [ ] Mobile experience smooth at 375px
10. [ ] No console errors throughout
11. [ ] `npm run build` succeeds
