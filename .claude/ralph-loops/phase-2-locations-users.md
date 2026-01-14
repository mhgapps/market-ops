# Phase 2: Location & User Management

## Project Directory

**IMPORTANT**: All file paths are relative to `mhg-facilities/`. The project root is `mhg-facilities/`.

Before starting, run: `cd mhg-facilities`

## Prerequisites

- Phase 1 completed (Authentication working)
- User can log in and see dashboard layout

## Context

Building on Phase 1, we now implement location and user management. These are foundational entities that tickets, assets, and other features depend on.

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

Implement complete CRUD for locations and users with role-based access control.

## Tasks

### 1. Location DAO & Service

**Files:**
- `src/dao/location.dao.ts`
- `src/services/location.service.ts`

**DAO Methods:**
```typescript
class LocationDAO extends BaseDAO<'locations'> {
  findActive(): Promise<Location[]>
  findByManager(managerId: string): Promise<Location[]>
  findWithStats(): Promise<LocationWithStats[]>  // Include ticket/asset counts
}
```

**Service Methods:**
```typescript
class LocationService {
  constructor(
    private locationDAO = new LocationDAO(),
    private userDAO = new UserDAO()
  )

  getAllLocations(): Promise<Location[]>
  getLocationById(id: string): Promise<Location | null>
  createLocation(data: CreateLocationInput): Promise<Location>
  updateLocation(id: string, data: UpdateLocationInput): Promise<Location>
  deleteLocation(id: string): Promise<void>  // Soft delete
  assignManager(locationId: string, managerId: string): Promise<Location>
  getLocationStats(locationId: string): Promise<LocationStats>
  checkWithinTenantLimit(): Promise<boolean>
}
```

### 2. Location API Routes

**Files:**
- `src/app/api/locations/route.ts` - GET (list), POST (create)
- `src/app/api/locations/[id]/route.ts` - GET, PATCH, DELETE

**Requirements:**
- Validate request body with Zod schemas
- Check tenant limits before creating
- Only admin+ can create/edit locations
- Return proper HTTP status codes

### 3. Location List Page

**File:** `src/app/(dashboard)/locations/page.tsx`

**Features:**
- List all locations in a responsive table/card grid
- Search/filter by name, status
- Sort by name, created date
- Quick actions: edit, view details
- "Add Location" button (admin+ only)
- Empty state when no locations

### 4. Location Form Component

**File:** `src/components/locations/location-form.tsx`

**Features:**
- Reusable for create and edit
- Fields: name, address, city, state, zip, phone, square footage, manager, status
- Manager dropdown populated from users
- Form validation with Zod
- Loading state during submission

### 5. Location Detail Page

**File:** `src/app/(dashboard)/locations/[id]/page.tsx`

**Features:**
- Location info card
- Manager info with contact
- Quick stats (tickets, assets)
- Recent activity
- Edit button (admin+ only)

### 6. User Management API Routes

**Files:**
- `src/app/api/users/route.ts` - GET (list), POST (create/invite)
- `src/app/api/users/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/users/[id]/deactivate/route.ts` - POST

**Requirements:**
- Check tenant user limits before inviting
- Only admin+ can manage users
- Cannot deactivate yourself
- Cannot change super_admin's role

### 7. Email Service (SMTP)

**File:** `src/lib/email/smtp.ts`

```typescript
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<void>
```

**Required env vars:**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourapp.com
```

### 8. User Invitation Flow

**Files:**
- `src/services/invitation.service.ts`
- `src/lib/email/templates/invitation.ts` - HTML email template
- `src/app/api/invitations/route.ts` - POST (send invite)
- `src/app/api/invitations/[token]/route.ts` - GET (validate), POST (accept)
- `src/app/(auth)/accept-invite/[token]/page.tsx` - Accept invitation UI

**Flow:**
1. Admin invites user with email and role
2. System creates invitation record with token
3. Email sent with invitation link (via SMTP/nodemailer)
4. User clicks link, sets password, account created

### 9. Users List Page

**File:** `src/app/(dashboard)/users/page.tsx`

**Features:**
- List all users with role badges
- Filter by role, status, location
- Search by name, email
- Quick actions: edit, deactivate
- "Invite User" button (admin+ only)
- Show active vs deactivated

### 10. User Form/Invite Modal

**Files:**
- `src/components/users/invite-user-modal.tsx`
- `src/components/users/edit-user-modal.tsx`

**Features:**
- Invite: email, role, location (optional)
- Edit: name, role, location, notification preferences
- Role dropdown based on current user's role (can't assign higher role)

### 11. User Profile Page

**File:** `src/app/(dashboard)/settings/profile/page.tsx`

**Features:**
- View/edit own profile
- Change password
- Notification preferences
- Language preference (EN/ES)

### 12. Role-Based UI Components

**File:** `src/components/auth/require-role.tsx`

```typescript
// Usage: <RequireRole roles={['admin', 'super_admin']}><AdminButton /></RequireRole>
function RequireRole({
  roles,
  children,
  fallback
}: {
  roles: UserRole[],
  children: ReactNode,
  fallback?: ReactNode
})
```

### 13. Zod Schemas

**File:** `src/lib/validations/location.ts`

```typescript
export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  zip: z.string().optional(),
  phone: z.string().optional(),
  square_footage: z.number().positive().optional(),
  manager_id: z.string().uuid().optional(),
  status: z.enum(['active', 'temporarily_closed', 'permanently_closed']).default('active'),
})
```

**File:** `src/lib/validations/user.ts`

```typescript
export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'staff', 'vendor', 'readonly']),
  location_id: z.string().uuid().optional(),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'staff', 'vendor', 'readonly']).optional(),
  location_id: z.string().uuid().nullable().optional(),
  phone: z.string().optional(),
  language_preference: z.enum(['en', 'es']).optional(),
  notification_preferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    push: z.boolean(),
  }).optional(),
})
```

## Completion Criteria

1. [ ] Admin can create, edit, soft-delete locations
2. [ ] Location list shows all tenant locations with search/filter
3. [ ] Location detail page shows stats and manager info
4. [ ] Admin can invite users via email
5. [ ] Invited users can accept invite and create account
6. [ ] User list shows all tenant users with role badges
7. [ ] Admin can edit user roles and deactivate users
8. [ ] Users can edit their own profile and preferences
9. [ ] Role-based UI hides admin actions from non-admins
10. [ ] Tenant limits enforced (max_users, max_locations)
11. [ ] All forms have proper validation
12. [ ] UI responsive at 375px, 768px, 1920px
13. [ ] `npm run type-check && npm run lint && npm run build` passes

## Validation Commands (Run After Each Task)

```bash
# ALWAYS run from mhg-facilities directory
cd mhg-facilities

# Type check - MUST pass
npm run type-check

# Lint check - MUST pass
npm run lint

# Build - MUST pass
npm run build
```

**CRITICAL**: Run these commands after completing each numbered task. Fix any errors before proceeding.

## RALPH Loop Configuration

### Completion Promise

When ALL completion criteria are met and ALL validation commands pass, output:

```
<promise>PHASE_2_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-2-locations-users.md)" --completion-promise "PHASE_2_COMPLETE" --max-iterations 40
```

### If Stuck After 15+ Iterations

If you're not making progress after 15 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 2 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_2_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## Architecture Rules

1. **DAO → Service → Route** - Never skip layers
2. **BaseDAO for tenant tables** - Ensures tenant isolation
3. **Zod validation** - Validate all inputs at API boundary
4. **Role checks in service** - Services verify permissions
5. **Soft deletes only** - Never hard delete

## File Checklist

```
src/
├── app/
│   ├── (auth)/
│   │   └── accept-invite/[token]/page.tsx
│   ├── (dashboard)/
│   │   ├── locations/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── users/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── profile/page.tsx
│   └── api/
│       ├── locations/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── users/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   └── [id]/deactivate/route.ts
│       └── invitations/
│           ├── route.ts
│           └── [token]/route.ts
├── components/
│   ├── locations/
│   │   └── location-form.tsx
│   ├── users/
│   │   ├── invite-user-modal.tsx
│   │   └── edit-user-modal.tsx
│   └── auth/
│       └── require-role.tsx
├── dao/
│   └── location.dao.ts
├── services/
│   ├── location.service.ts
│   └── invitation.service.ts
└── lib/
    ├── email/
    │   ├── smtp.ts
    │   └── templates/
    │       └── invitation.ts
    └── validations/
        ├── location.ts
        └── user.ts
```

## Context Management (CRITICAL)

To prevent context overflow across iterations:

### At the START of each iteration:

```bash
# 0. Always work from mhg-facilities
cd mhg-facilities

# 1. Read progress file to understand current state
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/dao/ src/services/ src/app/\(dashboard\)/locations/ 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with completed tasks, files created, and validation results.

### Commit After Each Task

```bash
git add -A && git commit -m "feat(locations): [task description]"
```

### DO NOT:
- Re-read files from Phase 1 (they're complete)
- Explain completed work in conversation
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create/update `.claude/progress.md`:

```markdown
# Phase 2 Progress

## Current Task
Task 1: Location DAO & Service

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/dao/location.dao.ts
```

Then begin implementation. Work through tasks sequentially. Run validation commands after each task.

When complete, output: `<promise>PHASE_2_COMPLETE</promise>`
