# Phase 8: Deep Review - Audit Issues Tracker

**Purpose**: Track all schema alignment issues found during deep review
**Date Started**: 2026-01-14

---

## Issue Summary

- **CRITICAL**: 2 (Schema mismatches in DAO and Form)
- **HIGH**: 8 (Test files using hallucinated columns)
- **MEDIUM**: 3 (Component prop mismatches)
- **LOW**: 0
- **TOTAL**: 13

---

## Issues Found

### DAO-001 - CRITICAL: ticket.dao.ts uses hallucinated 'asset_tag' field
**File**: `src/dao/ticket.dao.ts`
**Lines**: 43, 195, 358
**Issue**: TicketWithRelations interface uses `asset_tag` which doesn't exist in assets table
**Schema Reference**: assets has `qr_code` field, not `asset_tag`
**Impact**: All ticket queries with asset relations return wrong field
**Fix**: Change all `asset_tag` to `qr_code` in TicketWithRelations interface and all .select() queries
**Status**: [x] Found [x] Fixed [x] Verified

### FORM-001 - CRITICAL: ticket-form.tsx uses hallucinated 'asset_name' field (+ 3 other files)
**Files**:
  - `src/components/tickets/ticket-form.tsx` (lines 54, 275)
  - `src/app/(dashboard)/tickets/new/page.tsx` (line 59)
  - `src/app/(dashboard)/tickets/[id]/page.tsx` (line 405)
  - `src/hooks/use-tickets.ts` (lines 31-32)
**Issue**: Asset interface uses `asset_name` which doesn't exist in assets table
**Schema Reference**: assets has `name` field, not `asset_name`
**Impact**: Ticket form won't display asset names correctly when loading assets
**Fix**: Change `asset_name` to `name` in all interfaces and components
**Status**: [x] Found [x] Fixed [x] Verified

### TEST-001 - HIGH: asset.dao.test.ts uses invalid status 'operational'
**File**: `src/dao/__tests__/asset.dao.test.ts`
**Lines**: 23, 168
**Issue**: Using `status: 'operational'` which doesn't exist in schema
**Schema Reference**: asset_status enum is: 'active', 'under_maintenance', 'retired', 'transferred', 'disposed'
**Fix**: Change 'operational' to 'active'
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-002 - HIGH: compliance-document.dao.test.ts uses hallucinated field 'title'
**File**: `src/dao/__tests__/compliance-document.dao.test.ts`
**Lines**: 19, 123
**Issue**: Using `title` field which doesn't exist in compliance_documents table
**Schema Reference**: compliance_documents has `name` field, not `title`
**Fix**: Change 'title' to 'name'
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-003 - HIGH: location.dao.test.ts uses hallucinated field 'country'
**File**: `src/dao/__tests__/location.dao.test.ts`
**Lines**: 20, 247
**Issue**: Using `country` field which doesn't exist in locations table
**Schema Reference**: locations has: address, city, state, zip (no country field)
**Fix**: Remove 'country' field
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-004 - HIGH: pm-schedule.dao.test.ts uses hallucinated field 'title'
**File**: `src/dao/__tests__/pm-schedule.dao.test.ts`
**Lines**: 19, 139
**Issue**: Using `title` field which doesn't exist in pm_schedules table
**Schema Reference**: pm_schedules has `name` field, not `title`
**Fix**: Change 'title' to 'name'
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-005 - HIGH: ticket.dao.test.ts uses wrong type for ticket_number
**File**: `src/dao/__tests__/ticket.dao.test.ts`
**Lines**: 15, 253
**Issue**: Using string for `ticket_number` when schema defines it as INT
**Schema Reference**: tickets.ticket_number is INT NOT NULL
**Fix**: Change ticket_number to number type
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-006 - HIGH: ticket.dao.test.ts uses invalid status 'open'
**File**: `src/dao/__tests__/ticket.dao.test.ts`
**Line**: 256
**Issue**: Using status 'open' which doesn't exist in schema
**Schema Reference**: ticket_status enum has 'submitted', 'acknowledged', etc. (no 'open')
**Fix**: Change 'open' to valid status like 'submitted'
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-007 - HIGH: vendor.dao.test.ts uses hallucinated field 'vendor_name'
**File**: `src/dao/__tests__/vendor.dao.test.ts`
**Lines**: 16, 148
**Issue**: Using `vendor_name` field which doesn't exist in vendors table
**Schema Reference**: vendors has `name` field, not `vendor_name`
**Fix**: Change 'vendor_name' to 'name'
**Status**: [ ] Found [x] Fixed [ ] Verified

### TEST-008 - HIGH: location.service.test.ts has multiple issues
**File**: `src/services/__tests__/location.service.test.ts`
**Lines**: 27 (country), 41 (invalid role 'user'), 57 (settings)
**Issue**: Multiple hallucinated fields: 'country', invalid role 'user', 'settings' on tenant
**Schema Reference**: locations has no country; user_role is enum without 'user'; tenants has no settings field
**Fix**: Remove country, change role to valid enum value, remove settings field
**Status**: [ ] Found [x] Fixed [ ] Verified

### COMP-001 - MEDIUM: VendorFormProps missing onCancel property
**File**: `src/app/(dashboard)/vendors/[id]/edit/page.tsx`
**Line**: 85
**Issue**: Page passes onCancel prop but VendorForm doesn't define it
**Fix**: Add onCancel to VendorFormProps interface
**Status**: [ ] Found [x] Fixed [ ] Verified

### COMP-002 - MEDIUM: VendorFormProps missing isSubmitting property
**File**: `src/app/(dashboard)/vendors/new/page.tsx`
**Line**: 64
**Issue**: Page passes isSubmitting prop but VendorForm doesn't define it
**Fix**: Add isSubmitting to VendorFormProps interface
**Status**: [ ] Found [x] Fixed [ ] Verified

### COMP-003 - MEDIUM: VendorFormProps missing mode property
**File**: `src/app/(dashboard)/vendors/new/page.tsx`
**Line**: 64
**Issue**: Page passes mode prop but VendorForm doesn't define it
**Fix**: Add mode to VendorFormProps interface
**Status**: [ ] Found [x] Fixed [ ] Verified

---

## Schema Reference Summary

### Enum Types (EXACT VALUES - DO NOT DEVIATE)

```typescript
// ticket_status (10 values)
'submitted' | 'acknowledged' | 'needs_approval' | 'approved' | 'in_progress' | 'completed' | 'verified' | 'closed' | 'rejected' | 'on_hold'

// ticket_priority (4 values)
'low' | 'medium' | 'high' | 'critical'

// asset_status (5 values)
'active' | 'under_maintenance' | 'retired' | 'transferred' | 'disposed'

// location_status (3 values)
'active' | 'temporarily_closed' | 'permanently_closed'

// compliance_status (7 values)
'active' | 'expiring_soon' | 'expired' | 'pending_renewal' | 'conditional' | 'failed_inspection' | 'suspended'

// incident_severity (ONLY 2 VALUES!)
'high' | 'critical'

// incident_status (3 values)
'active' | 'contained' | 'resolved'

// pm_frequency (7 values)
'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annually' | 'annually'

// user_role (6 values)
'super_admin' | 'admin' | 'manager' | 'staff' | 'vendor' | 'readonly'
```

### Common Hallucinations to Watch For

| Module | Hallucinated Field | Actual Alternative |
|--------|-------------------|-------------------|
| Emergency | `incident_type` | Use `title` + `description` |
| Emergency | `severity: 'low'` or `'medium'` | Only `high` or `critical` |
| Asset | `condition` | Use `status` |
| Location | `country`, `region` | Only: address, city, state, zip |
| Ticket | `urgency` | Use `priority` |
| Ticket | `type` | Use `category_id` |
| User | `first_name`, `last_name` | Use `full_name` |
| User | `status` | Use `is_active` boolean |
| Budget | `monthly_budget` | Use `annual_budget` only |
| PM | `frequency: 'yearly'` | Use `annually` |

---

## Audit Progress

### Task Group A: Tickets Module ✅ COMPLETE
- [x] ticket-form.tsx - Fixed asset_name → name
- [x] ticket.ts validation - Verified correct
- [x] Tickets API routes (route.ts) - Verified correct
- [x] ticket.dao.ts - Fixed asset_tag → qr_code
- [x] ticket.service.ts - Verified correct
- [x] Ticket pages - Fixed asset references in new/[id] pages
- [x] use-tickets hook - Fixed asset type definition

**Result**: Found and fixed 2 CRITICAL issues (DAO-001, FORM-001)

### Task Group B: Assets Module ✅ COMPLETE
- [x] asset-form.tsx - Verified correct (status enum matches schema)
- [x] assets-vendors.ts validation - Verified correct (uses qr_code, correct enums)
- [x] Assets API routes - Verified correct (no schema issues)
- [x] asset.dao.ts - Verified correct (no asset_tag references)
- [x] asset.service.ts - Verified correct

**Result**: No issues found - module is schema-compliant ✅

### Task Group C: Vendors Module
- [ ] vendor-form.tsx
- [ ] assets-vendors.ts validation (vendor section)
- [ ] Vendors API routes (3 routes)
- [ ] vendor.dao.ts
- [ ] vendor.service.ts

### Task Group D: Locations Module
- [ ] location-form.tsx
- [ ] Locations API routes
- [ ] location.dao.ts
- [ ] location.service.ts

### Task Group E: Compliance Module
- [ ] compliance-form.tsx
- [ ] compliance.ts validation
- [ ] Compliance API routes
- [ ] compliance-document.dao.ts
- [ ] compliance-document.service.ts

### Task Group F: PM Module
- [ ] pm-schedule-form.tsx
- [ ] pm.ts validation
- [ ] PM API routes
- [ ] pm-schedule.dao.ts
- [ ] pm-schedule.service.ts

### Task Group G: Users Module
- [ ] Users page
- [ ] Users API routes
- [ ] user.dao.ts
- [ ] user.service.ts

### Task Group H: Emergency Module
- [ ] Emergency pages (3 pages)
- [ ] Emergency API routes
- [ ] emergency-incident.dao.ts
- [ ] emergency-incident.service.ts

### Task Group I: Budgets Module
- [ ] Budgets page
- [ ] Budgets API routes
- [ ] budget.dao.ts
- [ ] budget.service.ts

### Task Group J: Related Tables
- [ ] ticket-category.dao.ts
- [ ] asset-category.dao.ts
- [ ] compliance-document-type.dao.ts

### Task Group K: Cross-Cutting
- [ ] Verify tenant_id filtering in all DAOs
- [ ] Verify soft deletes everywhere
- [ ] Verify enum consistency

---

## Fixed Issues

_(Fixed issues will be moved here)_
