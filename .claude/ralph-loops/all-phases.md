# MHG Facilities - Complete Build (All Phases v2)

## CRITICAL LOOP INSTRUCTIONS - READ FIRST

**YOU ARE IN A RALPH LOOP. YOU MUST NOT STOP UNTIL ALL PHASES ARE COMPLETE.**

### Rules You MUST Follow:
1. **NEVER say "the next iteration will..." or "continuing in the next turn"** - Just keep working NOW
2. **NEVER end your response with a summary** - summaries signal completion to the loop
3. **NEVER output the promise until ALL 6 phases pass validation**
4. **NEVER hallucinate column names** - Always verify from schema first
5. **If you finish a task, immediately start the next one in the SAME response**
6. **If you need to run validation, run it and immediately continue with the next task**

### How This Loop Works:
- You will be given this same prompt repeatedly until you output: `<promise>ALL_PHASES_COMPLETE</promise>`
- Each iteration, check `.claude/progress.md` to see where you left off
- Continue from exactly where you stopped
- The loop ONLY stops when you output the promise OR hit max iterations

---

## Project Directory

**IMPORTANT**: All file paths are relative to `mhg-facilities/`. Before starting, run: `cd mhg-facilities`

---

## MANDATORY: Schema Discovery Before Each Phase

**CRITICAL**: Before implementing ANY phase, you MUST:

1. Read the migration file to understand exact column names:
   ```bash
   cd mhg-facilities
   ls supabase/migrations/
   ```

2. Grep for the specific tables you'll work with:
   ```bash
   grep "CREATE TABLE table_name" supabase/migrations/*.sql -A 20
   ```

3. Check for enums:
   ```bash
   grep "CREATE TYPE" supabase/migrations/*.sql
   ```

4. Never use a column name you haven't verified exists in the migration file.

---

## Phase Execution Order

Execute phases sequentially. Each phase must pass `npm run type-check && npm run lint && npm run build` before proceeding.

**ALL PHASE SPECS ARE IN:** `.claude/ralph-loops/v2/`

---

## Phase 1: Authentication & Tenant Setup

**Spec:** `.claude/ralph-loops/v2/phase-1-auth-tenant.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE tenants" supabase/migrations/*.sql -A 20
grep "CREATE TABLE users" supabase/migrations/*.sql -A 30
grep "CREATE TYPE user_role" supabase/migrations/*.sql -A 10
```

**Key Deliverables:**
- Auth pages (login, signup, forgot/reset password)
- Auth server actions with Supabase
- Middleware protection
- Tenant & User DAOs/Services
- Auth API routes
- Query/Auth providers
- Protected dashboard layout

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Phase 2: Location & User Management

**Spec:** `.claude/ralph-loops/v2/phase-2-locations-users.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE locations" supabase/migrations/*.sql -A 25
grep "CREATE TABLE invitations" supabase/migrations/*.sql -A 15
grep "CREATE TYPE location_status" supabase/migrations/*.sql -A 5
```

**Key Deliverables:**
- Location DAO & Service
- Location CRUD API routes
- Location list & detail pages
- User management API routes
- Email service (SMTP)
- User invitation flow
- Users list page
- User profile settings
- Role-based UI components

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Phase 3: Ticket System

**Spec:** `.claude/ralph-loops/v2/phase-3-tickets.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE tickets" supabase/migrations/*.sql -A 45
grep "CREATE TABLE ticket_categories" supabase/migrations/*.sql -A 15
grep "CREATE TABLE ticket_comments" supabase/migrations/*.sql -A 15
grep "CREATE TABLE ticket_attachments" supabase/migrations/*.sql -A 12
grep "CREATE TYPE ticket_status" supabase/migrations/*.sql -A 10
grep "CREATE TYPE ticket_priority" supabase/migrations/*.sql -A 5
```

**Key Deliverables:**
- Ticket DAO & Service with full lifecycle
- Ticket category DAO & Service
- Ticket comment & attachment services
- Cost approval service
- All ticket API routes
- Ticket list page with filters
- Ticket creation flow
- Ticket detail page
- All ticket components

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Phase 4: Assets & Vendors

**Spec:** `.claude/ralph-loops/v2/phase-4-assets-vendors.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE assets" supabase/migrations/*.sql -A 35
grep "CREATE TABLE asset_categories" supabase/migrations/*.sql -A 12
grep "CREATE TABLE asset_transfers" supabase/migrations/*.sql -A 15
grep "CREATE TABLE vendors" supabase/migrations/*.sql -A 30
grep "CREATE TABLE vendor_contacts" supabase/migrations/*.sql -A 15
grep "CREATE TABLE vendor_ratings" supabase/migrations/*.sql -A 12
grep "CREATE TYPE asset_status" supabase/migrations/*.sql -A 10
grep "CREATE TYPE vendor_status" supabase/migrations/*.sql -A 5
```

**Key Deliverables:**
- Asset DAO & Service with categories and locations
- Asset lifecycle tracking (transfers)
- Asset API routes & pages
- Vendor DAO & Service
- Vendor contacts & ratings
- Vendor API routes & pages
- QR code generation

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Phase 5: Compliance & Preventive Maintenance

**Spec:** `.claude/ralph-loops/v2/phase-5-compliance-pm.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE compliance_document_types" supabase/migrations/*.sql -A 15
grep "CREATE TABLE compliance_documents" supabase/migrations/*.sql -A 35
grep "CREATE TABLE pm_templates" supabase/migrations/*.sql -A 12
grep "CREATE TABLE pm_schedules" supabase/migrations/*.sql -A 25
grep "CREATE TYPE compliance_status" supabase/migrations/*.sql -A 10
grep "CREATE TYPE pm_frequency" supabase/migrations/*.sql -A 10
```

**Key Deliverables:**
- Compliance document type DAO & Service
- Compliance document DAO & Service with status tracking
- PM template DAO & Service
- PM schedule DAO & Service with frequency calculation
- Compliance & PM API routes
- Cron jobs for alerts and PM generation
- Compliance & PM UI components
- Compliance & PM pages with calendars

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Phase 6: Dashboard & Reports

**Spec:** `.claude/ralph-loops/v2/phase-6-dashboard-reports.md`

**Schema Discovery First:**
```bash
grep "CREATE TABLE budgets" supabase/migrations/*.sql -A 18
```

**Key Deliverables:**
- Budget DAO & Service
- Dashboard service (aggregates from existing DAOs)
- Dashboard API routes
- Dashboard hooks
- Dashboard UI (stat cards, charts, activity feed)
- Main dashboard page (role-based)
- Reports service
- Reports API routes & hooks
- Reports UI components
- Reports page with filters & export
- Budget page
- Settings pages (tenant, notifications, categories)
- UI polish (empty states, skeletons, error boundaries)
- Mobile bottom nav
- Onboarding wizard

**Validation:**
```bash
npm run type-check && npm run lint && npm run build
```

---

## Progress Tracking

**AT THE START OF EVERY ITERATION:**
```bash
cd mhg-facilities
cat ../.claude/progress.md
git log --oneline -3
```

**AT THE END OF EVERY TASK (not iteration):**
Update `../.claude/progress.md` with what you completed.

---

## Anti-Hallucination Checklist

Before writing ANY DAO, Service, or API route:

- [ ] I have run `grep "CREATE TABLE xxx"` to verify exact column names
- [ ] I have verified enum values with `grep "CREATE TYPE xxx"`
- [ ] I am NOT assuming any column exists without verification
- [ ] I am NOT copying method signatures from the spec - deriving from schema
- [ ] I have checked `src/types/database.ts` for generated types

---

## Completion Criteria

**ALL of these must be true before outputting the promise:**

1. [ ] Phase 1 complete (auth working)
2. [ ] Phase 2 complete (locations, users working)
3. [ ] Phase 3 complete (tickets working)
4. [ ] Phase 4 complete (assets, vendors working)
5. [ ] Phase 5 complete (compliance, PM working)
6. [ ] Phase 6 complete (dashboard, reports working)
7. [ ] `npm run type-check` passes with 0 errors
8. [ ] `npm run lint` passes with 0 errors
9. [ ] `npm run build` passes successfully

**ONLY when ALL 9 criteria are met, output:**

```
<promise>ALL_PHASES_COMPLETE</promise>
```

---

## START HERE

1. Read `.claude/progress.md` to see current state
2. Identify the current incomplete phase
3. **Run schema discovery commands** for that phase (MANDATORY)
4. Read that phase's spec file from `.claude/ralph-loops/v2/`
5. Continue implementing from where you left off
6. Run validation after each task
7. Update progress.md
8. Move to next task (DO NOT STOP)
9. Repeat until ALL phases complete

---

## Alternative: Build Verification Loop

If all phases appear complete but you want to verify the build against the original plan:

**Use:** `.claude/ralph-loops/v2/verify-build.md`

This loop:
1. Cross-references the database schema with existing DAOs/Services/Routes
2. Verifies all required files exist
3. Identifies gaps and FIXES them
4. Runs final build validation

**Completion Promise:** `BUILD_VERIFIED`
