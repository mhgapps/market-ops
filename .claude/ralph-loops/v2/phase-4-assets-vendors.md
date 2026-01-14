# Phase 4: Assets & Vendors (v2)

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

- Phase 1-3 completed
- Tickets working
- Authentication working

---

## PHASE 0: MANDATORY SCHEMA DISCOVERY

### Step 0.1: Read Asset-Related Tables
```bash
cd mhg-facilities

# Asset categories
grep "CREATE TABLE asset_categories" supabase/migrations/*.sql -A 12

# Assets
grep "CREATE TABLE assets" supabase/migrations/*.sql -A 35

# Asset transfers (audit table - no soft delete!)
grep "CREATE TABLE asset_transfers" supabase/migrations/*.sql -A 15
```

### Step 0.2: Read Vendor-Related Tables
```bash
# Vendors
grep "CREATE TABLE vendors" supabase/migrations/*.sql -A 25

# Vendor ratings (audit table - no soft delete!)
grep "CREATE TABLE vendor_ratings" supabase/migrations/*.sql -A 15
```

### Step 0.3: Read Enums
```bash
grep "CREATE TYPE asset_status" supabase/migrations/*.sql -A 8
```

### Step 0.4: Check TypeScript Types
```bash
grep -A 50 "assets:" src/types/database.ts
grep -A 30 "vendors:" src/types/database.ts
```

**IMPORTANT:** `asset_transfers` and `vendor_ratings` may NOT be in generated types. Check if you need to extend the types.

### Step 0.5: Document Schema

```markdown
## Assets Table
- id: UUID
- tenant_id: UUID
- name: TEXT
- category_id: UUID | null (FK asset_categories)
- location_id: UUID | null (FK locations)
- serial_number: TEXT | null
- model: TEXT | null
- manufacturer: TEXT | null
- purchase_date: DATE | null
- purchase_price: DECIMAL | null
- warranty_expiration: DATE | null
- expected_lifespan_years: INT | null
- vendor_id: UUID | null (FK vendors)
- status: asset_status ('active' | 'under_maintenance' | 'retired' | 'transferred' | 'disposed')
- qr_code: TEXT | null (UNIQUE per tenant)
- manual_url: TEXT | null
- spec_sheet_path: TEXT | null
- photo_path: TEXT | null
- notes: TEXT | null
- created_at, updated_at, deleted_at

## Asset Transfers Table (AUDIT - NO SOFT DELETE)
- id: UUID
- asset_id: UUID (FK assets)
- from_location_id: UUID (FK locations)
- to_location_id: UUID (FK locations)
- transferred_by: UUID (FK users)
- transferred_at: TIMESTAMPTZ
- reason: TEXT | null
- notes: TEXT | null

## Vendors Table
- id: UUID
- tenant_id: UUID
- name: TEXT
- contact_name: TEXT | null
- email: TEXT | null
- phone: TEXT | null
- emergency_phone: TEXT | null
- address: TEXT | null
- service_categories: TEXT[] (array!)
- is_preferred: BOOLEAN
- contract_start_date: DATE | null
- contract_expiration: DATE | null
- insurance_expiration: DATE | null
- insurance_minimum_required: DECIMAL | null
- hourly_rate: DECIMAL | null
- notes: TEXT | null
- is_active: BOOLEAN
- created_at, updated_at, deleted_at

## Vendor Ratings Table (AUDIT - NO SOFT DELETE)
- id: UUID
- vendor_id: UUID (FK vendors)
- ticket_id: UUID (FK tickets)
- rated_by: UUID (FK users)
- rating: INT (1-5)
- response_time_rating: INT (1-5)
- quality_rating: INT (1-5)
- cost_rating: INT (1-5)
- comments: TEXT | null
- created_at
```

---

## Type Extension Warning

If `asset_transfers` or `vendor_ratings` are not in `database.ts`, create:

**File:** `src/types/database-extensions.ts`

```typescript
// Extend the Database type for tables not in generated types
export interface AssetTransfer {
  id: string
  asset_id: string
  from_location_id: string
  to_location_id: string
  transferred_by: string
  transferred_at: string
  reason: string | null
  notes: string | null
}

export interface VendorRating {
  id: string
  vendor_id: string
  ticket_id: string
  rated_by: string
  rating: number
  response_time_rating: number
  quality_rating: number
  cost_rating: number
  comments: string | null
  created_at: string
}
```

---

## Task 1: Asset Category DAO & Service

### 1.1: Verify Schema
```bash
grep "CREATE TABLE asset_categories" supabase/migrations/*.sql -A 12
```

Note: Has `parent_category_id` for hierarchy!

### 1.2: Create DAO

**File:** `src/dao/asset-category.dao.ts`

### 1.3: Create Service

**File:** `src/services/asset-category.service.ts`

**Features:**
- Hierarchical categories (parent/child)
- Prevent circular references
- Inherit default lifespan from parent

---

## Task 2: Asset DAO & Service

### 2.1: Create DAO

**File:** `src/dao/asset.dao.ts`

**Methods:**
- `findByLocation(locationId)`
- `findByCategory(categoryId)`
- `findByStatus(status)`
- `findByQRCode(qrCode)` - QR lookup
- `findWithWarrantyExpiring(days)` - Warranty alerts

### 2.2: Create Service

**File:** `src/services/asset.service.ts`

**Features:**
- Auto-generate QR code on create (format: `AST-{nanoid(8)}`)
- Warranty expiration tracking
- Status lifecycle management

---

## Task 3: Asset Transfer Service

### 3.1: Create DAO

**File:** `src/dao/asset-transfer.dao.ts`

**IMPORTANT:** This is an audit table - NO soft deletes. Records are immutable.

### 3.2: Create Service

**File:** `src/services/asset-transfer.service.ts`

**Features:**
- Record transfers (immutable audit trail)
- Get transfer history for asset
- Bulk transfer support

---

## Task 4: Vendor DAO & Service

### 4.1: Create DAO

**File:** `src/dao/vendor.dao.ts`

### 4.2: Create Service

**File:** `src/services/vendor.service.ts`

**Features:**
- Contract expiration monitoring
- Insurance expiration alerts
- Service category filtering
- Preferred vendor flagging

---

## Task 5: Vendor Rating Service

### 5.1: Create DAO

**File:** `src/dao/vendor-rating.dao.ts`

**IMPORTANT:** Audit table - immutable records.

### 5.2: Create Service

**File:** `src/services/vendor-rating.service.ts`

**Features:**
- One rating per ticket (enforce uniqueness)
- Calculate average ratings
- Rating distribution stats

---

## Task 6: API Routes

### 6.1: Asset Category Routes

**Files:**
- `src/app/api/asset-categories/route.ts`
- `src/app/api/asset-categories/[id]/route.ts`

### 6.2: Asset Routes

**Files:**
- `src/app/api/assets/route.ts`
- `src/app/api/assets/[id]/route.ts`
- `src/app/api/assets/[id]/transfer/route.ts`
- `src/app/api/assets/qr/[code]/route.ts`

### 6.3: Vendor Routes

**Files:**
- `src/app/api/vendors/route.ts`
- `src/app/api/vendors/[id]/route.ts`
- `src/app/api/vendors/[id]/ratings/route.ts`

---

## Task 7: Validation Schemas

**File:** `src/lib/validations/assets-vendors.ts`

```typescript
export const assetStatusSchema = z.enum([
  'active', 'under_maintenance', 'retired', 'transferred', 'disposed'
])
```

---

## Task 8: Hooks

**Files:**
- `src/hooks/use-asset-categories.ts`
- `src/hooks/use-assets.ts`
- `src/hooks/use-vendors.ts`

---

## Task 9: Asset UI Components

**Files:**
- `src/components/assets/asset-form.tsx`
- `src/components/assets/transfer-modal.tsx`
- `src/components/assets/qr-scanner.tsx` - Camera-based QR scanning
- `src/components/assets/qr-code-display.tsx` - Show/print QR code

**Dependencies:**
```bash
npm install html5-qrcode qrcode @types/qrcode
```

---

## Task 10: Asset Pages

**Files:**
- `src/app/(dashboard)/assets/page.tsx`
- `src/app/(dashboard)/assets/[id]/page.tsx`

---

## Task 11: Vendor UI Components

**Files:**
- `src/components/vendors/vendor-form.tsx`
- `src/components/vendors/vendor-rating-form.tsx`

---

## Task 12: Vendor Pages

**Files:**
- `src/app/(dashboard)/vendors/page.tsx`
- `src/app/(dashboard)/vendors/[id]/page.tsx`

---

## Validation After Each Task

```bash
npm run type-check  # MUST pass
npm run lint        # MUST pass
npm run build       # MUST pass
```

---

## Completion Criteria

1. [ ] Schema fully documented
2. [ ] Asset categories with hierarchy work
3. [ ] Assets have auto-generated QR codes
4. [ ] Asset transfers create audit trail
5. [ ] QR scanner finds assets
6. [ ] Vendors with service categories work
7. [ ] Vendor ratings calculate averages
8. [ ] Contract/insurance expiration tracking works
9. [ ] All API routes functional
10. [ ] All forms validated
11. [ ] UI responsive
12. [ ] `npm run build` passes

**ONLY when ALL criteria met, output:**
```
<promise>PHASE_4_COMPLETE</promise>
```

---

## START HERE

1. Run schema discovery (Phase 0) - **DO NOT SKIP**
2. Check if type extensions needed
3. Begin Task 1
4. Validate after each task
5. Continue until complete
