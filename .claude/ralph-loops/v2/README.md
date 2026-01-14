# MHG Facilities - Phase Specs v2

## Key Improvements Over v1

### 1. Schema-First Approach
Every phase now starts with **mandatory schema discovery**:
- Read the migration file to understand exact column names
- Read `database.ts` to understand TypeScript types
- Never assume column names - always verify first

### 2. Pattern Discovery
Before implementing, the AI must:
- Read existing DAOs to understand the pattern
- Read existing Services to understand the pattern
- Read existing API routes to understand the pattern

### 3. No Assumed Type Signatures
Instead of prescribing exact method signatures, we now describe:
- **What** the method should do (behavior)
- **Why** it's needed (use case)
- Let the AI derive the signature from the actual schema

### 4. Verification Steps
Each task includes explicit verification:
- Check the file was created
- Run type-check immediately
- Fix errors before proceeding

### 5. Anti-Hallucination Rules
Explicit rules like:
- "NEVER use a column name you haven't verified exists"
- "NEVER assume a type exists - check database.ts first"
- "ALWAYS read the migration file before writing DAOs"

---

## Phase Files

1. `phase-1-auth-tenant.md` - Authentication & Tenant Setup
2. `phase-2-locations-users.md` - Location & User Management
3. `phase-3-tickets.md` - Ticket System Core
4. `phase-4-assets-vendors.md` - Assets & Vendors
5. `phase-5-compliance-pm.md` - Compliance & Preventive Maintenance
6. `phase-6-dashboard-reports.md` - Dashboard & Reports

---

## How to Run

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities"
claude --dangerously-skip-permissions
```

Then:
```
/ralph-wiggum:ralph-loop "Execute phase spec from .claude/ralph-loops/v2/phase-X-name.md" --completion-promise "PHASE_X_COMPLETE" --max-iterations 50
```
