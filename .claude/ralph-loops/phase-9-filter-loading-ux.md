# Phase 9: Filter Loading UX Improvements

## Completion Promise
`PHASE_9_FILTER_LOADING_UX_COMPLETE`

## Problem Statement

List pages show a full-page loader (`<PageLoader />`) whenever filters change, causing the entire page to flash/reload instead of keeping the existing data visible while fetching new data.

**Root Cause:** Pages check `if (isLoading) { return <PageLoader /> }` which triggers on every filter change, not just initial load.

**Expected Behavior:**
- Show full-page loader ONLY on initial load (when there's no data yet)
- When filters change, keep existing data visible and show a subtle loading indicator
- Table/list content should remain stable during filter changes

## Pattern to Fix

### Current (Wrong) Pattern
```typescript
const { data, isLoading } = useSomeHook(filters)

if (isLoading) {
  return <PageLoader />  // ❌ Replaces entire page on every filter change
}
```

### Correct Pattern
```typescript
const { data, isLoading, isFetching } = useSomeHook(filters)

// Only show full loader on initial load (no data yet)
if (isLoading && !data) {
  return <PageLoader />
}

// In the UI, show subtle indicator when refetching
// Option A: Overlay spinner on table
// Option B: Small spinner next to filter controls
// Option C: Opacity reduction on table during fetch
```

## Files to Fix

### Priority 1: List Pages with Filters (HIGH IMPACT)

| File | Filters | Line |
|------|---------|------|
| `src/app/(dashboard)/tickets/page.tsx` | status, priority, search, pagination | ~153 |
| `src/app/(dashboard)/assets/page.tsx` | status, search, pagination | ~68 |
| `src/app/(dashboard)/vendors/page.tsx` | search, pagination | ~50 |
| `src/app/(dashboard)/users/page.tsx` | status, search | ~93 |
| `src/app/(dashboard)/locations/page.tsx` | status, search | Check file |
| `src/app/(dashboard)/emergencies/page.tsx` | status, search | ~120 |
| `src/app/(dashboard)/approvals/page.tsx` | Check filters | ~84 |

### Priority 2: Detail/Edit Pages (LOWER IMPACT)
These may be acceptable with full loader since they load once, but review for consistency:

| File | Line |
|------|------|
| `src/app/(dashboard)/pm/[id]/edit/page.tsx` | ~101 |
| `src/app/(dashboard)/emergencies/[id]/page.tsx` | ~145 |
| `src/app/(dashboard)/assets/new/page.tsx` | ~110 |
| `src/app/(dashboard)/compliance/[id]/edit/page.tsx` | ~54 |
| `src/app/(dashboard)/vendors/[id]/edit/page.tsx` | ~30 |
| `src/app/(dashboard)/pm/templates/[id]/page.tsx` | ~183 |

## Implementation Steps

### Task 1: Create Reusable Loading Components

Create a subtle table loading indicator component:

```typescript
// src/components/ui/table-loading-overlay.tsx
'use client'

import { Loader2 } from 'lucide-react'

interface TableLoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
}

export function TableLoadingOverlay({ isLoading, children }: TableLoadingOverlayProps) {
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
}
```

### Task 2: Fix tickets/page.tsx

1. Change destructure to include `isFetching`:
   ```typescript
   const { data: ticketResponse, isLoading, isFetching } = useTickets(filters)
   ```

2. Update loading check:
   ```typescript
   if (isLoading && !ticketResponse) {
     return <PageLoader />
   }
   ```

3. Wrap table in loading overlay:
   ```typescript
   <TableLoadingOverlay isLoading={isFetching}>
     <Card>
       <Table>...</Table>
     </Card>
   </TableLoadingOverlay>
   ```

### Task 3: Fix assets/page.tsx
Same pattern as Task 2.

### Task 4: Fix vendors/page.tsx
Same pattern as Task 2.

### Task 5: Fix users/page.tsx
Same pattern as Task 2.

### Task 6: Fix locations/page.tsx
Same pattern as Task 2 (if it has the issue).

### Task 7: Fix emergencies/page.tsx
Same pattern as Task 2.

### Task 8: Fix approvals/page.tsx
Same pattern as Task 2 (if it has the issue).

### Task 9: Review Detail Pages
For detail/edit pages, the full loader may be acceptable since they don't have filters. Review each and decide:
- If the page has no dynamic filters → Keep `if (isLoading)` as-is
- If the page refetches data based on user actions → Apply the same fix

## Validation Steps

After each file fix:

1. **Manual Test:**
   - Navigate to the page
   - Wait for initial load (full loader should appear)
   - Change a filter or search
   - Verify: Table content stays visible with subtle loading indicator
   - Verify: No full-page flash/reload

2. **Type Check:**
   ```bash
   cd mhg-facilities && npm run type-check
   ```

3. **Lint Check:**
   ```bash
   cd mhg-facilities && npm run lint
   ```

## Completion Criteria

- [ ] `TableLoadingOverlay` component created
- [ ] All Priority 1 list pages fixed (7 files)
- [ ] Priority 2 detail pages reviewed and fixed if needed
- [ ] All pages pass type-check
- [ ] All pages pass lint
- [ ] Manual testing confirms smooth filter transitions on all fixed pages

## Notes

- The `isFetching` flag from React Query is `true` during any fetch (initial or refetch)
- The `isLoading` flag is `true` only when there's no cached data AND a fetch is in progress
- Using `isLoading && !data` ensures we only show full loader on truly initial loads
- The overlay approach is preferred over disabling the table because users can still see what data they had

## Completion Promise
When all tasks are complete and validated, output:
```
PHASE_9_FILTER_LOADING_UX_COMPLETE
```
