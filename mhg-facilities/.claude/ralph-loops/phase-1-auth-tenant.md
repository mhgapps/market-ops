# Phase 1: Authentication & Tenant Setup

## Context

You are building the MHG Facilities Management System. The project scaffold exists with:
- Next.js 16 with TypeScript and Tailwind CSS 4
- Supabase client configured (`@/lib/supabase/server`, `client`, `server-pooled`)
- BaseDAO with tenant isolation (`@/dao/base.dao.ts`)
- Database types (`@/types/database.ts`)
- Theme system (`@/theme/colors.ts`)
- API client (`@/lib/api-client.ts`)
- shadcn/ui components installed

Database schema is deployed with tables: tenants, users, locations, etc.

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

Implement complete authentication flow with tenant onboarding and user management foundation.

## Tasks

### 1. Auth Pages (UI)

Create authentication pages using shadcn/ui components:

**Files to create:**
- `src/app/(auth)/login/page.tsx` - Login form with email/password
- `src/app/(auth)/signup/page.tsx` - Tenant signup (creates tenant + admin user)
- `src/app/(auth)/forgot-password/page.tsx` - Password reset request
- `src/app/(auth)/reset-password/page.tsx` - Password reset form
- `src/app/(auth)/verify-email/page.tsx` - Email verification landing
- `src/app/(auth)/layout.tsx` - Centered auth layout with branding

**Requirements:**
- Use theme colors from `@/theme/colors`
- Mobile-responsive (test at 375px)
- Form validation with Zod
- Loading states during submission
- Error handling with toast notifications
- Prepare for bilingual support (EN/ES) - use string constants that can later be extracted

### 2. Auth Actions (Server Actions)

Create server actions for auth operations:

**File:** `src/app/(auth)/actions.ts`

```typescript
'use server'
// login(email, password)
// signup(tenantName, email, password, fullName)
// forgotPassword(email)
// resetPassword(token, password)
// verifyEmail(token)
// logout()
```

**Requirements:**
- Use Supabase Auth
- On signup: create tenant record, then create user record linked to tenant
- Set `tenant_id` in user metadata for tenant resolution
- Handle all Supabase auth errors gracefully
- Rate limiting consideration (use Supabase built-in)

### 3. Middleware Protection

Update middleware for route protection:

**File:** `src/middleware.ts`

**Requirements:**
- Protect `/dashboard/*` routes - require authentication
- Redirect authenticated users away from `/login`, `/signup`
- Allow public access to `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`
- Use `@/lib/supabase/middleware` for session management

### 4. Tenant DAO & Service

Create tenant data access and service layers:

**Files:**
- `src/dao/tenant.dao.ts` - Extends BaseDAO for tenants table (note: tenants don't filter by tenant_id)
- `src/services/tenant.service.ts` - Business logic for tenant operations

**DAO Methods:**
```typescript
class TenantDAO {
  findBySlug(slug: string)
  findByEmail(email: string)
  create(data: TenantInsert)
  updateSettings(id: string, settings: Partial<TenantSettings>)
  checkSlugAvailable(slug: string)
}
```

**Service Methods:**
```typescript
class TenantService {
  createTenant(name: string, ownerEmail: string): Promise<Tenant>
  getTenantBySlug(slug: string): Promise<Tenant | null>
  updateTenantBranding(tenantId: string, branding: BrandingSettings)
  isWithinLimits(tenantId: string, resource: 'users' | 'locations'): Promise<boolean>
}
```

### 5. User DAO & Service

Create user data access and service layers:

**Files:**
- `src/dao/user.dao.ts` - Extends BaseDAO for users table
- `src/services/user.service.ts` - Business logic for user operations

**DAO Methods:**
```typescript
class UserDAO extends BaseDAO<'users'> {
  findByEmail(email: string)
  findByAuthUserId(authUserId: string)
  findByLocation(locationId: string)
  findAdmins()
}
```

**Service Methods:**
```typescript
class UserService {
  createUser(data: CreateUserInput): Promise<User>
  getCurrentUser(): Promise<User | null>
  updateProfile(userId: string, data: UpdateProfileInput)
  deactivateUser(userId: string)
  changeRole(userId: string, newRole: UserRole)
}
```

### 6. Auth API Routes

Create API routes for client-side auth operations:

**Files:**
- `src/app/api/auth/me/route.ts` - GET current user
- `src/app/api/auth/session/route.ts` - GET session status

### 7. Query Provider Setup

Create TanStack Query provider for the application:

**Files:**
- `src/providers/query-provider.tsx` - TanStack Query provider with devtools
- `src/app/providers.tsx` - Combined providers wrapper

**Requirements:**
- Configure QueryClient with sensible defaults
- Include ReactQueryDevtools in development
- Wrap entire app with providers

### 8. Auth Hooks & Context

Create client-side auth utilities:

**Files:**
- `src/hooks/use-auth.ts` - Auth state hook using TanStack Query
- `src/providers/auth-provider.tsx` - Auth context provider

**Hook interface:**
```typescript
function useAuth() {
  return {
    user: User | null,
    tenant: TenantContext | null,
    isLoading: boolean,
    isAuthenticated: boolean,
    logout: () => Promise<void>,
    refetch: () => void,
  }
}
```

### 9. Protected Layout

Create the authenticated app layout:

**Files:**
- `src/app/(dashboard)/layout.tsx` - Main app layout with sidebar
- `src/components/layout/sidebar.tsx` - Navigation sidebar
- `src/components/layout/header.tsx` - Top header with user menu
- `src/components/layout/mobile-nav.tsx` - Mobile navigation drawer

**Requirements:**
- Responsive sidebar (collapsible on mobile)
- User dropdown with profile, settings, logout
- Tenant branding display (logo, colors)
- Navigation items based on user role

## Completion Criteria

The phase is complete when:

1. [ ] User can sign up creating a new tenant and admin account
2. [ ] User can log in with email/password
3. [ ] User can request password reset and complete reset flow
4. [ ] Protected routes redirect to login when not authenticated
5. [ ] Authenticated users see dashboard layout with sidebar
6. [ ] `useAuth()` hook returns current user and tenant
7. [ ] All forms have proper validation and error handling
8. [ ] UI is responsive at 375px, 768px, and 1920px widths
9. [ ] `npm run build` passes with no TypeScript errors
10. [ ] No console errors in browser

## Architecture Rules

1. **Never use raw fetch()** - Use `@/lib/api-client` for client components
2. **Never use hex colors** - Use `@/theme/colors` tokens
3. **DAO → Service → Route** - Follow 3-layer architecture
4. **Soft deletes only** - Never use DELETE, use `deleted_at`
5. **Mobile first** - Use responsive Tailwind classes (md:, lg:)
6. **Server Components default** - Only use `"use client"` when needed

## File Checklist

After completion, these files should exist:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── actions.ts
│   ├── (dashboard)/
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/
│   │       ├── me/route.ts
│   │       └── session/route.ts
│   └── providers.tsx
├── components/
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── mobile-nav.tsx
├── dao/
│   ├── tenant.dao.ts
│   └── user.dao.ts
├── services/
│   ├── tenant.service.ts
│   └── user.service.ts
├── hooks/
│   └── use-auth.ts
├── providers/
│   ├── auth-provider.tsx
│   └── query-provider.tsx
└── middleware.ts
```

## Validation Commands (Run After Each Task)

```bash
# Type check - MUST pass
npm run type-check

# Lint check - MUST pass
npm run lint

# Build - MUST pass
npm run build
```

**CRITICAL**: Run these commands after completing each numbered task. Fix any errors before proceeding to the next task.

## RALPH Loop Configuration

### Completion Promise

When ALL completion criteria are met and ALL validation commands pass, output:

```
<promise>PHASE_1_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-1-auth-tenant.md)" --completion-promise "PHASE_1_COMPLETE" --max-iterations 40
```

### If Stuck After 15+ Iterations

If you're not making progress after 15 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 1 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_1_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## Context Management (CRITICAL)

To prevent context overflow across iterations:

### At the START of each iteration:

```bash
# 1. Read progress file to understand current state
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/dao/ src/services/ src/app/\(auth\)/ 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with:
```markdown
## Current Task
[Next task number and name]

## Completed
- [x] Task N: [name] ✅

## Files Created This Iteration
- [list of files]

## Validation Results
npm run type-check: ✅/❌
npm run lint: ✅/❌
npm run build: ✅/❌

## Next Action
[Specific next step]
```

### Commit After Each Task

```bash
git add -A && git commit -m "feat(auth): [task description]"
```

### DO NOT:
- Re-read files you've already created (trust git)
- Explain completed work in conversation
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create `.claude/progress.md` with initial state:

```markdown
# Phase 1 Progress

## Current Task
Task 1: Auth Pages (UI)

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/app/(auth)/layout.tsx
```

Then begin implementation. Work through each task sequentially. Run validation commands after each task.

When complete, output: `<promise>PHASE_1_COMPLETE</promise>`
