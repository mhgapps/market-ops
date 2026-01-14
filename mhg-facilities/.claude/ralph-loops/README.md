# Ralph Wiggum Autonomous Development Loops

## Overview

This directory contains structured development loops for building the MHG Facilities Management System using the **Ralph Wiggum autonomous coding methodology**.

Ralph Wiggum is a technique for iterative, self-referential AI development loops where Claude works continuously until completion criteria are met. Named after Ralph Wiggum from The Simpsons, it embodies persistent iteration despite setbacks.

## How to Use

### Quick Start (Using `/ralph-loop` command)

```bash
/ralph-loop "$(cat .claude/ralph-loops/phase-1-auth-tenant.md)" --completion-promise "PHASE_1_COMPLETE" --max-iterations 50
```

### Manual Start

1. **Start a loop**: Open the phase file and copy the prompt into Claude Code
2. **Let it run**: Claude will work autonomously until completion criteria are met
3. **Review**: Check the work, run tests, verify functionality
4. **Continue**: Move to the next phase or re-run if needed

### How It Works

```
┌─────────────────────────────────────────────┐
│  1. Prompt with tasks + completion criteria │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  2. Claude works: reads, writes, tests      │
│     - Sees failures as data                 │
│     - Iterates based on results             │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  3. Stop Hook intercepts exit attempts      │
│     - Checks completion promise             │
│     - Re-feeds prompt if not complete       │
│     - Ends loop when criteria met           │
└─────────────────────────────────────────────┘
```

## Phase Order

Execute phases in order - each builds on the previous:

| Phase | Focus | Complexity | Recommended Iterations | Completion Promise |
|-------|-------|------------|------------------------|-------------------|
| 1 | Authentication & Tenant Setup | Medium | 30-40 | `PHASE_1_COMPLETE` |
| 2 | Location & User Management | Medium | 30-40 | `PHASE_2_COMPLETE` |
| 3 | Ticket System Core | High | 50-60 | `PHASE_3_COMPLETE` |
| 4 | Assets & Vendors | Medium | 40-50 | `PHASE_4_COMPLETE` |
| 5 | Compliance & PM Scheduling | High | 50-60 | `PHASE_5_COMPLETE` |
| 6 | Dashboard & Reports | Medium | 40-50 | `PHASE_6_COMPLETE` |

## Loop Structure

Each phase file contains:
- **Context**: What exists, what's needed
- **Tasks**: Specific implementation steps
- **Completion Criteria**: How to know when done
- **Architecture Rules**: Patterns to follow
- **Files to Create**: Expected outputs

## Before Starting

Ensure you have:
1. Supabase credentials configured in `.env.local`
2. Database migration applied (`npx supabase db push`)
3. Previous phase completed (if not Phase 1)
4. Required npm scripts in `package.json`:
   ```json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "build": "next build",
       "start": "next start",
       "lint": "eslint src/",
       "type-check": "tsc --noEmit"
     }
   }
   ```

## Validation Commands (CRITICAL)

Every loop MUST run these commands after each task:

```bash
# Type check - MUST pass
npm run type-check

# Lint check - MUST pass
npm run lint

# Build - MUST pass
npm run build
```

Do NOT proceed to the next task if any command fails. Fix errors first.

## Coding Standards & Architecture (CRITICAL)

**Every line of code MUST follow these standards. Violations will cause build failures and technical debt.**

### 1. Three-Layer Architecture (MANDATORY)

```
Client Component (uses api-client)
  → API Route (HTTP handling only)
    → Service (business logic, constructor injects DAOs)
      → DAO (database queries only)
```

```typescript
// ✅ CORRECT - Each layer has single responsibility
// API Route - HTTP only
export async function GET(request: Request) {
  const service = new LocationService()
  const locations = await service.getAllLocations()
  return NextResponse.json(locations)
}

// Service - Business logic only
export class LocationService {
  constructor(
    private locationDAO = new LocationDAO(),
    private userDAO = new UserDAO()
  ) {}

  async getAllLocations() {
    return this.locationDAO.findActive()
  }
}

// DAO - Database queries only
export class LocationDAO extends BaseDAO<'locations'> {
  async findActive() {
    const supabase = await getPooledSupabaseClient()
    return supabase.from('locations').select('*').is('deleted_at', null)
  }
}

// ❌ WRONG - Database queries in API route
export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from('locations').select('*')  // VIOLATION!
  return NextResponse.json(data)
}

// ❌ WRONG - Business logic in API route
export async function POST(request: Request) {
  const body = await request.json()
  if (body.name.length < 3) throw new Error('Name too short')  // Should be in service!
  // ...
}
```

### 2. No Hardcoded Colors (CRITICAL)

**NEVER use hex colors, color names, or rgba() directly. ALWAYS use CSS variables or theme tokens.**

```typescript
// ✅ CORRECT - Use CSS variables (shadcn/ui pattern)
<div className="bg-primary text-primary-foreground">
<div className="bg-muted text-muted-foreground">
<div className="bg-destructive text-destructive-foreground">
<div className="border-border bg-card text-card-foreground">
<div className="bg-accent text-accent-foreground">

// ✅ CORRECT - Use Tailwind semantic colors
<div className="bg-background text-foreground">
<Badge variant="secondary">
<Button variant="outline">

// ✅ CORRECT - Status colors via variants
<Badge variant="success">Active</Badge>  // Define in components
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Failed</Badge>

// ❌ WRONG - Hardcoded hex colors
<div style={{ backgroundColor: '#3B82F6' }}>  // VIOLATION!
<div className="bg-[#FF5733]">  // VIOLATION!
<div style={{ color: 'rgba(59, 130, 246, 0.8)' }}>  // VIOLATION!

// ❌ WRONG - Direct Tailwind color classes
<div className="bg-blue-500">  // VIOLATION - use semantic names
<div className="text-red-600">  // VIOLATION - use text-destructive
<div className="border-gray-300">  // VIOLATION - use border-border
```

**Available CSS Variables (defined in globals.css):**
```css
--background, --foreground
--card, --card-foreground
--popover, --popover-foreground
--primary, --primary-foreground
--secondary, --secondary-foreground
--muted, --muted-foreground
--accent, --accent-foreground
--destructive, --destructive-foreground
--border, --input, --ring
```

### 3. HTTP Client Rules

```typescript
// ✅ CORRECT - Use api-client wrapper in client components
import api from '@/lib/api-client'

const locations = await api.get<Location[]>('/api/locations')
const newLocation = await api.post<Location>('/api/locations', { name: 'HQ' })

// ❌ WRONG - Raw fetch() in client components
const response = await fetch('/api/locations')  // VIOLATION!
const data = await response.json()
```

### 4. Server Components vs Client Components

```typescript
// ✅ CORRECT - Server Component (default, no directive)
export default function LocationList({ locations }: Props) {
  return (
    <div className="animate-in fade-in">
      {locations.map(loc => <LocationCard key={loc.id} location={loc} />)}
    </div>
  )
}

// ✅ CORRECT - Client Component (only when needed)
"use client"

export function LocationForm() {
  const [name, setName] = useState('')  // Needs useState → use client
  return <input value={name} onChange={e => setName(e.target.value)} />
}

// ❌ WRONG - Unnecessary "use client"
"use client"  // VIOLATION - no hooks or events used!

export function LocationCard({ location }: Props) {
  return <div>{location.name}</div>
}
```

**Use `"use client"` ONLY when:**
- Using React hooks (useState, useEffect, etc.)
- Using event handlers (onClick, onChange, etc.)
- Using browser APIs (localStorage, window, etc.)
- Using client-only libraries

### 5. CSS Animations (No Framer Motion for Simple Effects)

```typescript
// ✅ CORRECT - CSS animations (zero JS bundle cost)
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  Content
</div>

// ✅ CORRECT - Staggered animations with delay
{items.map((item, index) => (
  <div
    key={item.id}
    className="animate-in fade-in slide-in-from-bottom-4"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {item.name}
  </div>
))}

// ❌ WRONG - Framer Motion for simple fade/slide
"use client"
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>  // VIOLATION - adds 40KB to bundle for CSS-achievable effect
```

**Tailwind Animation Classes:**
- `animate-in` / `animate-out` - Enable animation
- `fade-in` / `fade-out` - Opacity
- `slide-in-from-bottom-4` / `slide-in-from-left-4` - Position
- `zoom-in-95` / `zoom-out-95` - Scale
- `duration-300` / `duration-500` / `duration-700` - Timing
- `delay-100` / `delay-200` - Delay

### 6. Soft Deletes Only (NEVER Hard Delete)

```typescript
// ✅ CORRECT - Soft delete
async deleteLocation(id: string) {
  return this.update(id, { deleted_at: new Date().toISOString() })
}

// ✅ CORRECT - Filter out deleted records
async findActive() {
  return supabase.from('locations').select('*').is('deleted_at', null)
}

// ❌ WRONG - Hard delete
async deleteLocation(id: string) {
  return supabase.from('locations').delete().eq('id', id)  // VIOLATION!
}

// 🚨 CRITICAL VIOLATION - CASCADE DELETE
ALTER TABLE tickets ON DELETE CASCADE;  // NEVER DO THIS!
```

### 7. Tenant Isolation (BaseDAO Pattern)

```typescript
// ✅ CORRECT - Extend BaseDAO for tenant-scoped tables
export class LocationDAO extends BaseDAO<'locations'> {
  // BaseDAO automatically filters by tenant_id
}

// ❌ WRONG - Direct queries without tenant filter
const { data } = await supabase
  .from('locations')
  .select('*')  // VIOLATION - no tenant_id filter!
```

### 8. Form Validation (Zod at API Boundary)

```typescript
// ✅ CORRECT - Zod schema for validation
// src/lib/validations/location.ts
export const createLocationSchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().optional(),
  manager_id: z.string().uuid().optional(),
})

// API Route validates with Zod
export async function POST(request: Request) {
  const body = await request.json()
  const validated = createLocationSchema.parse(body)  // Throws on invalid
  const service = new LocationService()
  return NextResponse.json(await service.createLocation(validated))
}

// ❌ WRONG - Manual validation or no validation
export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name) throw new Error('Name required')  // VIOLATION - use Zod!
}
```

### 9. Component Size Limits

```typescript
// ✅ CORRECT - Small, focused components (~200 lines max)
export function LocationCard({ location }: Props) { /* ~50 lines */ }
export function LocationForm({ onSubmit }: Props) { /* ~100 lines */ }
export function LocationList({ locations }: Props) { /* ~80 lines */ }

// ❌ WRONG - Monolithic component (300+ lines)
export function LocationPage() {
  // 500 lines of mixed concerns - VIOLATION!
  // SPLIT INTO: LocationHeader, LocationFilters, LocationList, LocationForm
}
```

**Rule:** If a component exceeds 300 lines, split it into smaller components.

### 10. Import Organization

```typescript
// ✅ CORRECT - Organized imports
// 1. React/Next.js
import { useState, useEffect } from 'react'
import { NextResponse } from 'next/server'

// 2. Third-party libraries
import { z } from 'zod'

// 3. Internal - absolute imports
import { LocationService } from '@/services/location.service'
import { Button } from '@/components/ui/button'

// 4. Types
import type { Location } from '@/types/database'

// ❌ WRONG - Mixed/unorganized imports
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { z } from 'zod'
import { NextResponse } from 'next/server'
```

### Quick Reference Card

| Category | ✅ DO | ❌ DON'T |
|----------|-------|----------|
| Colors | `bg-primary`, `text-muted-foreground` | `bg-blue-500`, `#3B82F6` |
| Architecture | DAO → Service → Route | Database in routes |
| HTTP | `api.get()`, `api.post()` | `fetch()` in components |
| Components | Server by default | `"use client"` everywhere |
| Animations | `animate-in fade-in` | Framer Motion for basics |
| Deletes | `deleted_at = now()` | `DELETE FROM table` |
| Validation | Zod schemas | Manual if/throw |
| Size | <300 lines per file | Monolithic components |

## Mobile Responsiveness (CRITICAL)

**All components MUST be tested at these breakpoints:**
- 375px (mobile - iPhone SE/small phones)
- 768px (tablet - iPad)
- 1920px (desktop)

### Tailwind Breakpoint Reference

```
sm: 640px   - Small tablets
md: 768px   - Tablets
lg: 1024px  - Laptops
xl: 1280px  - Desktops
2xl: 1536px - Large screens
```

### Mobile-First Patterns

```tsx
// ✅ CORRECT - Mobile first, then larger screens
<div className="flex flex-col md:flex-row gap-4">
  <div className="w-full md:w-1/2">Content</div>
</div>

// ✅ CORRECT - Responsive text sizes
<h1 className="text-2xl md:text-3xl lg:text-4xl">Title</h1>

// ✅ CORRECT - Touch-friendly targets (min 44x44px)
<button className="min-h-[44px] min-w-[44px] px-4 py-2">

// ✅ CORRECT - Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ CORRECT - Hide/show based on screen size
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>

// ❌ WRONG - Fixed widths
<div className="w-[800px]">...</div>

// ❌ WRONG - Desktop-first (no base mobile styles)
<div className="md:flex-col flex-row">...</div>
```

### Common Mobile Patterns

**Tables → Cards on mobile:**
```tsx
{/* Desktop: Table */}
<table className="hidden md:table">...</table>

{/* Mobile: Cards */}
<div className="md:hidden space-y-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

**Sidebar → Bottom nav on mobile:**
```tsx
{/* Desktop: Sidebar */}
<aside className="hidden md:block w-64">...</aside>

{/* Mobile: Bottom navigation */}
<nav className="fixed bottom-0 left-0 right-0 md:hidden">...</nav>
```

**Forms → Full width on mobile:**
```tsx
<form className="w-full max-w-md mx-auto md:max-w-lg">
  <input className="w-full" />
</form>
```

### Page Container Pattern

```tsx
// Use this wrapper for all page content
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Page content */}
</div>
```

### Testing Checklist

Before completing any UI task, verify:
- [ ] Text is readable at 375px (no horizontal scroll)
- [ ] Buttons/links are touch-friendly (44px minimum)
- [ ] Forms are usable on mobile keyboards
- [ ] Tables convert to cards or scroll horizontally
- [ ] Modals/dialogs fit on mobile screens
- [ ] Navigation is accessible on mobile

## Dependencies by Phase

Most dependencies are pre-installed. Install any missing as needed:

| Phase | Dependencies | Status |
|-------|-------------|--------|
| 1 | `@tanstack/react-query` | ✅ Installed |
| 2 | `nodemailer` `@types/nodemailer` | ❌ Need to install |
| 3 | `@hello-pangea/dnd` | ❌ Need to install |
| 4 | `html5-qrcode` `qrcode.react` | ✅ Installed |
| 5 | (No additional dependencies) | ✅ |
| 6 | `recharts` | ✅ Installed |

**To install missing dependencies:**
```bash
# Phase 2 - SMTP email
npm install nodemailer
npm install -D @types/nodemailer

# Phase 3 - Kanban drag-drop
npm install @hello-pangea/dnd
```

**Required environment variables for SMTP (Phase 2):**
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourapp.com
```

## Context Management (CRITICAL)

**The #1 reason RALPH loops fail is context overflow.** Each iteration resets the context window, so you must use **files as external memory**.

### The Core Insight

> "The filesystem IS the state. Git IS the memory."

Claude's context window resets between iterations, but **files persist**. Structure your work so each iteration can:
1. Read a progress file to understand what's done
2. Check git history to see what was attempted
3. Run validation commands to verify current state
4. Update the progress file before completing

### Progress File Pattern (REQUIRED)

**Before starting any phase**, create `.claude/progress.md`:

```markdown
# Phase [X] Progress

## Current Task
Task 3: Location API Routes

## Completed Tasks
- [x] Task 1: Location DAO & Service ✅
- [x] Task 2: Location Zod Schemas ✅
- [ ] Task 3: Location API Routes (IN PROGRESS)
- [ ] Task 4: Location List Page
- [ ] Task 5: Location Detail Page

## Files Created
- src/dao/location.dao.ts
- src/services/location.service.ts
- src/lib/validations/location.ts

## Last Validation
```
npm run type-check ✅
npm run lint ✅
npm run build ✅
```

## Blockers/Notes
- None currently

## Next Action
Create src/app/api/locations/route.ts with GET and POST handlers
```

### Progress File Rules

**At the START of each iteration:**
```bash
# First action: Read progress file
cat .claude/progress.md
```

**At the END of each iteration:**
```bash
# Update progress file with:
# 1. Mark completed tasks
# 2. Update "Current Task"
# 3. List new files created
# 4. Record validation results
# 5. Note any blockers
```

### Why This Works

| Without Progress File | With Progress File |
|----------------------|-------------------|
| Claude re-reads entire codebase | Claude reads 50-line progress file |
| Forgets what was tried | Sees attempted solutions |
| Repeats same mistakes | Builds on previous work |
| Context fills with code | Context stays focused |

### Git as Memory

Commit frequently with descriptive messages:

```bash
# Good: Descriptive commits
git commit -m "feat(location): add LocationDAO with findAll, findById methods"
git commit -m "fix(location): resolve TypeScript error in findByManager return type"

# Bad: Vague commits
git commit -m "wip"
git commit -m "fixes"
```

Each iteration can run `git log --oneline -10` to see recent history.

### Task Chunking Strategy

**Break large phases into sub-tasks that fit in one context window:**

```
❌ BAD: "Implement entire ticket system"
   - Too large, will overflow context
   - No clear stopping points

✅ GOOD: Split into focused chunks:
   - Task 1: TicketDAO (read files, write 1 file)
   - Task 2: TicketService (read 2 files, write 1 file)
   - Task 3: Ticket API routes (read 2 files, write 3 files)
   - Task 4: Ticket list page (read 3 files, write 1 file)
```

**Rule of thumb:** Each task should touch ≤5 files.

### Context-Saving Prompts

Add these to your phase files:

```markdown
## Context Management Instructions

1. **First**: Read `.claude/progress.md` to understand current state
2. **Before each task**: Check which files exist with `ls src/dao/` etc.
3. **After each task**: Update `.claude/progress.md` with:
   - Mark task complete
   - List files created/modified
   - Record validation results
4. **If stuck**: Document in progress file, don't repeat same fix
5. **Commit often**: `git add -A && git commit -m "feat: [description]"`
```

### Avoiding Context Bloat

**DO:**
- Read only files you need to modify
- Use `git diff --stat` instead of reading entire files
- Keep progress file under 100 lines
- Commit and move on (don't re-read completed code)

**DON'T:**
- Read the entire codebase at start of each iteration
- Keep full file contents in conversation
- Re-explain completed work
- Read files you won't modify

### Sub-Phase Strategy for Large Phases

For Phase 3 (Tickets) and Phase 5 (Compliance/PM), split into sub-phases:

```bash
# Phase 3a: Core ticket infrastructure
/ralph-loop "Phase 3 Tasks 1-5 only: DAO, Service, API routes" --max-iterations 25

# Phase 3b: Ticket UI
/ralph-loop "Phase 3 Tasks 6-10 only: List, Detail, Forms" --max-iterations 25

# Phase 3c: Advanced features
/ralph-loop "Phase 3 Tasks 11-16: Comments, Attachments, Approvals" --max-iterations 25
```

### Emergency Context Reset

If the loop is thrashing (same error 5+ times):

```bash
# 1. Cancel the loop
/cancel-ralph

# 2. Commit current progress
git add -A && git commit -m "wip: partial progress before context reset"

# 3. Update progress file manually
# Add "CONTEXT RESET" note with what was working

# 4. Restart with fresh context
/ralph-loop "..." --max-iterations 20
```

## Stuck Detection & Recovery

If the loop isn't converging after many iterations:

### Signs You're Stuck
- Same error repeating for 5+ iterations
- Circular fixes (fix A breaks B, fix B breaks A)
- Build passing but functionality not working
- Tests failing with unclear errors

### What To Do When Stuck

1. **Document the blocker** in `.claude/stuck-log.md`:
   ```markdown
   ## Phase X - [Date]
   ### Issue
   [Describe what's not working]

   ### Attempted Solutions
   - [Solution 1] - Result: [outcome]
   - [Solution 2] - Result: [outcome]

   ### Blocking Factors
   - [What's preventing progress]

   ### Suggested Next Steps
   - [Ideas for human review]
   ```

2. **Cancel the loop**: `/cancel-ralph`

3. **Review and adjust**:
   - Check if the task is too ambiguous
   - Verify database schema matches expectations
   - Look for missing dependencies or configuration

### Recovery Commands

```bash
# Cancel current loop
/cancel-ralph

# Check what files changed
git diff --stat

# Revert if needed
git checkout -- .

# Or keep changes and continue manually
git add -p  # Stage selectively
```

## RALPH Philosophy

### Core Principles

1. **Iteration > Perfection** - Don't aim for perfect on first try. Let the loop refine the work.

2. **Failures Are Data** - "Deterministically bad" means failures are predictable and informative. Use them to tune prompts.

3. **Operator Skill Matters** - Success depends on writing good prompts with clear completion criteria.

4. **Persistence Wins** - Keep trying until success. The loop handles retry logic automatically.

### When RALPH Works Best

✅ **Ideal for:**
- Well-defined tasks with measurable success (tests pass, build succeeds)
- Large refactors and migrations
- Greenfield projects with clear specs
- Batch operations

❌ **Avoid for:**
- Ambiguous requirements
- Architectural decisions requiring judgment
- Security-sensitive code (needs human review)
- Tasks requiring subjective assessment

## Common Issues

- **TypeScript errors with Supabase queries**: Use `as any` pattern for dynamic table names (see base.dao.ts)
- **Build failures**: Always run `npm run type-check && npm run lint` before `npm run build`
- **Missing tenant context**: Ensure BaseDAO is used for all tenant-scoped tables
- **Loop not converging**: Check if completion criteria are too vague; add specific test commands
- **High token usage**: Set lower `--max-iterations` and break large phases into sub-phases
