# Phase 3: Ticket System Core

## Prerequisites

- Phase 1 & 2 completed
- Locations and users can be managed
- Authentication working

## Context

The ticket system is the heart of the facilities management app. This phase implements the full ticket lifecycle from submission to completion.

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

Implement complete ticket management with status workflows, assignments, comments, attachments, and cost approvals.

## Tasks

### 1. Ticket Category DAO & Service

**Files:**
- `src/dao/ticket-category.dao.ts`
- `src/services/ticket-category.service.ts`

**DAO Methods:**
```typescript
class TicketCategoryDAO extends BaseDAO<'ticket_categories'> {
  findWithDefaults(): Promise<TicketCategoryWithDefaults[]>
}
```

**Service Methods:**
```typescript
class TicketCategoryService {
  getAllCategories(): Promise<TicketCategory[]>
  createCategory(data: CreateCategoryInput): Promise<TicketCategory>
  updateCategory(id: string, data: UpdateCategoryInput): Promise<TicketCategory>
  deleteCategory(id: string): Promise<void>
}
```

### 2. Ticket DAO

**File:** `src/dao/ticket.dao.ts`

```typescript
class TicketDAO extends BaseDAO<'tickets'> {
  findByStatus(status: TicketStatus | TicketStatus[]): Promise<Ticket[]>
  findByLocation(locationId: string): Promise<Ticket[]>
  findByAssignee(userId: string): Promise<Ticket[]>
  findBySubmitter(userId: string): Promise<Ticket[]>
  findWithRelations(id: string): Promise<TicketWithRelations | null>
  findRecent(limit: number): Promise<Ticket[]>
  findOverdue(): Promise<Ticket[]>
  findByPriority(priority: TicketPriority): Promise<Ticket[]>
  search(query: string): Promise<Ticket[]>  // Uses pg_trgm similarity
  checkDuplicate(locationId: string, assetId: string | null, title: string): Promise<Ticket[]>
}
```

### 3. Ticket Service

**File:** `src/services/ticket.service.ts`

```typescript
class TicketService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private categoryDAO = new TicketCategoryDAO(),
    private userDAO = new UserDAO(),
    private locationDAO = new LocationDAO()
  )

  // Queries
  getAllTickets(filters?: TicketFilters): Promise<Ticket[]>
  getTicketById(id: string): Promise<TicketWithRelations | null>
  getTicketsByLocation(locationId: string): Promise<Ticket[]>
  getMyTickets(userId: string): Promise<Ticket[]>  // Submitted or assigned
  getTicketStats(): Promise<TicketStats>

  // Commands
  createTicket(data: CreateTicketInput, submitterId: string): Promise<Ticket>
  updateTicket(id: string, data: UpdateTicketInput): Promise<Ticket>

  // Status transitions
  acknowledgeTicket(id: string, userId: string): Promise<Ticket>
  assignTicket(id: string, assigneeId: string, assignerId: string): Promise<Ticket>
  assignToVendor(id: string, vendorId: string, assignerId: string): Promise<Ticket>
  startWork(id: string, userId: string): Promise<Ticket>
  completeTicket(id: string, userId: string, actualCost?: number): Promise<Ticket>
  verifyCompletion(id: string, userId: string): Promise<Ticket>
  closeTicket(id: string, userId: string): Promise<Ticket>
  rejectTicket(id: string, userId: string, reason: string): Promise<Ticket>
  putOnHold(id: string, userId: string, reason: string): Promise<Ticket>

  // Duplicate detection
  checkForDuplicates(locationId: string, assetId: string | null, title: string): Promise<Ticket[]>
  markAsDuplicate(id: string, originalTicketId: string): Promise<Ticket>
  mergeTickets(targetId: string, sourceIds: string[]): Promise<Ticket>
}
```

### 4. Ticket Comment Service

**Files:**
- `src/dao/ticket-comment.dao.ts`
- `src/services/ticket-comment.service.ts`

```typescript
class TicketCommentService {
  getComments(ticketId: string, includeInternal: boolean): Promise<TicketComment[]>
  addComment(ticketId: string, userId: string, comment: string, isInternal: boolean): Promise<TicketComment>
  deleteComment(commentId: string): Promise<void>
}
```

### 5. Ticket Attachment Service

**Files:**
- `src/dao/ticket-attachment.dao.ts`
- `src/services/ticket-attachment.service.ts`

```typescript
class TicketAttachmentService {
  getAttachments(ticketId: string): Promise<TicketAttachment[]>
  uploadAttachment(ticketId: string, file: File, userId: string, type: AttachmentType): Promise<TicketAttachment>
  deleteAttachment(attachmentId: string): Promise<void>
  getSignedUrl(attachmentId: string): Promise<string>
}
```

### 6. Cost Approval Service

**Files:**
- `src/dao/cost-approval.dao.ts`
- `src/services/cost-approval.service.ts`

```typescript
class CostApprovalService {
  requestApproval(ticketId: string, estimatedCost: number, quotePath: string | null, requesterId: string): Promise<CostApproval>
  approveRequest(approvalId: string, approverId: string): Promise<CostApproval>
  denyRequest(approvalId: string, approverId: string, reason: string): Promise<CostApproval>
  getPendingApprovals(): Promise<CostApproval[]>
  getApprovalHistory(ticketId: string): Promise<CostApproval[]>
}
```

### 7. Ticket API Routes

**Files:**
- `src/app/api/tickets/route.ts` - GET (list with filters), POST (create)
- `src/app/api/tickets/[id]/route.ts` - GET, PATCH
- `src/app/api/tickets/[id]/status/route.ts` - PATCH (status transitions)
- `src/app/api/tickets/[id]/assign/route.ts` - POST
- `src/app/api/tickets/[id]/comments/route.ts` - GET, POST
- `src/app/api/tickets/[id]/attachments/route.ts` - GET, POST
- `src/app/api/tickets/[id]/approval/route.ts` - GET, POST
- `src/app/api/tickets/check-duplicate/route.ts` - POST
- `src/app/api/ticket-categories/route.ts` - GET, POST
- `src/app/api/ticket-categories/[id]/route.ts` - PATCH, DELETE

### 8. Ticket List Page

**File:** `src/app/(dashboard)/tickets/page.tsx`

**Features:**
- Kanban view by status (default) - use @hello-pangea/dnd for drag-drop
- List view option
- Filters: status, priority, location, assignee, date range
- Search by ticket number, title
- Quick status badges with colors
- "Create Ticket" button
- Bulk actions for admins

**Note:** Install `@hello-pangea/dnd` for Kanban drag-drop functionality (React 18/19 compatible fork of react-beautiful-dnd)

### 9. Ticket Creation Flow

**Files:**
- `src/app/(dashboard)/tickets/new/page.tsx`
- `src/components/tickets/ticket-form.tsx`

**Features:**
- Step 1: Select location
- Step 2: Select category (with Spanish translation shown)
- Step 3: Title and description
- Step 4: Attach photos (optional)
- Step 5: Review and submit
- Duplicate detection warning before submit
- Voice-to-text option for description (future enhancement)

### 10. Ticket Detail Page

**File:** `src/app/(dashboard)/tickets/[id]/page.tsx`

**Features:**
- Ticket header with number, status badge, priority
- Description and details card
- Location and asset info
- Assignment info (staff/vendor)
- Status timeline visualization
- Comments section (internal/public toggle for admins)
- Attachments gallery
- Cost tracking section
- Action buttons based on status and role

### 11. Ticket Status Components

**Files:**
- `src/components/tickets/status-badge.tsx` - Colored status badge
- `src/components/tickets/status-timeline.tsx` - Visual timeline of status changes
- `src/components/tickets/status-actions.tsx` - Action buttons per status

**Status → Actions mapping:**
- `submitted` → Acknowledge, Reject
- `acknowledged` → Assign, Needs Approval (if cost), Start Work
- `needs_approval` → (handled by approver)
- `approved` → Assign, Start Work
- `in_progress` → Complete, Put on Hold
- `completed` → Verify, Reopen
- `verified` → Close
- `on_hold` → Resume

### 12. Ticket Assignment Components

**Files:**
- `src/components/tickets/assign-modal.tsx` - Assign to staff
- `src/components/tickets/assign-vendor-modal.tsx` - Assign to vendor

### 13. Comments & Attachments Components

**Files:**
- `src/components/tickets/comment-list.tsx`
- `src/components/tickets/comment-form.tsx`
- `src/components/tickets/attachment-gallery.tsx`
- `src/components/tickets/attachment-upload.tsx`

### 14. Cost Approval Components

**Files:**
- `src/components/tickets/cost-approval-form.tsx`
- `src/components/tickets/approval-status.tsx`
- `src/app/(dashboard)/approvals/page.tsx` - Pending approvals list

### 15. Zod Schemas

**File:** `src/lib/validations/ticket.ts`

```typescript
export const createTicketSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  location_id: z.string().uuid(),
  asset_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  is_emergency: z.boolean().default(false),
})

export const updateTicketSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().optional(),
  category_id: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  due_date: z.string().datetime().optional(),
})

export const ticketFiltersSchema = z.object({
  status: z.array(z.enum([...ticketStatuses])).optional(),
  priority: z.array(z.enum([...ticketPriorities])).optional(),
  location_id: z.string().uuid().optional(),
  assigned_to: z.string().uuid().optional(),
  submitted_by: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  search: z.string().optional(),
})
```

### 16. Ticket Hooks

**File:** `src/hooks/use-tickets.ts`

```typescript
function useTickets(filters?: TicketFilters) {
  // TanStack Query for ticket list with filters
}

function useTicket(id: string) {
  // TanStack Query for single ticket with relations
}

function useTicketMutations() {
  return {
    createTicket,
    updateTicket,
    changeStatus,
    assignTicket,
    addComment,
    uploadAttachment,
  }
}
```

## Completion Criteria

1. [ ] Staff can create tickets with location, category, description, photos
2. [ ] Duplicate detection warns before creating similar tickets
3. [ ] Ticket list shows all tickets with filters and search
4. [ ] Kanban view allows drag-drop status changes (admin/manager)
5. [ ] Ticket detail shows full info, timeline, comments, attachments
6. [ ] Status transitions enforce proper workflow
7. [ ] Comments support internal (staff-only) and public
8. [ ] Photo attachments upload to Supabase storage
9. [ ] Cost approval workflow works end-to-end
10. [ ] Ticket number auto-increments per tenant
11. [ ] All forms have proper validation
12. [ ] UI responsive at 375px, 768px, 1920px
13. [ ] `npm run type-check && npm run lint && npm run build` passes

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
<promise>PHASE_3_COMPLETE</promise>
```

### Recommended Iterations

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-3-tickets.md)" --completion-promise "PHASE_3_COMPLETE" --max-iterations 60
```

**Note:** This is the largest phase - 60 iterations recommended.

### If Stuck After 20+ Iterations

If you're not making progress after 20 iterations:

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase 3 - [Date]
   ### Issue
   [What's preventing completion]

   ### Attempted Solutions
   - [What you tried]

   ### Blocking Factors
   - [External dependencies, unclear requirements, etc.]
   ```

2. **Output early exit signal**:
   ```
   <stuck>PHASE_3_BLOCKED: [brief reason]</stuck>
   ```

3. **Continue with partial progress** - Don't revert working code

## Architecture Rules

1. **Status transitions in service** - Enforce valid state machine in TicketService
2. **Audit trail automatic** - ticket_status_history populated by DB trigger
3. **File uploads via service** - Never upload directly from component
4. **Tenant isolation** - All DAOs extend BaseDAO

## File Checklist

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── tickets/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── approvals/
│   │       └── page.tsx
│   └── api/
│       ├── tickets/
│       │   ├── route.ts
│       │   ├── check-duplicate/route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       ├── status/route.ts
│       │       ├── assign/route.ts
│       │       ├── comments/route.ts
│       │       ├── attachments/route.ts
│       │       └── approval/route.ts
│       └── ticket-categories/
│           ├── route.ts
│           └── [id]/route.ts
├── components/
│   └── tickets/
│       ├── ticket-form.tsx
│       ├── status-badge.tsx
│       ├── status-timeline.tsx
│       ├── status-actions.tsx
│       ├── assign-modal.tsx
│       ├── assign-vendor-modal.tsx
│       ├── comment-list.tsx
│       ├── comment-form.tsx
│       ├── attachment-gallery.tsx
│       ├── attachment-upload.tsx
│       ├── cost-approval-form.tsx
│       └── approval-status.tsx
├── dao/
│   ├── ticket.dao.ts
│   ├── ticket-category.dao.ts
│   ├── ticket-comment.dao.ts
│   ├── ticket-attachment.dao.ts
│   └── cost-approval.dao.ts
├── services/
│   ├── ticket.service.ts
│   ├── ticket-category.service.ts
│   ├── ticket-comment.service.ts
│   ├── ticket-attachment.service.ts
│   └── cost-approval.service.ts
├── hooks/
│   └── use-tickets.ts
└── lib/
    └── validations/
        └── ticket.ts
```

## Context Management (CRITICAL - LARGE PHASE)

**Phase 3 is the largest phase.** Context management is essential.

### Split Into Sub-Phases

Consider running as 3 separate loops:

```bash
# Sub-phase 3a: Core infrastructure (Tasks 1-5)
/ralph-loop "Phase 3 Tasks 1-5: DAOs and Services" --completion-promise "PHASE_3A_COMPLETE" --max-iterations 25

# Sub-phase 3b: API routes (Tasks 6-7)
/ralph-loop "Phase 3 Tasks 6-7: API Routes" --completion-promise "PHASE_3B_COMPLETE" --max-iterations 20

# Sub-phase 3c: UI (Tasks 8-16)
/ralph-loop "Phase 3 Tasks 8-16: UI Components" --completion-promise "PHASE_3C_COMPLETE" --max-iterations 30
```

### At the START of each iteration:

```bash
# 1. Read progress file
cat .claude/progress.md

# 2. Check recent git history
git log --oneline -5

# 3. Verify which files exist
ls src/dao/ticket*.ts src/services/ticket*.ts 2>/dev/null || true
```

### At the END of each iteration:

Update `.claude/progress.md` with completed tasks, files created, and validation results.

### Commit After Each Task

```bash
git add -A && git commit -m "feat(tickets): [task description]"
```

### DO NOT:
- Re-read files from Phase 1-2 (they're complete)
- Read entire ticket service when only modifying one method
- Keep full file contents in context

## Start Command

**FIRST ACTION**: Create/update `.claude/progress.md`:

```markdown
# Phase 3 Progress

## Current Task
Task 1: Ticket Category DAO & Service

## Completed
(none yet)

## Files Created
(none yet)

## Next Action
Create src/dao/ticket-category.dao.ts
```

Then begin implementation. This is the largest phase - work methodically through each task. Run validation commands after each task.

When complete, output: `<promise>PHASE_3_COMPLETE</promise>`
