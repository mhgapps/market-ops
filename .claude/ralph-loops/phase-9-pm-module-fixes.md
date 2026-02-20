# Phase 9: PM Module Fixes

## Overview
Fix all identified issues in the Preventive Maintenance (PM) module based on the deep review audit.

## Issues to Fix

### HIGH PRIORITY

#### Issue 1: PM Schedule Detail View - Mock Data
**Files:** `src/app/(dashboard)/pm/[id]/page.tsx`
**Problem:** Hardcoded mock data instead of API fetch
**Solution:**
- Convert to client component OR fetch server-side
- Use `usePMSchedule(id)` hook to fetch real data
- Display completion history from API

#### Issue 2: Template Detail Route Missing GET
**Files:** `src/app/api/pm-templates/[id]/route.ts`
**Problem:** Only PATCH/DELETE, no GET handler
**Solution:**
```typescript
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const service = new PMTemplateService();
  const template = await service.getTemplateById(id);
  if (!template) return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  return NextResponse.json({ template });
}
```

#### Issue 3: PM Calendar Data Shape Mismatch
**Files:**
- `src/services/pm-schedule.service.ts` (getPMCalendar)
- `src/hooks/use-pm.ts` (PMCalendarItem type)
- `src/components/pm/pm-calendar.tsx`

**Problem:** Service returns `{date, schedules[]}` but component expects flat array with `next_due_date`
**Solution:** Update service to return flat array matching component expectations:
```typescript
interface PMCalendarItem {
  id: string;
  name: string;
  asset_name: string | null;
  location_name: string | null;
  frequency: PMFrequency;
  next_due_date: string;
}
```

#### Issue 4: Ticket Generation Duplicates
**Files:**
- `src/app/api/pm-schedules/generate/route.ts`
- `src/services/pm-schedule.service.ts`
- `src/app/api/cron/pm-generate/route.ts`

**Problem:**
1. Manual generate endpoint is stub (returns messages only)
2. Cron creates tickets but never updates `next_due_date`

**Solution:**
- Fix cron to update schedule after ticket creation
- Either remove or implement manual generate endpoint
- Add idempotency check (last_generated_at within 24h = skip)

#### Issue 5: PM Report Flow Broken
**Files:**
- `src/app/(dashboard)/reports/page.tsx`
- `src/app/api/reports/pm/route.ts`
- `src/services/report.service.ts`

**Problem:** UI doesn't pass date range, service returns placeholder
**Solution:**
- Update UI to pass date range parameters
- Implement actual report logic in service

### MEDIUM PRIORITY

#### Issue 6: Schedule Filters Early Return
**File:** `src/services/pm-schedule.service.ts` (getAllSchedules)
**Problem:** Early returns ignore combined filters, `is_active=false` ignored
**Solution:** Build combined filter query in DAO

#### Issue 7: Recurrence Inputs Ignored
**File:** `src/services/pm-schedule.service.ts` (calculateNextDueDateFromFrequency)
**Problem:**
- `day_of_week` ignored for weekly
- Monthly clamps to 28
- Quarter/semi-annual don't use month_of_year

**Solution:** Implement proper recurrence logic:
```typescript
case 'weekly':
  // Find next occurrence of day_of_week
  if (dayOfWeek !== null) {
    const daysUntil = (dayOfWeek - now.getDay() + 7) % 7 || 7;
    now.setDate(now.getDate() + daysUntil);
  } else {
    now.setDate(now.getDate() + 7);
  }
  break;
```

#### Issue 8: Update Allows Both asset_id AND location_id
**Files:**
- `src/lib/validations/pm.ts`
- `src/services/pm-schedule.service.ts`

**Problem:** Create has XOR, update doesn't
**Solution:** Add validation in service update method

#### Issue 9: UI Expects Enriched Fields
**Files:**
- `src/hooks/use-pm.ts`
- `src/dao/pm-schedule.dao.ts`
- `src/services/pm-schedule.service.ts`

**Problem:** Hook expects `asset_name`, `assigned_to_name`, `last_completed_at`
**Solution:** Add joins in DAO queries:
```typescript
.select(`
  *,
  assets(name),
  locations(name),
  users!pm_schedules_assigned_to_fkey(full_name)
`)
```

### LOW PRIORITY

#### Issue 10: Duplicate API Routes
**Files:** `src/app/api/pm/route.ts`, `src/app/api/pm-schedules/route.ts`
**Solution:** Delete `/api/pm/route.ts` (unused)

#### Issue 11: "Due Today" Includes Overdue
**File:** `src/dao/pm-schedule.dao.ts`
**Problem:** `findDueToday` uses `lte` instead of `eq`
**Solution:** Change to exact date match

#### Issue 12: Unused Code Cleanup
- Remove or wire up PMCompletionService
- PMCalendar component not mounted anywhere
- Unused hooks in use-pm.ts

## Implementation Order

### Batch 1 (Parallel - API Layer)
- Issue 2: Add GET to pm-templates
- Issue 4: Fix cron job ticket generation
- Issue 10: Delete duplicate route

### Batch 2 (Parallel - Service Layer)
- Issue 3: Fix calendar data shape
- Issue 6: Fix filter logic
- Issue 7: Fix recurrence calculation
- Issue 8: Add XOR validation
- Issue 9: Add enriched fields

### Batch 3 (Parallel - UI Layer)
- Issue 1: Fix PM detail page
- Issue 5: Fix reports page
- Issue 11: Fix due today query

### Batch 4 (Cleanup)
- Issue 12: Remove unused code

## Validation
After fixes:
1. `npm run type-check` must pass
2. `npm run lint` must pass
3. Manual test PM schedule CRUD
4. Manual test PM calendar
5. Manual test PM reports
