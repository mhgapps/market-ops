# Phase 5: Compliance & Preventive Maintenance

## Prerequisites

- Phase 1-4 completed
- Locations, assets, and vendors exist
- Ticket system working

## Context

Compliance tracking ensures licenses, permits, and certifications don't expire. Preventive maintenance schedules recurring tasks to prevent equipment failures.

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

Implement compliance document tracking with expiration alerts and preventive maintenance scheduling with automatic ticket generation.

## Tasks

### 1. Compliance Document Type DAO & Service

**Files:**
- `src/dao/compliance-document-type.dao.ts`
- `src/services/compliance-document-type.service.ts`

```typescript
class ComplianceDocumentTypeDAO extends BaseDAO<'compliance_document_types'> {
  findWithUsageCount(): Promise<ComplianceDocumentTypeWithCount[]>
}

class ComplianceDocumentTypeService {
  getAllTypes(): Promise<ComplianceDocumentType[]>
  createType(data: CreateDocTypeInput): Promise<ComplianceDocumentType>
  updateType(id: string, data: UpdateDocTypeInput): Promise<ComplianceDocumentType>
  deleteType(id: string): Promise<void>
}
```

### 2. Compliance Document DAO & Service

**Files:**
- `src/dao/compliance-document.dao.ts`
- `src/services/compliance-document.service.ts`

**DAO Methods:**
```typescript
class ComplianceDocumentDAO extends BaseDAO<'compliance_documents'> {
  findByLocation(locationId: string): Promise<ComplianceDocument[]>
  findByType(typeId: string): Promise<ComplianceDocument[]>
  findByStatus(status: ComplianceStatus): Promise<ComplianceDocument[]>
  findExpiringSoon(daysAhead: number): Promise<ComplianceDocument[]>
  findExpired(): Promise<ComplianceDocument[]>
  findConditional(): Promise<ComplianceDocument[]>
  findFailedInspection(): Promise<ComplianceDocument[]>
  findWithVersions(id: string): Promise<ComplianceDocumentWithVersions | null>
}
```

**Service Methods:**
```typescript
class ComplianceDocumentService {
  constructor(
    private complianceDAO = new ComplianceDocumentDAO(),
    private documentTypeDAO = new ComplianceDocumentTypeDAO(),
    private locationDAO = new LocationDAO()
  )

  // Queries
  getAllDocuments(filters?: ComplianceFilters): Promise<ComplianceDocument[]>
  getDocumentById(id: string): Promise<ComplianceDocumentWithVersions | null>
  getDocumentsByLocation(locationId: string): Promise<ComplianceDocument[]>
  getExpiringSoon(days: number): Promise<ComplianceDocument[]>
  getExpired(): Promise<ComplianceDocument[]>
  getComplianceStats(): Promise<ComplianceStats>
  getComplianceCalendar(month: number, year: number): Promise<ComplianceCalendarItem[]>

  // Commands
  createDocument(data: CreateComplianceDocInput): Promise<ComplianceDocument>
  updateDocument(id: string, data: UpdateComplianceDocInput): Promise<ComplianceDocument>
  deleteDocument(id: string): Promise<void>
  uploadNewVersion(docId: string, file: File, userId: string): Promise<ComplianceDocument>

  // Status management
  markAsRenewed(id: string, newExpirationDate: string): Promise<ComplianceDocument>
  markAsConditional(id: string, requirements: string, deadline: string): Promise<ComplianceDocument>
  markAsFailedInspection(id: string, correctiveAction: string, reinspectionDate: string): Promise<ComplianceDocument>
  clearConditional(id: string): Promise<ComplianceDocument>
  clearFailedInspection(id: string): Promise<ComplianceDocument>

  // Alerts
  processExpirationAlerts(): Promise<void>  // Cron job target
}
```

### 3. Compliance Alert Service

**Files:**
- `src/dao/compliance-alert.dao.ts`
- `src/services/compliance-alert.service.ts`

```typescript
class ComplianceAlertService {
  sendExpirationAlert(documentId: string, alertType: AlertType, recipients: string[]): Promise<void>
  getAlertHistory(documentId: string): Promise<ComplianceAlert[]>
  getUpcomingAlerts(): Promise<UpcomingAlert[]>
}
```

### 4. PM Template DAO & Service

**Files:**
- `src/dao/pm-template.dao.ts`
- `src/services/pm-template.service.ts`

```typescript
class PMTemplateDAO extends BaseDAO<'pm_templates'> {
  findByCategory(category: string): Promise<PMTemplate[]>
  findWithScheduleCount(): Promise<PMTemplateWithCount[]>
}

class PMTemplateService {
  getAllTemplates(): Promise<PMTemplate[]>
  createTemplate(data: CreatePMTemplateInput): Promise<PMTemplate>
  updateTemplate(id: string, data: UpdatePMTemplateInput): Promise<PMTemplate>
  deleteTemplate(id: string): Promise<void>
}
```

### 5. PM Schedule DAO & Service

**Files:**
- `src/dao/pm-schedule.dao.ts`
- `src/services/pm-schedule.service.ts`

**DAO Methods:**
```typescript
class PMScheduleDAO extends BaseDAO<'pm_schedules'> {
  findActive(): Promise<PMSchedule[]>
  findByAsset(assetId: string): Promise<PMSchedule[]>
  findByLocation(locationId: string): Promise<PMSchedule[]>
  findDueToday(): Promise<PMSchedule[]>
  findOverdue(): Promise<PMSchedule[]>
  findByFrequency(frequency: PMFrequency): Promise<PMSchedule[]>
  findWithCompletions(id: string): Promise<PMScheduleWithCompletions | null>
}
```

**Service Methods:**
```typescript
class PMScheduleService {
  constructor(
    private scheduleDAO = new PMScheduleDAO(),
    private templateDAO = new PMTemplateDAO(),
    private ticketService: TicketService,
    private completionDAO = new PMCompletionDAO()
  )

  // Queries
  getAllSchedules(filters?: PMFilters): Promise<PMSchedule[]>
  getScheduleById(id: string): Promise<PMScheduleWithCompletions | null>
  getSchedulesByAsset(assetId: string): Promise<PMSchedule[]>
  getSchedulesByLocation(locationId: string): Promise<PMSchedule[]>
  getDueToday(): Promise<PMSchedule[]>
  getOverdue(): Promise<PMSchedule[]>
  getPMCalendar(month: number, year: number): Promise<PMCalendarItem[]>
  getPMStats(): Promise<PMStats>

  // Commands
  createSchedule(data: CreatePMScheduleInput): Promise<PMSchedule>
  updateSchedule(id: string, data: UpdatePMScheduleInput): Promise<PMSchedule>
  deleteSchedule(id: string): Promise<void>
  activateSchedule(id: string): Promise<PMSchedule>
  deactivateSchedule(id: string): Promise<PMSchedule>

  // Ticket generation
  generateTickets(): Promise<Ticket[]>  // Cron job target - creates tickets for due PM
  markCompleted(scheduleId: string, ticketId: string, userId: string, checklistResults?: JSON): Promise<PMCompletion>

  // Helpers
  calculateNextDueDate(schedule: PMSchedule): Date
}
```

### 6. PM Completion Service

**Files:**
- `src/dao/pm-completion.dao.ts`
- `src/services/pm-completion.service.ts`

```typescript
class PMCompletionService {
  recordCompletion(scheduleId: string, ticketId: string, userId: string, checklistResults?: JSON): Promise<PMCompletion>
  getCompletionHistory(scheduleId: string): Promise<PMCompletion[]>
  getCompletionRate(scheduleId: string, months: number): Promise<number>
}
```

### 7. Compliance API Routes

**Files:**
- `src/app/api/compliance/route.ts` - GET (list), POST (create)
- `src/app/api/compliance/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/compliance/[id]/upload/route.ts` - POST (new version)
- `src/app/api/compliance/[id]/status/route.ts` - PATCH (status changes)
- `src/app/api/compliance/expiring/route.ts` - GET (expiring soon)
- `src/app/api/compliance/calendar/route.ts` - GET (calendar view)
- `src/app/api/compliance-types/route.ts` - GET, POST
- `src/app/api/compliance-types/[id]/route.ts` - PATCH, DELETE

### 8. PM API Routes

**Files:**
- `src/app/api/pm-schedules/route.ts` - GET (list), POST (create)
- `src/app/api/pm-schedules/[id]/route.ts` - GET, PATCH, DELETE
- `src/app/api/pm-schedules/[id]/complete/route.ts` - POST
- `src/app/api/pm-schedules/due/route.ts` - GET (due today/overdue)
- `src/app/api/pm-schedules/calendar/route.ts` - GET (calendar view)
- `src/app/api/pm-schedules/generate/route.ts` - POST (manual trigger)
- `src/app/api/pm-templates/route.ts` - GET, POST
- `src/app/api/pm-templates/[id]/route.ts` - PATCH, DELETE

### 9. Compliance Dashboard Page

**File:** `src/app/(dashboard)/compliance/page.tsx`

**Features:**
- Status overview cards: active, expiring soon, expired, conditional
- Document list with status badges
- Filter by location, type, status
- Calendar view of expirations
- "Add Document" button
- Bulk alert configuration

### 10. Compliance Detail Page

**File:** `src/app/(dashboard)/compliance/[id]/page.tsx`

**Features:**
- Document info card
- Status badge with color coding
- Expiration countdown
- Location(s) info
- Version history with downloads
- Alert history
- Conditional/failed inspection details if applicable
- Action buttons based on status

### 11. Compliance Form

**File:** `src/components/compliance/compliance-form.tsx`

**Features:**
- Document type selection
- Location selection (single or multiple)
- Issue/expiration dates
- Issuing authority
- Document number
- File upload
- Notes

### 12. Compliance Status Components

**Files:**
- `src/components/compliance/status-badge.tsx`
- `src/components/compliance/expiration-countdown.tsx`
- `src/components/compliance/conditional-banner.tsx`
- `src/components/compliance/failed-inspection-banner.tsx`

### 13. PM Dashboard Page

**File:** `src/app/(dashboard)/pm/page.tsx`

**Features:**
- Stats overview: active schedules, due today, overdue, completed this month
- Schedule list with next due date
- Calendar view of PM tasks
- Filter by asset, location, frequency
- "Create Schedule" button

### 14. PM Schedule Detail Page

**File:** `src/app/(dashboard)/pm/[id]/page.tsx`

**Features:**
- Schedule info card
- Frequency visualization
- Asset/location info
- Checklist preview (if template)
- Completion history chart
- Recent completions list
- Action buttons: edit, activate/deactivate, delete

### 15. PM Schedule Form

**File:** `src/components/pm/pm-schedule-form.tsx`

**Features:**
- Template selection (optional)
- Name and description
- Asset OR location selection
- Frequency dropdown
- Day/date selectors based on frequency
- Assignee selection
- Vendor selection (optional)
- Estimated cost

### 16. PM Calendar Component

**File:** `src/components/pm/pm-calendar.tsx`

**Features:**
- Month view calendar
- PM tasks shown on due dates
- Color coding by completion status
- Click to view schedule details
- Navigation between months

### 17. Compliance Calendar Component

**File:** `src/components/compliance/compliance-calendar.tsx`

**Features:**
- Month view calendar
- Expirations shown on dates
- Color coding by status
- Click to view document details
- Navigation between months

### 18. Cron Job Routes (Vercel Cron)

**Files:**
- `src/app/api/cron/compliance-alerts/route.ts` - Send expiration alerts
- `src/app/api/cron/pm-generate/route.ts` - Generate PM tickets

**vercel.json:**
```json
{
  "crons": [
    {
      "path": "/api/cron/compliance-alerts",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/pm-generate",
      "schedule": "0 6 * * *"
    }
  ]
}
```

### 19. Zod Schemas

**File:** `src/lib/validations/compliance.ts`

```typescript
export const createComplianceDocSchema = z.object({
  name: z.string().min(1).max(200),
  document_type_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  location_ids: z.array(z.string().uuid()).optional(),
  issue_date: z.string().date().optional(),
  expiration_date: z.string().date(),
  issuing_authority: z.string().optional(),
  document_number: z.string().optional(),
  notes: z.string().optional(),
})
```

**File:** `src/lib/validations/pm.ts`

```typescript
export const createPMScheduleSchema = z.object({
  template_id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  asset_id: z.string().uuid().optional(),
  location_id: z.string().uuid().optional(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually']),
  day_of_week: z.number().int().min(0).max(6).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  assigned_to: z.string().uuid().optional(),
  vendor_id: z.string().uuid().optional(),
  estimated_cost: z.number().positive().optional(),
}).refine(
  data => data.asset_id || data.location_id,
  { message: 'Either asset_id or location_id is required' }
)
```

### 20. Compliance & PM Hooks

**File:** `src/hooks/use-compliance.ts`

```typescript
function useComplianceDocuments(filters?: ComplianceFilters)
function useComplianceDocument(id: string)
function useExpiringDocuments(days: number)
function useComplianceMutations()
```

**File:** `src/hooks/use-pm.ts`

```typescript
function usePMSchedules(filters?: PMFilters)
function usePMSchedule(id: string)
function useDuePMSchedules()
function usePMMutations()
```

## Completion Criteria

1. [ ] Admin can create, edit, soft-delete compliance documents
2. [ ] Documents show expiration status with color coding
3. [ ] Expiring documents (90/60/30/14/7 days) flagged
4. [ ] Document versions uploadable with history
5. [ ] Conditional and failed inspection statuses trackable
6. [ ] Compliance calendar shows all expirations
7. [ ] Admin can create, edit, soft-delete PM schedules
8. [ ] PM schedules linked to assets or locations
9. [ ] PM calendar shows scheduled tasks
10. [ ] PM tickets auto-generate (via cron or manual trigger)
11. [ ] PM completions tracked with checklist results
12. [ ] Cron jobs configured for alerts and ticket generation
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
<promise>PHASE_5_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-5-compliance-pm.md)" --completion-promise "PHASE_5_COMPLETE" --max-iterations 60
```

**Note:** This is a complex phase with cron jobs - 60 iterations recommended.

### If Stuck After 20+ Iterations

If you're not making progress after 20 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 5 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_5_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## File Checklist

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── compliance/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── pm/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   └── api/
│       ├── compliance/
│       │   ├── route.ts
│       │   ├── expiring/route.ts
│       │   ├── calendar/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── upload/route.ts
│       │       └── status/route.ts
│       ├── compliance-types/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── pm-schedules/
│       │   ├── route.ts
│       │   ├── due/route.ts
│       │   ├── calendar/route.ts
│       │   ├── generate/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── complete/route.ts
│       ├── pm-templates/
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── cron/
│           ├── compliance-alerts/route.ts
│           └── pm-generate/route.ts
├── components/
│   ├── compliance/
│   │   ├── compliance-form.tsx
│   │   ├── status-badge.tsx
│   │   ├── expiration-countdown.tsx
│   │   ├── conditional-banner.tsx
│   │   ├── failed-inspection-banner.tsx
│   │   └── compliance-calendar.tsx
│   └── pm/
│       ├── pm-schedule-form.tsx
│       └── pm-calendar.tsx
├── dao/
│   ├── compliance-document.dao.ts
│   ├── compliance-document-type.dao.ts
│   ├── compliance-alert.dao.ts
│   ├── pm-schedule.dao.ts
│   ├── pm-template.dao.ts
│   └── pm-completion.dao.ts
├── services/
│   ├── compliance-document.service.ts
│   ├── compliance-document-type.service.ts
│   ├── compliance-alert.service.ts
│   ├── pm-schedule.service.ts
│   ├── pm-template.service.ts
│   └── pm-completion.service.ts
├── hooks/
│   ├── use-compliance.ts
│   └── use-pm.ts
└── lib/
    └── validations/
        ├── compliance.ts
        └── pm.ts

vercel.json (update with cron config)
```

## Context Management (CRITICAL - LARGE PHASE)

**Phase 5 is a complex phase with two domains (Compliance + PM).** Consider splitting.

### Split Into Sub-Phases

```bash
# Sub-phase 5a: Compliance (Tasks 1-3, 7, 9-12, part of 17)
/ralph-loop "Phase 5 Compliance Tasks" --completion-promise "PHASE_5A_COMPLETE" --max-iterations 30

# Sub-phase 5b: PM Scheduling (Tasks 4-6, 8, 13-16, part of 17, 18-20)
/ralph-loop "Phase 5 PM Tasks" --completion-promise "PHASE_5B_COMPLETE" --max-iterations 30
```

### At the START of each iteration:

```bash
# 1. Read progress file
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/dao/compliance*.ts src/dao/pm*.ts 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with completed tasks, files created, and validation results.

### Commit After Each Task

```bash
git add -A && git commit -m "feat(compliance): [task description]"
# or
git add -A && git commit -m "feat(pm): [task description]"
```

### DO NOT:
- Re-read files from Phase 1-4 (they're complete)
- Explain completed work in conversation
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create/update `.claude/progress.md`:

```markdown
# Phase 5 Progress

## Current Task
Task 1: Compliance Document Type DAO & Service

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/dao/compliance-document-type.dao.ts
```

Then begin implementation. Work through tasks sequentially. Run validation commands after each task.

When complete, output: `<promise>PHASE_5_COMPLETE</promise>`
