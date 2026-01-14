# Phase 2: Location & User Management (v2)

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

- Phase 1 completed
- Authentication working
- User can log in and see dashboard

---

## PHASE 0: MANDATORY SCHEMA DISCOVERY

**BEFORE ANY CODE, VERIFY THE SCHEMA.**

### Step 0.1: Read Location Schema
```bash
cd mhg-facilities
grep "CREATE TABLE locations" supabase/migrations/*.sql -A 20
```

**Document exact columns:**
- id, tenant_id, name, address, city, state, zip, phone
- square_footage, manager_id, emergency_contact_phone
- status (check the enum values!)
- opened_date, closed_date
- created_at, updated_at, deleted_at

### Step 0.2: Read User Schema
```bash
grep "CREATE TABLE users" supabase/migrations/*.sql -A 20
```

**Document exact columns:**
- id, tenant_id, auth_user_id, email, full_name
- role (check user_role enum!)
- phone, location_id, language_preference
- is_active, deactivated_at
- notification_preferences (JSONB structure)

### Step 0.3: Read Invitation Schema
```bash
grep "CREATE TABLE tenant_invitations" supabase/migrations/*.sql -A 15
```

### Step 0.4: Read Existing DAOs
```bash
cat src/dao/base.dao.ts
cat src/dao/user.dao.ts 2>/dev/null || echo "Not created yet"
cat src/dao/tenant.dao.ts 2>/dev/null || echo "Not created yet"
```

### Step 0.5: Update Schema Reference
```bash
# Add location/user columns to schema reference
cat >> .claude/schema-reference.md << 'EOF'

## Locations Table
- id: UUID
- tenant_id: UUID (FK to tenants)
- name: TEXT
- address: TEXT | null
- city: TEXT | null
- state: TEXT | null
- zip: TEXT | null
- phone: TEXT | null
- square_footage: INT | null
- manager_id: UUID | null (FK to users)
- emergency_contact_phone: TEXT | null
- status: location_status ('active' | 'temporarily_closed' | 'permanently_closed')
- opened_date: DATE | null
- closed_date: DATE | null
- created_at, updated_at, deleted_at

## Users Table
- id: UUID
- tenant_id: UUID
- auth_user_id: UUID | null
- email: TEXT
- full_name: TEXT
- role: user_role ('super_admin' | 'admin' | 'manager' | 'staff' | 'vendor' | 'readonly')
- phone: TEXT | null
- location_id: UUID | null
- language_preference: 'en' | 'es'
- is_active: BOOLEAN
- deactivated_at: TIMESTAMPTZ | null
- notification_preferences: JSONB
EOF
```

---

## Anti-Hallucination Checklist

Before writing any DAO/Service method, verify:

- [ ] Column name exists in migration file
- [ ] Column type matches what you're using
- [ ] Enum values are correct
- [ ] Foreign keys reference correct tables

---

## Task 1: Location DAO

### 1.1: Create Location DAO

**File:** `src/dao/location.dao.ts`

**Pattern:** Extend BaseDAO for tenant isolation

```typescript
// Read base.dao.ts first to understand the pattern
// Use ONLY columns verified in Step 0.1
```

**Methods to implement:**
- `findActive()` - Get locations where status = 'active'
- `findByManager(managerId: string)` - Get locations managed by user
- Standard CRUD from BaseDAO

**Verification:**
```bash
npm run type-check 2>&1 | grep "location.dao" || echo "No errors"
```

### 1.2: Create Location Service

**File:** `src/services/location.service.ts`

**Constructor pattern:**
```typescript
class LocationService {
  constructor(
    private locationDAO = new LocationDAO(),
    private userDAO = new UserDAO()
  ) {}
}
```

**Methods:**
- `getAllLocations(tenantId: string)` - List all locations
- `getLocationById(id: string, tenantId: string)`
- `createLocation(data, tenantId: string)`
- `updateLocation(id, data, tenantId: string)`
- `deleteLocation(id, tenantId: string)` - Soft delete
- `assignManager(locationId, managerId, tenantId)`

---

## Task 2: Location API Routes

### 2.1: List & Create Route

**File:** `src/app/api/locations/route.ts`

```typescript
// GET - List locations
// POST - Create location (admin+ only)
```

**Requirements:**
- Get tenant_id from authenticated user
- Validate request body with Zod
- Check tenant limits before creating

### 2.2: Single Location Route

**File:** `src/app/api/locations/[id]/route.ts`

```typescript
// GET - Get single location
// PATCH - Update location
// DELETE - Soft delete location
```

---

## Task 3: Location UI

### 3.1: Location List Page

**File:** `src/app/(dashboard)/locations/page.tsx`

**Features:**
- Table or card grid of locations
- Search by name
- Filter by status
- "Add Location" button (admin only)
- Empty state

### 3.2: Location Form Component

**File:** `src/components/locations/location-form.tsx`

**Fields (from schema):**
- name (required)
- address, city, state, zip
- phone
- square_footage
- manager_id (dropdown of users)
- status (dropdown: active, temporarily_closed, permanently_closed)

### 3.3: Location Detail Page

**File:** `src/app/(dashboard)/locations/[id]/page.tsx`

---

## Task 4: User Management API

### 4.1: Users List & Create

**File:** `src/app/api/users/route.ts`

### 4.2: Single User Route

**File:** `src/app/api/users/[id]/route.ts`

### 4.3: Deactivate User

**File:** `src/app/api/users/[id]/deactivate/route.ts`

---

## Task 5: Email Service

### 5.1: Create SMTP Service

**File:** `src/lib/email/smtp.ts`

```typescript
import nodemailer from 'nodemailer'

// Check if nodemailer is installed
// npm install nodemailer @types/nodemailer
```

### 5.2: Email Template

**File:** `src/lib/email/templates/invitation.ts`

---

## Task 6: Invitation Flow

### 6.1: Invitation Service

**File:** `src/services/invitation.service.ts`

**Verify tenant_invitations columns first!**

### 6.2: Invitation API Routes

**Files:**
- `src/app/api/invitations/route.ts` - POST (send invite)
- `src/app/api/invitations/[token]/route.ts` - GET (validate), POST (accept)

### 6.3: Accept Invitation Page

**File:** `src/app/(public)/accept-invite/[token]/page.tsx`

---

## Task 7: User UI

### 7.1: Users List Page

**File:** `src/app/(dashboard)/users/page.tsx`

### 7.2: Invite User Modal

**File:** `src/components/users/invite-user-modal.tsx`

### 7.3: Edit User Modal

**File:** `src/components/users/edit-user-modal.tsx`

### 7.4: Profile Page

**File:** `src/app/(dashboard)/settings/profile/page.tsx`

---

## Task 8: Role-Based Components

### 8.1: RequireRole Component

**File:** `src/components/auth/require-role.tsx`

```typescript
// Usage: <RequireRole roles={['admin', 'super_admin']}><AdminButton /></RequireRole>
```

---

## Task 9: Validation Schemas

### 9.1: Location Schemas

**File:** `src/lib/validations/location.ts`

**Use exact enum values from schema:**
```typescript
import { z } from 'zod'

export const locationStatusSchema = z.enum([
  'active',
  'temporarily_closed',
  'permanently_closed'
])

export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  // ... other fields matching EXACT schema columns
})
```

### 9.2: User Schemas

**File:** `src/lib/validations/user.ts`

---

## Validation After Each Task

```bash
npm run type-check  # MUST pass
npm run lint        # MUST pass
npm run build       # MUST pass
```

---

## Completion Criteria

1. [ ] Schema verified and documented
2. [ ] Admin can create/edit/delete locations
3. [ ] Location list with search/filter works
4. [ ] Location detail page shows info
5. [ ] Admin can invite users via email
6. [ ] Invited users can accept and create account
7. [ ] User list with role badges works
8. [ ] Admin can edit roles and deactivate users
9. [ ] Users can edit own profile
10. [ ] Role-based UI hides admin actions
11. [ ] Tenant limits enforced
12. [ ] All forms validated
13. [ ] UI responsive at 375px, 768px, 1920px
14. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>PHASE_2_COMPLETE</promise>
```

---

## Progress Tracking

Update `.claude/progress.md` after each task.

---

## START HERE

1. Run schema discovery (Phase 0) - **DO NOT SKIP**
2. Update schema reference file
3. Begin Task 1 (Location DAO)
4. Validate after each task
5. Update progress
6. Continue until complete
