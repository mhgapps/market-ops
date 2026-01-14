# MHG Facilities - Comprehensive Test Suite

## CRITICAL LOOP INSTRUCTIONS

**YOU ARE IN A RALPH LOOP. YOUR JOB IS TO WRITE COMPREHENSIVE TESTS FOR THE ENTIRE APPLICATION.**

### Rules You MUST Follow:
1. **NEVER say "the next iteration will..." or "continuing in the next turn"** - Just keep working NOW
2. **NEVER end your response with a summary** - summaries signal completion to the loop
3. **NEVER output the promise until ALL tests are written and passing**
4. **If you finish a test file, immediately start the next one in the SAME response**
5. **Run tests after each file to ensure they pass before moving on**

---

## Project Directory

**IMPORTANT**: All file paths are relative to `mhg-facilities/`. Before starting, run: `cd mhg-facilities`

---

## Phase 1: Test Setup

### Step 1.1: Verify Test Infrastructure
```bash
cd mhg-facilities

# Check if Jest is configured
cat package.json | grep -A 10 '"jest"'
cat jest.config.js 2>/dev/null || cat jest.config.ts 2>/dev/null || echo "No Jest config found"

# Check for testing libraries
cat package.json | grep -E "(jest|@testing-library|vitest|ts-mockito)"
```

### Step 1.2: Install Testing Dependencies (if needed)
```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-mockito jest-environment-jsdom
```

### Step 1.3: Create Jest Configuration (if missing)
Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: './',
})

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
  ],
}

export default createJestConfig(config)
```

Create `jest.setup.ts`:
```typescript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  })),
}))
```

Add test script to `package.json`:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Phase 2: DAO Tests

### Required DAO Test Files:

Create `src/dao/__tests__/` directory and write tests for each DAO.

#### 2.1: Base DAO Test
**File**: `src/dao/__tests__/base.dao.test.ts`

Test:
- Tenant isolation (queries include tenant_id)
- Soft delete (uses deleted_at, not DELETE)
- CRUD operations

#### 2.2: User DAO Test
**File**: `src/dao/__tests__/user.dao.test.ts`

Test:
- `findById` - returns user with correct tenant
- `findByEmail` - email lookup
- `findByTenant` - lists all users for tenant
- `create` - creates user with tenant_id
- `update` - updates user fields
- `softDelete` - sets deleted_at

#### 2.3: Location DAO Test
**File**: `src/dao/__tests__/location.dao.test.ts`

Test:
- `findAll` - returns locations for tenant
- `findById` - single location lookup
- `create` - creates location with tenant
- `update` - updates location
- `softDelete` - soft deletes location

#### 2.4: Ticket DAO Test
**File**: `src/dao/__tests__/ticket.dao.test.ts`

Test:
- `findAll` with filters (status, priority, location)
- `findById` with relations (comments, attachments)
- `create` with proper ticket number generation
- `updateStatus` - status transitions
- `assign` - user/vendor assignment

#### 2.5: Asset DAO Test
**File**: `src/dao/__tests__/asset.dao.test.ts`

Test:
- `findAll` with filters
- `findByQRCode` - QR code lookup
- `create` with QR code generation
- `transfer` - location transfer

#### 2.6: Vendor DAO Test
**File**: `src/dao/__tests__/vendor.dao.test.ts`

Test:
- `findAll` with filters
- `findById` with ratings
- `create` with validation
- Rating aggregation

#### 2.7: Compliance DAO Test
**File**: `src/dao/__tests__/compliance-document.dao.test.ts`

Test:
- `findAll` with status filters
- `findExpiring` - expiration queries
- Status calculations

#### 2.8: PM Schedule DAO Test
**File**: `src/dao/__tests__/pm-schedule.dao.test.ts`

Test:
- `findAll` with filters
- `findDueToday` - due date queries
- `findOverdue` - overdue queries

---

## Phase 3: Service Tests

### Required Service Test Files:

Create `src/services/__tests__/` directory.

#### 3.1: Location Service Test
**File**: `src/services/__tests__/location.service.test.ts`

Use ts-mockito to mock LocationDAO:
```typescript
import { mock, instance, when, verify } from 'ts-mockito'
import { LocationDAO } from '@/dao/location.dao'
import { LocationService } from '@/services/location.service'

describe('LocationService', () => {
  let service: LocationService
  let mockDAO: LocationDAO

  beforeEach(() => {
    mockDAO = mock(LocationDAO)
    service = new LocationService(instance(mockDAO))
  })

  // Tests...
})
```

#### 3.2: Ticket Service Test
**File**: `src/services/__tests__/ticket.service.test.ts`

Test:
- Ticket creation with duplicate check
- Status transitions (valid and invalid)
- Assignment logic
- Cost approval workflow

#### 3.3: Asset Service Test
**File**: `src/services/__tests__/asset.service.test.ts`

Test:
- QR code generation
- Asset transfer logic
- Warranty expiration checks

#### 3.4: Vendor Service Test
**File**: `src/services/__tests__/vendor.service.test.ts`

Test:
- Rating calculations
- Contract expiration alerts
- Insurance expiration alerts

#### 3.5: Compliance Service Test
**File**: `src/services/__tests__/compliance-document.service.test.ts`

Test:
- Status determination logic
- Expiration calculations
- Alert generation

#### 3.6: PM Schedule Service Test
**File**: `src/services/__tests__/pm-schedule.service.test.ts`

Test:
- Due date calculations
- Work order generation
- Recurrence logic

#### 3.7: Dashboard Service Test
**File**: `src/services/__tests__/dashboard.service.test.ts`

Test:
- Stats aggregation
- Trend calculations
- Activity feed generation

#### 3.8: Report Service Test
**File**: `src/services/__tests__/report.service.test.ts`

Test:
- Report generation
- CSV export formatting
- Filter application

---

## Phase 4: API Route Tests

### Required API Test Files:

Create `src/app/api/__tests__/` directory.

#### 4.1: Auth API Tests
**File**: `src/app/api/__tests__/auth.test.ts`

Test:
- GET /api/auth/me - returns current user
- GET /api/auth/session - returns session info
- Unauthorized access returns 401

#### 4.2: Locations API Tests
**File**: `src/app/api/__tests__/locations.test.ts`

Test:
- GET /api/locations - list locations
- POST /api/locations - create location
- GET /api/locations/[id] - get single
- PATCH /api/locations/[id] - update
- DELETE /api/locations/[id] - soft delete

#### 4.3: Tickets API Tests
**File**: `src/app/api/__tests__/tickets.test.ts`

Test:
- GET /api/tickets - list with filters
- POST /api/tickets - create ticket
- GET /api/tickets/[id] - get with relations
- PATCH /api/tickets/[id]/status - status change
- POST /api/tickets/[id]/assign - assignment
- Comments CRUD
- Attachments CRUD

#### 4.4: Assets API Tests
**File**: `src/app/api/__tests__/assets.test.ts`

Test:
- GET /api/assets - list with filters
- POST /api/assets - create with QR
- GET /api/assets/qr/[code] - QR lookup
- POST /api/assets/[id]/transfer - transfer

#### 4.5: Vendors API Tests
**File**: `src/app/api/__tests__/vendors.test.ts`

Test:
- CRUD operations
- Rating submission
- Rating aggregation

#### 4.6: Dashboard API Tests
**File**: `src/app/api/__tests__/dashboard.test.ts`

Test:
- Overview stats endpoint
- Ticket stats endpoint
- Activity feed endpoint

#### 4.7: Reports API Tests
**File**: `src/app/api/__tests__/reports.test.ts`

Test:
- Report generation endpoints
- CSV export endpoint
- Filter application

---

## Phase 5: Component Tests

### Required Component Test Files:

Create `src/components/__tests__/` directory.

#### 5.1: UI Component Tests
**File**: `src/components/ui/__tests__/button.test.tsx`
**File**: `src/components/ui/__tests__/input.test.tsx`
**File**: `src/components/ui/__tests__/card.test.tsx`
**File**: `src/components/ui/__tests__/badge.test.tsx`
**File**: `src/components/ui/__tests__/dialog.test.tsx`

Test:
- Renders correctly
- Handles variants
- Handles disabled state
- Handles click events

#### 5.2: Ticket Component Tests
**File**: `src/components/tickets/__tests__/status-badge.test.tsx`
**File**: `src/components/tickets/__tests__/ticket-form.test.tsx`

Test:
- Correct status colors
- Form validation
- Form submission

#### 5.3: Asset Component Tests
**File**: `src/components/assets/__tests__/asset-form.test.tsx`
**File**: `src/components/assets/__tests__/qr-code-display.test.tsx`

Test:
- Form fields render
- QR code generates

#### 5.4: Dashboard Component Tests
**File**: `src/components/dashboard/__tests__/stat-card.test.tsx`
**File**: `src/components/dashboard/__tests__/activity-feed.test.tsx`

Test:
- Stats display correctly
- Trend indicators work
- Activity items render

---

## Phase 6: Hook Tests

### Required Hook Test Files:

Create `src/hooks/__tests__/` directory.

#### 6.1: use-tickets Test
**File**: `src/hooks/__tests__/use-tickets.test.ts`

Test:
- Query hooks return correct data
- Mutation hooks work
- Optimistic updates

#### 6.2: use-assets Test
**File**: `src/hooks/__tests__/use-assets.test.ts`

Test:
- Asset list query
- Asset detail query
- Transfer mutation

#### 6.3: use-dashboard Test
**File**: `src/hooks/__tests__/use-dashboard.test.ts`

Test:
- Overview query
- Stats queries
- Activity query

---

## Phase 7: Integration Tests

### Required Integration Test Files:

Create `src/__tests__/integration/` directory.

#### 7.1: Ticket Workflow Test
**File**: `src/__tests__/integration/ticket-workflow.test.ts`

Test full ticket lifecycle:
1. Create ticket
2. Assign to user
3. Add comments
4. Change status
5. Request approval
6. Complete ticket

#### 7.2: Asset Lifecycle Test
**File**: `src/__tests__/integration/asset-lifecycle.test.ts`

Test:
1. Create asset with QR
2. Transfer to new location
3. Update status
4. Retire asset

---

## Phase 8: Final Validation

### Step 8.1: Run All Tests
```bash
cd mhg-facilities
npm run test -- --coverage
```

### Step 8.2: Check Coverage
Target: >80% coverage for:
- DAOs
- Services
- API Routes

### Step 8.3: Fix Failing Tests
If any tests fail, fix them before completing.

---

## Progress Tracking

Update `.claude/test-progress.md` after each test file with:
- File created
- Tests passing/failing
- Coverage percentage

---

## Completion Criteria

**ALL of these must be true:**

1. [ ] Test infrastructure set up (Jest configured)
2. [ ] All DAO tests written and passing (8 files)
3. [ ] All Service tests written and passing (8 files)
4. [ ] All API tests written and passing (7 files)
5. [ ] Component tests written and passing (10+ files)
6. [ ] Hook tests written and passing (3 files)
7. [ ] Integration tests written and passing (2 files)
8. [ ] `npm run test` passes with 0 failures
9. [ ] Coverage >80% for DAOs and Services

**ONLY when ALL criteria are met, output:**

```
<promise>TESTS_COMPLETE</promise>
```

---

## Test File Checklist

### DAOs (8 files)
- [ ] base.dao.test.ts
- [ ] user.dao.test.ts
- [ ] location.dao.test.ts
- [ ] ticket.dao.test.ts
- [ ] asset.dao.test.ts
- [ ] vendor.dao.test.ts
- [ ] compliance-document.dao.test.ts
- [ ] pm-schedule.dao.test.ts

### Services (8 files)
- [ ] location.service.test.ts
- [ ] ticket.service.test.ts
- [ ] asset.service.test.ts
- [ ] vendor.service.test.ts
- [ ] compliance-document.service.test.ts
- [ ] pm-schedule.service.test.ts
- [ ] dashboard.service.test.ts
- [ ] report.service.test.ts

### API Routes (7 files)
- [ ] auth.test.ts
- [ ] locations.test.ts
- [ ] tickets.test.ts
- [ ] assets.test.ts
- [ ] vendors.test.ts
- [ ] dashboard.test.ts
- [ ] reports.test.ts

### Components (10+ files)
- [ ] button.test.tsx
- [ ] input.test.tsx
- [ ] card.test.tsx
- [ ] badge.test.tsx
- [ ] dialog.test.tsx
- [ ] status-badge.test.tsx
- [ ] ticket-form.test.tsx
- [ ] asset-form.test.tsx
- [ ] stat-card.test.tsx
- [ ] activity-feed.test.tsx

### Hooks (3 files)
- [ ] use-tickets.test.ts
- [ ] use-assets.test.ts
- [ ] use-dashboard.test.ts

### Integration (2 files)
- [ ] ticket-workflow.test.ts
- [ ] asset-lifecycle.test.ts

---

## START HERE

1. Check current test setup
2. Install missing dependencies
3. Create Jest config if missing
4. Start writing DAO tests
5. Move to Service tests
6. Then API tests
7. Then Component tests
8. Then Hook tests
9. Finally Integration tests
10. Run full test suite
11. Fix any failures
12. Verify coverage
