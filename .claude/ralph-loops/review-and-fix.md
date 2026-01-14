# MHG Facilities - Full Review & Fix

## CRITICAL LOOP INSTRUCTIONS

**YOU ARE IN A RALPH LOOP. YOUR JOB IS TO AUDIT AND FIX THE APPLICATION.**

### Rules You MUST Follow:
1. **NEVER say "the next iteration will..." or "continuing in the next turn"** - Just keep working NOW
2. **NEVER end your response with a summary** - summaries signal completion to the loop
3. **NEVER output the promise until ALL checks pass and the app works**
4. **If you find an issue, fix it immediately in the SAME response**
5. **Test every page by checking the route file exists and is properly configured**

---

## Project Directory

**IMPORTANT**: All file paths are relative to `mhg-facilities/`. Before starting, run: `cd mhg-facilities`

---

## Phase 1: Verify Application Boots

### Step 1.1: Check for Build Errors
```bash
cd mhg-facilities
npm run type-check 2>&1 | head -50
npm run lint 2>&1 | head -50
npm run build 2>&1 | tail -100
```

**If errors exist, FIX THEM before continuing.**

### Step 1.2: Start Dev Server & Test Root
```bash
# Kill any existing server
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start dev server in background
npm run dev &
sleep 5

# Test root page
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

**Expected: 200 or 302 (redirect to login)**

---

## Phase 2: Audit All Routes

### Step 2.1: List All Page Routes
```bash
find src/app -name "page.tsx" | sort
```

**For EACH route, verify:**
1. File exists and is not empty
2. Has proper exports
3. Page renders without error

### Step 2.2: Check Route Structure

**Required Routes (check each exists):**

```
src/app/
├── page.tsx                           # Root - should redirect
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   └── verify-email/page.tsx
├── (dashboard)/
│   ├── page.tsx                       # Dashboard home ← CHECK THIS
│   ├── locations/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── users/page.tsx
│   ├── tickets/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [id]/page.tsx
│   ├── assets/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── vendors/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── compliance/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── pm/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── approvals/page.tsx
│   ├── reports/page.tsx
│   └── settings/
│       ├── page.tsx
│       └── profile/page.tsx
└── (public)/
    └── accept-invite/[token]/page.tsx
```

### Step 2.3: Check Dashboard Page Specifically

The user reported 404 on dashboard. Check:
```bash
ls -la src/app/\(dashboard\)/page.tsx
cat src/app/\(dashboard\)/page.tsx | head -20
```

**If missing, CREATE IT with proper dashboard content.**

---

## Phase 3: Audit All API Routes

### Step 3.1: List All API Routes
```bash
find src/app/api -name "route.ts" | sort
```

### Step 3.2: Required API Routes

```
src/app/api/
├── auth/
│   ├── me/route.ts
│   └── session/route.ts
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
├── tickets/
│   ├── route.ts
│   ├── check-duplicate/route.ts
│   └── [id]/
│       ├── route.ts
│       ├── status/route.ts
│       ├── assign/route.ts
│       ├── comments/route.ts
│       ├── attachments/route.ts
│       └── approval/route.ts
├── ticket-categories/
│   ├── route.ts
│   └── [id]/route.ts
├── assets/
│   ├── route.ts
│   ├── [id]/
│   │   ├── route.ts
│   │   └── transfer/route.ts
│   └── qr/[code]/route.ts
├── asset-categories/
│   ├── route.ts
│   └── [id]/route.ts
├── vendors/
│   ├── route.ts
│   └── [id]/
│       ├── route.ts
│       └── ratings/route.ts
├── compliance/
│   ├── route.ts
│   └── [id]/route.ts
├── pm/
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
│   ├── compliance/route.ts
│   ├── pm/route.ts
│   ├── vendors/route.ts
│   ├── budget/route.ts
│   └── export/route.ts
└── cron/
    ├── compliance-alerts/route.ts
    └── pm-generate/route.ts
```

---

## Phase 4: Audit Services & DAOs

### Step 4.1: List All DAOs
```bash
ls -la src/dao/*.ts
```

**Required DAOs:**
- base.dao.ts
- user.dao.ts
- location.dao.ts
- ticket.dao.ts
- ticket-category.dao.ts
- ticket-comment.dao.ts
- ticket-attachment.dao.ts
- cost-approval.dao.ts
- asset.dao.ts
- asset-category.dao.ts
- asset-transfer.dao.ts
- vendor.dao.ts
- vendor-rating.dao.ts
- compliance-document.dao.ts
- pm-schedule.dao.ts

### Step 4.2: List All Services
```bash
ls -la src/services/*.ts
```

**Required Services:**
- location.service.ts
- invitation.service.ts
- ticket.service.ts
- ticket-category.service.ts
- ticket-comment.service.ts
- ticket-attachment.service.ts
- cost-approval.service.ts
- asset.service.ts
- asset-category.service.ts
- asset-transfer.service.ts
- vendor.service.ts
- vendor-rating.service.ts
- compliance-document.service.ts
- pm-schedule.service.ts
- dashboard.service.ts
- report.service.ts

---

## Phase 5: Audit UI Components

### Step 5.1: List All Components
```bash
find src/components -name "*.tsx" | sort
```

### Step 5.2: Check Required Components

**UI Components (shadcn):**
- button.tsx, input.tsx, label.tsx, card.tsx, badge.tsx
- dialog.tsx, select.tsx, table.tsx, tabs.tsx
- alert.tsx, separator.tsx, switch.tsx, textarea.tsx

**Feature Components:**
- auth/RequireRole.tsx
- locations/location-form.tsx
- users/invite-user-modal.tsx, edit-user-modal.tsx
- tickets/* (12 components)
- assets/* (4 components)
- vendors/* (2 components)
- compliance/* (6 components)
- pm/* (2 components)
- dashboard/* (6 components)
- layout/* (sidebar, header, mobile-nav)

---

## Phase 6: Audit Hooks

### Step 6.1: List All Hooks
```bash
ls -la src/hooks/*.ts
```

**Required Hooks:**
- use-tickets.ts
- use-assets.ts
- use-asset-categories.ts
- use-vendors.ts
- use-compliance.ts
- use-pm.ts
- use-dashboard.ts

---

## Phase 7: Fix Any Issues Found

For each issue found:
1. Log what's missing/broken
2. Create or fix the file immediately
3. Run type-check to verify fix
4. Continue to next issue

---

## Phase 8: Final Validation

```bash
cd mhg-facilities

# Full validation suite
npm run type-check
npm run lint
npm run build

# If all pass, test the app
npm run dev &
sleep 5

# Test key routes
curl -s -o /dev/null -w "Root: %{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "Login: %{http_code}\n" http://localhost:3000/login
curl -s -o /dev/null -w "Dashboard: %{http_code}\n" http://localhost:3000/dashboard
curl -s -o /dev/null -w "Locations: %{http_code}\n" http://localhost:3000/locations
curl -s -o /dev/null -w "Tickets: %{http_code}\n" http://localhost:3000/tickets
```

**All routes should return 200 or 302.**

---

## Completion Criteria

**ALL of these must be true:**

1. [ ] `npm run type-check` passes with 0 errors
2. [ ] `npm run lint` passes (warnings OK, no errors)
3. [ ] `npm run build` passes successfully
4. [ ] Root page (/) works - redirects to login or dashboard
5. [ ] Login page (/login) renders
6. [ ] Dashboard page works (not 404)
7. [ ] All main pages exist and have content
8. [ ] All required API routes exist
9. [ ] All required services and DAOs exist

**ONLY when ALL criteria are met, output:**

```
<promise>REVIEW_COMPLETE</promise>
```

---

## Progress Tracking

Update `.claude/review-progress.md` after each phase with:
- What was checked
- What issues were found
- What was fixed
