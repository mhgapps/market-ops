# Phase 4: Assets & Vendors

## Prerequisites

- Phase 1-3 completed
- Tickets can be created and managed
- Locations exist in the system

## Context

Assets and vendors are critical for tracking equipment and external service providers. Assets can be linked to tickets, and vendors can be assigned to work on tickets.

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

Implement complete asset management with QR codes, warranty tracking, and vendor management with ratings.

## Tasks

### 1. Asset Category DAO & Service

**Files:**
- `src/dao/asset-category.dao.ts`
- `src/services/asset-category.service.ts`

```typescript
class AssetCategoryDAO extends BaseDAO<'asset_categories'> {
  findWithParent(): Promise<AssetCategoryWithParent[]>
  findChildren(parentId: string): Promise<AssetCategory[]>
  findTopLevel(): Promise<AssetCategory[]>
}

class AssetCategoryService {
  getAllCategories(): Promise<AssetCategoryTree[]>
  createCategory(data: CreateCategoryInput): Promise<AssetCategory>
  updateCategory(id: string, data: UpdateCategoryInput): Promise<AssetCategory>
  deleteCategory(id: string): Promise<void>
}
```

### 2. Asset DAO & Service

**Files:**
- `src/dao/asset.dao.ts`
- `src/services/asset.service.ts`

**DAO Methods:**
```typescript
class AssetDAO extends BaseDAO<'assets'> {
  findByLocation(locationId: string): Promise<Asset[]>
  findByCategory(categoryId: string): Promise<Asset[]>
  findByQRCode(qrCode: string): Promise<Asset | null>
  findByStatus(status: AssetStatus): Promise<Asset[]>
  findWithWarrantyExpiring(daysAhead: number): Promise<Asset[]>
  findWithRelations(id: string): Promise<AssetWithRelations | null>
  search(query: string): Promise<Asset[]>
}
```

**Service Methods:**
```typescript
class AssetService {
  constructor(
    private assetDAO = new AssetDAO(),
    private categoryDAO = new AssetCategoryDAO(),
    private locationDAO = new LocationDAO(),
    private vendorDAO = new VendorDAO()
  )

  // Queries
  getAllAssets(filters?: AssetFilters): Promise<Asset[]>
  getAssetById(id: string): Promise<AssetWithRelations | null>
  getAssetByQRCode(qrCode: string): Promise<Asset | null>
  getAssetsByLocation(locationId: string): Promise<Asset[]>
  getExpiringWarranties(days: number): Promise<Asset[]>
  getAssetStats(): Promise<AssetStats>
  getMaintenanceHistory(assetId: string): Promise<AssetHistory[]>

  // Commands
  createAsset(data: CreateAssetInput): Promise<Asset>
  updateAsset(id: string, data: UpdateAssetInput): Promise<Asset>
  deleteAsset(id: string): Promise<void>
  transferAsset(assetId: string, toLocationId: string, userId: string, reason: string): Promise<Asset>
  generateQRCode(assetId: string): Promise<string>
  uploadPhoto(assetId: string, file: File): Promise<Asset>
  uploadManual(assetId: string, file: File): Promise<Asset>
  retireAsset(assetId: string, reason: string): Promise<Asset>
}
```

### 3. Asset Transfer Service

**Files:**
- `src/dao/asset-transfer.dao.ts`
- `src/services/asset-transfer.service.ts`

```typescript
class AssetTransferService {
  recordTransfer(assetId: string, fromLocationId: string, toLocationId: string, userId: string, reason: string): Promise<AssetTransfer>
  getTransferHistory(assetId: string): Promise<AssetTransfer[]>
}
```

### 4. Vendor DAO & Service

**Files:**
- `src/dao/vendor.dao.ts`
- `src/services/vendor.service.ts`

**DAO Methods:**
```typescript
class VendorDAO extends BaseDAO<'vendors'> {
  findActive(): Promise<Vendor[]>
  findPreferred(): Promise<Vendor[]>
  findByServiceCategory(category: string): Promise<Vendor[]>
  findWithExpiringInsurance(daysAhead: number): Promise<Vendor[]>
  findWithExpiringContract(daysAhead: number): Promise<Vendor[]>
  findWithRatings(id: string): Promise<VendorWithRatings | null>
}
```

**Service Methods:**
```typescript
class VendorService {
  constructor(
    private vendorDAO = new VendorDAO(),
    private vendorRatingDAO = new VendorRatingDAO()
  )

  // Queries
  getAllVendors(filters?: VendorFilters): Promise<Vendor[]>
  getVendorById(id: string): Promise<VendorWithRatings | null>
  getPreferredVendors(): Promise<Vendor[]>
  getVendorsByCategory(category: string): Promise<Vendor[]>
  getExpiringInsurance(days: number): Promise<Vendor[]>
  getExpiringContracts(days: number): Promise<Vendor[]>
  getVendorStats(vendorId: string): Promise<VendorStats>

  // Commands
  createVendor(data: CreateVendorInput): Promise<Vendor>
  updateVendor(id: string, data: UpdateVendorInput): Promise<Vendor>
  deleteVendor(id: string): Promise<void>
  togglePreferred(id: string): Promise<Vendor>
  deactivateVendor(id: string): Promise<Vendor>
}
```

### 5. Vendor Rating Service

**Files:**
- `src/dao/vendor-rating.dao.ts`
- `src/services/vendor-rating.service.ts`

```typescript
class VendorRatingService {
  rateVendor(vendorId: string, ticketId: string, userId: string, ratings: VendorRatingInput): Promise<VendorRating>
  getVendorRatings(vendorId: string): Promise<VendorRating[]>
  getAverageRatings(vendorId: string): Promise<VendorAverageRatings>
}
```

### 6. Asset API Routes

**Files:**
- `src/app/api/assets/route.ts` - GET (list), POST (create)
- `src/app/api/assets/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/assets/[id]/transfer/route.ts` - POST
- `src/app/api/assets/[id]/photo/route.ts` - POST
- `src/app/api/assets/[id]/manual/route.ts` - POST
- `src/app/api/assets/qr/[code]/route.ts` - GET (lookup by QR)
- `src/app/api/asset-categories/route.ts` - GET, POST
- `src/app/api/asset-categories/[id]/route.ts` - PATCH, DELETE

### 7. Vendor API Routes

**Files:**
- `src/app/api/vendors/route.ts` - GET (list), POST (create)
- `src/app/api/vendors/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/vendors/[id]/ratings/route.ts` - GET, POST

### 8. Asset List Page

**File:** `src/app/(dashboard)/assets/page.tsx`

**Features:**
- Grid/list view toggle
- Filter by location, category, status
- Search by name, serial number
- Quick stats: total, by status, warranty expiring
- "Add Asset" button (admin/manager)
- Bulk actions: transfer, retire

### 9. Asset Detail Page

**File:** `src/app/(dashboard)/assets/[id]/page.tsx`

**Features:**
- Asset info card with photo
- QR code display and download
- Warranty status indicator
- Location info
- Vendor info (if linked)
- Maintenance history timeline
- Related tickets list
- Action buttons: edit, transfer, retire
- Manual/spec sheet download links

### 10. Asset Form

**File:** `src/components/assets/asset-form.tsx`

**Features:**
- Multi-step or single page form
- Fields: name, category, location, serial, model, manufacturer, purchase info, warranty, vendor, notes
- Photo upload with preview
- Manual/spec sheet upload
- QR code auto-generation on create

### 11. Asset Transfer Modal

**File:** `src/components/assets/transfer-modal.tsx`

**Features:**
- Select destination location
- Reason field
- Confirmation step
- Records transfer in asset_transfers table

### 12. QR Code Components

**Files:**
- `src/components/assets/qr-scanner.tsx` - Camera-based QR scanning
- `src/components/assets/qr-code-display.tsx` - QR code generation/display

**Scanner Features:**
- Camera-based QR scanning (use `html5-qrcode` library)
- Navigate to asset detail on scan
- Fallback: manual code entry

**Display Features:**
- Generate QR code from asset ID (use `qrcode` library)
- Downloadable PNG export
- Printable format

**Note:** Install `html5-qrcode` for scanning and `qrcode` for generation

### 13. Vendor List Page

**File:** `src/app/(dashboard)/vendors/page.tsx`

**Features:**
- List all vendors with rating stars
- Filter by service category, status, preferred
- Search by name
- Quick actions: edit, view, toggle preferred
- "Add Vendor" button (admin)

### 14. Vendor Detail Page

**File:** `src/app/(dashboard)/vendors/[id]/page.tsx`

**Features:**
- Vendor info card
- Contact information
- Service categories tags
- Contract/insurance expiration warnings
- Average ratings display
- Recent tickets assigned
- Rating history
- Action buttons: edit, deactivate

### 15. Vendor Form

**File:** `src/components/vendors/vendor-form.tsx`

**Features:**
- Contact info fields
- Service categories (multi-select)
- Contract dates
- Insurance info
- Hourly rate
- Notes

### 16. Vendor Rating Component

**File:** `src/components/vendors/vendor-rating-form.tsx`

**Features:**
- Star ratings for: overall, response time, quality, cost
- Comments field
- Linked to completed ticket

### 17. Zod Schemas

**File:** `src/lib/validations/asset.ts`

```typescript
export const createAssetSchema = z.object({
  name: z.string().min(1).max(200),
  category_id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  serial_number: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchase_date: z.string().date().optional(),
  purchase_price: z.number().positive().optional(),
  warranty_expiration: z.string().date().optional(),
  expected_lifespan_years: z.number().int().positive().optional(),
  vendor_id: z.string().uuid().optional(),
  notes: z.string().optional(),
})
```

**File:** `src/lib/validations/vendor.ts`

```typescript
export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  contact_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  emergency_phone: z.string().optional(),
  address: z.string().optional(),
  service_categories: z.array(z.string()),
  contract_start_date: z.string().date().optional(),
  contract_expiration: z.string().date().optional(),
  insurance_expiration: z.string().date().optional(),
  insurance_minimum_required: z.number().positive().optional(),
  hourly_rate: z.number().positive().optional(),
  notes: z.string().optional(),
})

export const vendorRatingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  response_time_rating: z.number().int().min(1).max(5),
  quality_rating: z.number().int().min(1).max(5),
  cost_rating: z.number().int().min(1).max(5),
  comments: z.string().optional(),
})
```

### 18. Asset & Vendor Hooks

**File:** `src/hooks/use-assets.ts`

```typescript
function useAssets(filters?: AssetFilters)
function useAsset(id: string)
function useAssetByQR(code: string)
function useAssetMutations()
```

**File:** `src/hooks/use-vendors.ts`

```typescript
function useVendors(filters?: VendorFilters)
function useVendor(id: string)
function useVendorMutations()
```

## Completion Criteria

1. [ ] Admin can create, edit, soft-delete assets
2. [ ] Assets can be transferred between locations with history
3. [ ] QR codes auto-generated and scannable
4. [ ] QR scanner navigates to asset detail
5. [ ] Asset photos and manuals upload to storage
6. [ ] Warranty expiration alerts visible
7. [ ] Admin can create, edit, soft-delete vendors
8. [ ] Vendors can be rated after ticket completion
9. [ ] Average vendor ratings displayed
10. [ ] Contract/insurance expiration warnings shown
11. [ ] Assets linkable to tickets
12. [ ] Vendors assignable to tickets
13. [ ] All forms have proper validation
14. [ ] UI responsive at 375px, 768px, 1920px
15. [ ] `npm run type-check && npm run lint && npm run build` passes

## Validation Commands (Run After Each Task)

```bash
npm run type-check
npm run lint
npm run build
```

**CRITICAL**: Run after each numbered task. Fix errors before proceeding.

## RALPH Loop Configuration

### Completion Promise

When ALL completion criteria are met and ALL validation commands pass, output:

```
<promise>PHASE_4_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-4-assets-vendors.md)" --completion-promise "PHASE_4_COMPLETE" --max-iterations 50
```

### If Stuck After 18+ Iterations

If you're not making progress after 18 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 4 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_4_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## File Checklist

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── assets/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── vendors/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── assets/
│       │   ├── route.ts
│       │   ├── qr/[code]/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── transfer/route.ts
│       │       ├── photo/route.ts
│       │       └── manual/route.ts
│       ├── asset-categories/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── vendors/
│           ├── route.ts
│           └── [id]/
│               ├── route.ts
│               └── ratings/route.ts
├── components/
│   ├── assets/
│   │   ├── asset-form.tsx
│   │   ├── transfer-modal.tsx
│   │   ├── qr-scanner.tsx
│   │   └── qr-code-display.tsx
│   └── vendors/
│       ├── vendor-form.tsx
│       └── vendor-rating-form.tsx
├── dao/
│   ├── asset.dao.ts
│   ├── asset-category.dao.ts
│   ├── asset-transfer.dao.ts
│   ├── vendor.dao.ts
│   └── vendor-rating.dao.ts
├── services/
│   ├── asset.service.ts
│   ├── asset-category.service.ts
│   ├── asset-transfer.service.ts
│   ├── vendor.service.ts
│   └── vendor-rating.service.ts
├── hooks/
│   ├── use-assets.ts
│   └── use-vendors.ts
└── lib/
    └── validations/
        ├── asset.ts
        └── vendor.ts
```

## Context Management (CRITICAL)

To prevent context overflow across iterations:

### At the START of each iteration:

```bash
# 1. Read progress file
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/dao/asset*.ts src/dao/vendor*.ts 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with completed tasks, files created, and validation results.

### Commit After Each Task

```bash
git add -A && git commit -m "feat(assets): [task description]"
# or
git add -A && git commit -m "feat(vendors): [task description]"
```

### DO NOT:
- Re-read files from Phase 1-3 (they're complete)
- Explain completed work in conversation
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create/update `.claude/progress.md`:

```markdown
# Phase 4 Progress

## Current Task
Task 1: Asset Category DAO & Service

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/dao/asset-category.dao.ts
```

Then begin implementation. Work through tasks sequentially. Run validation commands after each task.

When complete, output: `<promise>PHASE_4_COMPLETE</promise>`
