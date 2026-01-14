# Phase 1: Authentication & Tenant Setup (v2)

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

## PHASE 0: MANDATORY SCHEMA DISCOVERY

**YOU MUST DO THIS BEFORE WRITING ANY CODE.**

### Step 0.1: Read the Database Schema
```bash
cd mhg-facilities
cat supabase/migrations/*.sql | head -400
```

**Extract and note:**
- All table names
- All column names for: `tenants`, `users`, `locations`, `tenant_invitations`
- All enum types and their values
- All foreign key relationships

### Step 0.2: Read the TypeScript Types
```bash
cat src/types/database.ts
```

**Verify:**
- Types match the SQL schema
- Note any discrepancies
- Identify types you'll use: `Database['public']['Tables']['users']['Row']`

### Step 0.3: Read Existing Patterns
```bash
cat src/dao/base.dao.ts
cat src/lib/supabase/server.ts
cat src/lib/supabase/client.ts
```

**Understand:**
- How BaseDAO works
- How to get Supabase clients
- The tenant isolation pattern

### Step 0.4: Create Schema Reference
Create `.claude/schema-reference.md` with the extracted schema info. This prevents re-reading large files.

---

## Anti-Hallucination Rules

| Rule | Description |
|------|-------------|
| ❌ NEVER | Use a column name you haven't verified in Step 0 |
| ❌ NEVER | Assume a type exists without checking `database.ts` |
| ❌ NEVER | Create a method signature without knowing the actual columns |
| ✅ ALWAYS | Reference your schema notes when writing queries |
| ✅ ALWAYS | Use exact column names from the migration file |
| ✅ ALWAYS | Match TypeScript types to database types |

---

## Coding Standards

| Rule | ✅ DO | ❌ DON'T |
|------|-------|----------|
| Colors | `bg-primary`, `text-muted-foreground` | `bg-blue-500`, `#3B82F6` |
| Architecture | DAO → Service → API Route | Database queries in routes |
| HTTP Client | `api.get()` from `@/lib/api-client` | Raw `fetch()` in components |
| Components | Server components by default | `"use client"` without need |
| Deletes | `deleted_at = new Date()` | `DELETE FROM table` |

---

## Task 1: Auth Layout & Pages

### 1.1: Create Auth Layout

**File:** `src/app/(auth)/layout.tsx`

**Requirements:**
- Centered card layout
- Logo placeholder
- Mobile responsive (works at 375px)
- Uses theme colors only

**Verification:**
```bash
ls -la src/app/\(auth\)/layout.tsx
npm run type-check 2>&1 | grep -E "(error|Error)" | head -5
```

### 1.2: Create Login Page

**File:** `src/app/(auth)/login/page.tsx`

**Requirements:**
- Email/password form
- Zod validation
- Loading state during submit
- Error display
- Link to forgot-password and signup

**Verification:**
```bash
npm run type-check
```

### 1.3: Create Signup Page

**File:** `src/app/(auth)/signup/page.tsx`

**Requirements:**
- Tenant name, email, password, full name fields
- Creates tenant AND admin user
- Zod validation

### 1.4: Create Password Reset Pages

**Files:**
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/verify-email/page.tsx`

---

## Task 2: Auth Server Actions

**File:** `src/app/(auth)/actions.ts`

### 2.1: Read Schema First
Before writing any action, verify these columns exist:
```bash
grep -E "CREATE TABLE (tenants|users)" supabase/migrations/*.sql -A 30
```

### 2.2: Implement Actions

**Functions to create:**
- `login(email: string, password: string)`
- `signup(tenantName: string, email: string, password: string, fullName: string)`
- `forgotPassword(email: string)`
- `resetPassword(token: string, password: string)`
- `logout()`

**Requirements:**
- Use Supabase Auth
- On signup: create tenant record, then user record
- Set `tenant_id` in user metadata
- Handle errors gracefully

---

## Task 3: Tenant DAO & Service

### 3.1: Verify Tenant Columns
```bash
grep "CREATE TABLE tenants" supabase/migrations/*.sql -A 25
```

Note the exact columns before proceeding.

### 3.2: Create Tenant DAO

**File:** `src/dao/tenant.dao.ts`

**Note:** Tenants table does NOT filter by tenant_id (it IS the tenant).

```typescript
// Follow the pattern from base.dao.ts but WITHOUT tenant filtering
// Use exact column names from your schema verification
```

### 3.3: Create Tenant Service

**File:** `src/services/tenant.service.ts`

**Business logic:**
- Create tenant with slug generation
- Check slug availability
- Update tenant settings/branding
- Check within tenant limits

---

## Task 4: User DAO & Service

### 4.1: Verify User Columns
```bash
grep "CREATE TABLE users" supabase/migrations/*.sql -A 20
```

### 4.2: Create User DAO

**File:** `src/dao/user.dao.ts`

**Extends BaseDAO** - uses tenant isolation.

### 4.3: Create User Service

**File:** `src/services/user.service.ts`

---

## Task 5: Auth API Routes

**Files:**
- `src/app/api/auth/me/route.ts` - GET current user
- `src/app/api/auth/session/route.ts` - GET session status

---

## Task 6: Providers & Hooks

### 6.1: Query Provider
**File:** `src/providers/query-provider.tsx`

### 6.2: Auth Hook
**File:** `src/hooks/use-auth.ts`

### 6.3: Auth Provider
**File:** `src/providers/auth-provider.tsx`

### 6.4: App Providers
**File:** `src/app/providers.tsx`

---

## Task 7: Dashboard Layout

### 7.1: Layout
**File:** `src/app/(dashboard)/layout.tsx`

### 7.2: Sidebar
**File:** `src/components/layout/sidebar.tsx`

### 7.3: Header
**File:** `src/components/layout/header.tsx`

### 7.4: Mobile Nav
**File:** `src/components/layout/mobile-nav.tsx`

---

## Task 8: Middleware

**File:** `src/middleware.ts`

**Requirements:**
- Protect `/dashboard/*` routes
- Redirect authenticated users from auth pages
- Use `@/lib/supabase/middleware`

---

## Validation After Each Task

```bash
npm run type-check  # MUST pass
npm run lint        # MUST pass
npm run build       # MUST pass
```

**Fix ALL errors before proceeding to next task.**

---

## Completion Criteria

1. [ ] Schema discovery completed and documented
2. [ ] User can sign up (creates tenant + admin)
3. [ ] User can log in
4. [ ] Password reset flow works
5. [ ] Protected routes redirect to login
6. [ ] Dashboard layout with sidebar shows for authenticated users
7. [ ] `useAuth()` hook returns current user
8. [ ] All forms have validation
9. [ ] UI responsive at 375px, 768px, 1920px
10. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>PHASE_1_COMPLETE</promise>
```

---

## Progress Tracking

Update `.claude/progress.md` after each task:
```markdown
## Phase 1 Progress

### Schema Discovery
- [x] Read migrations
- [x] Read database.ts
- [x] Created schema-reference.md

### Tasks
- [x] Task 1: Auth pages
- [ ] Task 2: Auth actions
...

### Last Validation
type-check: ✅/❌
lint: ✅/❌
build: ✅/❌
```

---

## START HERE

1. Run schema discovery (Phase 0) - **DO NOT SKIP**
2. Create schema reference file
3. Begin Task 1
4. Validate after each task
5. Update progress
6. Continue until all tasks complete
