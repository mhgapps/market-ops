# Phase 7: Complete All Implementation Gaps

## CRITICAL CONTEXT

This phase exists because Phases 1-6 left significant gaps. This spec is EXHAUSTIVE and DETAILED to ensure nothing is missed.

**Project Directory**: `mhg-facilities/` - ALL paths relative to this
**Run before starting**: `cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"`

## Prerequisites Verification

Before starting, run these checks and STOP if any fail:

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"
npm run type-check  # Must pass
npm run build       # Must pass - confirms app currently works
```

## Coding Standards (MANDATORY - READ EVERY ITERATION)

| Rule | ✅ DO | ❌ DON'T |
|------|-------|----------|
| Colors | `bg-primary`, `text-muted-foreground`, CSS variables | `bg-blue-500`, `#3B82F6`, hardcoded hex |
| Architecture | DAO → Service → API Route → Client Hook | Database queries in routes |
| HTTP Client | `api.get()` from `@/lib/api-client` | Raw `fetch()` in components |
| Components | Server Components by default | `"use client"` without hooks/events |
| Animations | `animate-in fade-in slide-in-from-bottom-4` | Framer Motion for simple fades |
| Deletes | `{ deleted_at: new Date().toISOString() }` | `DELETE FROM table` |
| Validation | Zod schemas at API boundary | Manual if/throw |
| File Size | <300 lines per component | 500+ line monoliths |
| Queries | Filter in database with `.eq()`, `.gte()` | Load all then filter in JS |
| Tenant | ALWAYS filter by `tenant_id` in DAO | Cross-tenant data leaks |

---

## TASK GROUP A: Missing Create/Edit Pages (High Priority)

These pages have forms/components but NO page routes. Create them.

### A1. Asset Edit Page

**File to create**: `src/app/(dashboard)/assets/[id]/edit/page.tsx`

```typescript
// Structure:
// 1. Import AssetForm component (already exists)
// 2. Fetch asset by ID using service
// 3. Pass asset data to form in edit mode
// 4. Handle update submission
// 5. Redirect to detail page on success

// The AssetForm component exists at: src/components/assets/asset-form.tsx
// The useUpdateAsset hook is MISSING - create it first (see A1b)
```

**Verification after creation**:
```bash
# Navigate to /assets/[some-id]/edit in browser - should load form with data
npm run type-check
```

### A1b. useUpdateAsset Hook (Missing)

**File to update**: `src/hooks/use-assets.ts`

Add this mutation hook (createAsset exists, updateAsset does not):

```typescript
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAssetInput }) => {
      return api.patch<Asset>(`/api/assets/${id}`, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) })
    },
  })
}
```

### A2. Asset Scan Results Page

**File to create**: `src/app/(dashboard)/assets/scan/page.tsx`

```typescript
'use client'

// Structure:
// 1. Import QRScanner component (exists at src/components/assets/qr-scanner.tsx)
// 2. On successful scan, extract QR code value
// 3. Call GET /api/assets/qr/[code] to find asset
// 4. If found: redirect to /assets/[id]
// 5. If not found: show "Asset not found" message with option to scan again

// Requirements:
// - Handle camera permission errors gracefully
// - Show loading state while looking up asset
// - Mobile-optimized layout (this is primarily a mobile feature)
```

**Verification**:
```bash
# Visit /assets/scan on mobile or with webcam
# Scan a QR code - should redirect to asset detail
```

### A3. Vendor Create Page

**File to create**: `src/app/(dashboard)/vendors/new/page.tsx`

```typescript
// Structure:
// 1. Import VendorForm (exists at src/components/vendors/vendor-form.tsx)
// 2. Render form in create mode (no initial data)
// 3. On submit, call POST /api/vendors
// 4. Redirect to /vendors/[id] on success
// 5. Show toast notification

// Admin-only: wrap with RequireRole or check in parent layout
```

### A4. Vendor Edit Page

**File to create**: `src/app/(dashboard)/vendors/[id]/edit/page.tsx`

```typescript
// Structure:
// 1. Fetch vendor by ID
// 2. Pass to VendorForm in edit mode
// 3. On submit, call PATCH /api/vendors/[id]
// 4. Redirect to /vendors/[id] on success
```

### A5. Compliance Create Page

**File to create**: `src/app/(dashboard)/compliance/new/page.tsx`

```typescript
// Structure:
// 1. Import ComplianceForm (exists at src/components/compliance/compliance-form.tsx)
// 2. Render in create mode
// 3. On submit, call POST /api/compliance
// 4. Redirect to /compliance/[id] on success
```

### A6. Compliance Edit Page

**File to create**: `src/app/(dashboard)/compliance/[id]/edit/page.tsx`

```typescript
// Structure:
// 1. Fetch document by ID
// 2. Pass to ComplianceForm in edit mode
// 3. On submit, call PATCH /api/compliance/[id]
// 4. Redirect to /compliance/[id] on success
```

### A7. PM Schedule Create Page

**File to create**: `src/app/(dashboard)/pm/new/page.tsx`

```typescript
// Structure:
// 1. Import PMScheduleForm (exists at src/components/pm/pm-schedule-form.tsx)
// 2. Render in create mode
// 3. On submit, call POST /api/pm-schedules
// 4. Redirect to /pm/[id] on success
```

### A8. PM Schedule Edit Page

**File to create**: `src/app/(dashboard)/pm/[id]/edit/page.tsx`

```typescript
// Structure:
// 1. Fetch schedule by ID
// 2. Pass to PMScheduleForm in edit mode
// 3. On submit, call PATCH /api/pm-schedules/[id]
// 4. Redirect to /pm/[id] on success
```

### A9. PM Template Management Pages

**Files to create**:
- `src/app/(dashboard)/pm/templates/page.tsx` - List templates
- `src/app/(dashboard)/pm/templates/new/page.tsx` - Create template
- `src/app/(dashboard)/pm/templates/[id]/page.tsx` - View/edit template

```typescript
// Templates list page structure:
// 1. Fetch all templates with GET /api/pm-templates
// 2. Display in table with name, category, schedule count
// 3. Add/Edit/Delete actions

// Create/Edit pages:
// 1. Form with: name, description, category, checklist (JSON array builder), duration, default vendor
// 2. Checklist builder: add/remove/reorder checklist items
```

**Verification for all A tasks**:
```bash
npm run type-check
npm run build
# Then manually test each page in browser
```

---

## TASK GROUP B: Realtime & Notifications (Critical Gap)

### B1. Supabase Realtime Subscription Hook

**File to create**: `src/hooks/use-realtime.ts`

```typescript
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type TableName = 'tickets' | 'assets' | 'compliance_documents' | 'pm_schedules'

export function useRealtimeSubscription(
  table: TableName,
  queryKey: string[],
  filter?: { column: string; value: string }
) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    let channel: RealtimeChannel

    const setupChannel = () => {
      const channelName = filter
        ? `${table}-${filter.column}-${filter.value}`
        : `${table}-changes`

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            ...(filter && { filter: `${filter.column}=eq.${filter.value}` }),
          },
          (payload) => {
            console.log(`[Realtime] ${table} change:`, payload.eventType)
            // Invalidate queries to refetch fresh data
            queryClient.invalidateQueries({ queryKey })
          }
        )
        .subscribe((status) => {
          console.log(`[Realtime] ${table} subscription:`, status)
        })
    }

    setupChannel()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [table, queryKey, filter, queryClient, supabase])
}

// Convenience hooks for specific tables
export function useTicketRealtime(locationId?: string) {
  useRealtimeSubscription(
    'tickets',
    ['tickets'],
    locationId ? { column: 'location_id', value: locationId } : undefined
  )
}

export function useAssetRealtime() {
  useRealtimeSubscription('assets', ['assets'])
}

export function useComplianceRealtime() {
  useRealtimeSubscription('compliance_documents', ['compliance'])
}

export function usePMRealtime() {
  useRealtimeSubscription('pm_schedules', ['pm-schedules'])
}
```

### B2. Integrate Realtime into Ticket List

**File to update**: `src/app/(dashboard)/tickets/page.tsx`

Add near the top of the component:
```typescript
import { useTicketRealtime } from '@/hooks/use-realtime'

// Inside component, before return:
useTicketRealtime() // Now ticket list auto-refreshes when DB changes
```

### B3. Resend Email Integration

**File to create**: `src/iao/resend/index.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail(params: SendEmailParams): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: params.from ?? process.env.EMAIL_FROM ?? 'MHG Facilities <noreply@facilities.app>',
    to: params.to,
    subject: params.subject,
    html: params.html,
    replyTo: params.replyTo,
  })

  if (error) {
    console.error('[Resend] Email send failed:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return { id: data!.id }
}

// Convenience method for ticket notifications
export async function sendTicketNotification(
  to: string,
  ticketNumber: number,
  ticketTitle: string,
  action: 'created' | 'assigned' | 'updated' | 'completed',
  ticketUrl: string
) {
  const subjects: Record<typeof action, string> = {
    created: `New Ticket #${ticketNumber}: ${ticketTitle}`,
    assigned: `Ticket #${ticketNumber} Assigned to You`,
    updated: `Ticket #${ticketNumber} Updated`,
    completed: `Ticket #${ticketNumber} Completed`,
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1e40af;">Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}</h2>
      <p><strong>Ticket #${ticketNumber}:</strong> ${ticketTitle}</p>
      <p>
        <a href="${ticketUrl}" style="
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
        ">View Ticket</a>
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
        MHG Facilities Management System
      </p>
    </div>
  `

  return sendEmail({ to, subject: subjects[action], html })
}
```

**Required env var**: Add to `.env.local`:
```
RESEND_API_KEY=re_xxxx
EMAIL_FROM=MHG Facilities <noreply@yourverifieddomain.com>
```

### B4. Notification Service

**File to create**: `src/services/notification.service.ts`

```typescript
import { sendEmail, sendTicketNotification } from '@/iao/resend'
import { UserDAO } from '@/dao/user.dao'
import type { Ticket } from '@/types'

export class NotificationService {
  constructor(private userDAO = new UserDAO()) {}

  async notifyTicketCreated(ticket: Ticket) {
    // Don't await - fire and forget for performance
    this.sendTicketEmailAsync(ticket, 'created')
  }

  async notifyTicketAssigned(ticket: Ticket) {
    if (!ticket.assigned_to) return

    const assignee = await this.userDAO.findById(ticket.assigned_to)
    if (!assignee?.email) return

    const prefs = assignee.notification_preferences as { email?: boolean } | null
    if (prefs?.email === false) return

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://facilities.app'
    const ticketUrl = `${baseUrl}/tickets/${ticket.id}`

    try {
      await sendTicketNotification(
        assignee.email,
        ticket.ticket_number,
        ticket.title,
        'assigned',
        ticketUrl
      )
    } catch (error) {
      console.error('[Notification] Failed to send assignment email:', error)
    }
  }

  async notifyTicketCompleted(ticket: Ticket) {
    if (!ticket.submitted_by) return

    const submitter = await this.userDAO.findById(ticket.submitted_by)
    if (!submitter?.email) return

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://facilities.app'
    const ticketUrl = `${baseUrl}/tickets/${ticket.id}`

    try {
      await sendTicketNotification(
        submitter.email,
        ticket.ticket_number,
        ticket.title,
        'completed',
        ticketUrl
      )
    } catch (error) {
      console.error('[Notification] Failed to send completion email:', error)
    }
  }

  private async sendTicketEmailAsync(ticket: Ticket, action: 'created' | 'updated') {
    try {
      // Get admins to notify
      const admins = await this.userDAO.findAdmins()
      const adminEmails = admins
        .filter(a => (a.notification_preferences as { email?: boolean } | null)?.email !== false)
        .map(a => a.email)
        .filter(Boolean) as string[]

      if (adminEmails.length === 0) return

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://facilities.app'
      const ticketUrl = `${baseUrl}/tickets/${ticket.id}`

      await sendTicketNotification(
        adminEmails,
        ticket.ticket_number,
        ticket.title,
        action,
        ticketUrl
      )
    } catch (error) {
      console.error('[Notification] Failed to send ticket email:', error)
    }
  }
}
```

### B5. Wire Notifications into Ticket Service

**File to update**: `src/services/ticket.service.ts`

Add at top:
```typescript
import { NotificationService } from './notification.service'
```

In constructor:
```typescript
constructor(
  private ticketDAO = new TicketDAO(),
  private notificationService = new NotificationService(), // ADD THIS
  // ... other DAOs
) {}
```

In `createTicket` method, after ticket is created:
```typescript
// After: const ticket = await this.ticketDAO.create(data)
// Add (don't await - fire and forget):
this.notificationService.notifyTicketCreated(ticket)
```

In `assignTicket` method (or wherever assignment happens):
```typescript
// After assignment is saved:
this.notificationService.notifyTicketAssigned(ticket)
```

In `completeTicket` method (or status transition to 'completed'):
```typescript
// After status changed to completed:
this.notificationService.notifyTicketCompleted(ticket)
```

---

## TASK GROUP C: Cron Jobs (PM & Escalation)

### C1. Complete PM Ticket Generation Cron

**File to update**: `src/app/api/cron/pm-generate/route.ts`

The skeleton exists but doesn't actually create tickets. Replace with:

```typescript
import { NextResponse } from 'next/server'
import { PMScheduleService } from '@/services/pm-schedule.service'
import { TicketService } from '@/services/ticket.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const pmService = new PMScheduleService()
  const ticketService = new TicketService()

  try {
    // Get all due schedules (due today or overdue)
    const dueSchedules = await pmService.getDueSchedules()

    const results = {
      processed: 0,
      ticketsCreated: 0,
      errors: [] as string[],
    }

    for (const schedule of dueSchedules) {
      try {
        // Skip if ticket was already generated recently (within last 24h)
        if (schedule.last_generated_at) {
          const lastGenerated = new Date(schedule.last_generated_at)
          const hoursSinceLastGen = (Date.now() - lastGenerated.getTime()) / (1000 * 60 * 60)
          if (hoursSinceLastGen < 24) {
            continue
          }
        }

        // Create the ticket
        const ticket = await ticketService.createTicket({
          title: `[PM] ${schedule.name}`,
          description: schedule.description ?? `Preventive maintenance task: ${schedule.name}`,
          location_id: schedule.location_id!,
          asset_id: schedule.asset_id ?? undefined,
          priority: 'medium',
          submitted_by: schedule.assigned_to ?? undefined,
          assigned_to: schedule.assigned_to ?? undefined,
          vendor_id: schedule.vendor_id ?? undefined,
        })

        // Record PM completion placeholder (will be completed when ticket closes)
        await pmService.recordTicketGenerated(schedule.id, ticket.id)

        results.ticketsCreated++
      } catch (error) {
        results.errors.push(`Schedule ${schedule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      results.processed++
    }

    console.log('[Cron] PM Generate results:', results)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[Cron] PM Generate failed:', error)
    return NextResponse.json(
      { error: 'PM generation failed' },
      { status: 500 }
    )
  }
}
```

### C1b. Add recordTicketGenerated to PM Service

**File to update**: `src/services/pm-schedule.service.ts`

Add method:
```typescript
async recordTicketGenerated(scheduleId: string, ticketId: string) {
  // Update last_generated_at
  await this.pmScheduleDAO.update(scheduleId, {
    last_generated_at: new Date().toISOString(),
  })

  // Create PM completion record (status: pending)
  await this.pmCompletionDAO.create({
    schedule_id: scheduleId,
    ticket_id: ticketId,
    scheduled_date: new Date().toISOString(),
    // completed_date will be set when ticket is completed
  })
}
```

### C2. Escalation Enforcement Cron

**File to create**: `src/app/api/cron/escalation/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { TicketDAO } from '@/dao/ticket.dao'
import { TicketCategoryDAO } from '@/dao/ticket-category.dao'
import { NotificationService } from '@/services/notification.service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticketDAO = new TicketDAO()
  const categoryDAO = new TicketCategoryDAO()
  const notificationService = new NotificationService()

  try {
    // Get all unacknowledged tickets
    const unacknowledgedTickets = await ticketDAO.findByStatus('submitted')

    const results = {
      checked: 0,
      escalated: 0,
      errors: [] as string[],
    }

    for (const ticket of unacknowledgedTickets) {
      try {
        // Get category escalation hours (default 4)
        let escalationHours = 4
        if (ticket.category_id) {
          const category = await categoryDAO.findById(ticket.category_id)
          escalationHours = category?.escalation_hours ?? 4
        }

        // Check if ticket has exceeded escalation threshold
        const createdAt = new Date(ticket.created_at)
        const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)

        if (hoursSinceCreated >= escalationHours) {
          // Mark as escalated (update priority to high if not already)
          if (ticket.priority !== 'critical' && ticket.priority !== 'high') {
            await ticketDAO.update(ticket.id, { priority: 'high' })
          }

          // Send escalation notification to admins
          // Note: notificationService would need an escalation method
          console.log(`[Escalation] Ticket ${ticket.ticket_number} escalated after ${hoursSinceCreated.toFixed(1)} hours`)

          results.escalated++
        }

        results.checked++
      } catch (error) {
        results.errors.push(`Ticket ${ticket.id}: ${error instanceof Error ? error.message : 'Unknown'}`)
      }
    }

    console.log('[Cron] Escalation results:', results)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[Cron] Escalation check failed:', error)
    return NextResponse.json({ error: 'Escalation check failed' }, { status: 500 })
  }
}
```

### C3. Compliance Alert Cron (Complete Implementation)

**File to update**: `src/app/api/cron/compliance-alerts/route.ts`

Current implementation only logs. Make it actually send emails:

```typescript
import { NextResponse } from 'next/server'
import { ComplianceDocumentDAO } from '@/dao/compliance-document.dao'
import { ComplianceAlertDAO } from '@/dao/compliance-alert.dao'
import { UserDAO } from '@/dao/user.dao'
import { sendEmail } from '@/iao/resend'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const docDAO = new ComplianceDocumentDAO()
  const alertDAO = new ComplianceAlertDAO()
  const userDAO = new UserDAO()

  const alertThresholds = [90, 60, 30, 14, 7] // Days before expiration

  try {
    const results = {
      documentsChecked: 0,
      alertsSent: 0,
      errors: [] as string[],
    }

    // Get admins to notify
    const admins = await userDAO.findAdmins()
    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]

    if (adminEmails.length === 0) {
      return NextResponse.json({ message: 'No admin emails configured', results })
    }

    for (const days of alertThresholds) {
      // Get documents expiring in exactly N days
      const expiringDocs = await docDAO.findExpiringInDays(days)

      for (const doc of expiringDocs) {
        try {
          // Check if alert already sent for this threshold
          const existingAlert = await alertDAO.findByDocumentAndType(doc.id, `${days}_day`)
          if (existingAlert) continue

          // Send alert email
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://facilities.app'
          const docUrl = `${baseUrl}/compliance/${doc.id}`

          const urgency = days <= 7 ? 'URGENT' : days <= 30 ? 'Important' : 'Notice'

          await sendEmail({
            to: adminEmails,
            subject: `[${urgency}] ${doc.name} expires in ${days} days`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: ${days <= 7 ? '#dc2626' : days <= 30 ? '#d97706' : '#2563eb'};">
                  Compliance Document Expiring
                </h2>
                <p><strong>${doc.name}</strong> will expire in <strong>${days} days</strong>.</p>
                <p>Expiration date: ${new Date(doc.expiration_date!).toLocaleDateString()}</p>
                <p>
                  <a href="${docUrl}" style="
                    display: inline-block;
                    padding: 12px 24px;
                    background-color: #2563eb;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                  ">View Document</a>
                </p>
              </div>
            `,
          })

          // Record that alert was sent
          await alertDAO.create({
            document_id: doc.id,
            alert_type: `${days}_day` as any,
            sent_to: adminEmails,
            delivery_method: 'email',
          })

          results.alertsSent++
        } catch (error) {
          results.errors.push(`Doc ${doc.id}: ${error instanceof Error ? error.message : 'Unknown'}`)
        }
        results.documentsChecked++
      }
    }

    console.log('[Cron] Compliance alerts results:', results)
    return NextResponse.json(results)
  } catch (error) {
    console.error('[Cron] Compliance alerts failed:', error)
    return NextResponse.json({ error: 'Compliance alerts failed' }, { status: 500 })
  }
}
```

### C3b. Add findExpiringInDays to ComplianceDocumentDAO

**File to update**: `src/dao/compliance-document.dao.ts`

Add method:
```typescript
async findExpiringInDays(days: number): Promise<ComplianceDocument[]> {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + days)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  const { data, error } = await this.supabase
    .from('compliance_documents')
    .select('*')
    .eq('tenant_id', await this.getTenantId())
    .is('deleted_at', null)
    .eq('expiration_date', targetDateStr)
    .in('status', ['active', 'expiring_soon'])

  if (error) throw error
  return data ?? []
}
```

### C3c. Add findByDocumentAndType to ComplianceAlertDAO

**File to update**: `src/dao/compliance-alert.dao.ts`

Add method:
```typescript
async findByDocumentAndType(documentId: string, alertType: string) {
  const { data, error } = await this.supabase
    .from('compliance_alerts')
    .select('*')
    .eq('document_id', documentId)
    .eq('alert_type', alertType)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}
```

### C4. Add Vercel Cron Config

**File to create/update**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/pm-generate",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/escalation",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/compliance-alerts",
      "schedule": "0 8 * * *"
    }
  ]
}
```

---

## TASK GROUP D: Emergency Management (25% → 100%)

This module is severely incomplete. Build it fully.

### D1. Emergency Incident Service

**File to create**: `src/services/emergency-incident.service.ts`

```typescript
import { EmergencyIncidentDAO } from '@/dao/emergency-incident.dao'
import { OnCallScheduleDAO } from '@/dao/on-call-schedule.dao'
import { NotificationService } from './notification.service'
import type { EmergencyIncidentInsert, EmergencyIncidentUpdate } from '@/types/database-extensions'

export class EmergencyIncidentService {
  constructor(
    private incidentDAO = new EmergencyIncidentDAO(),
    private onCallDAO = new OnCallScheduleDAO(),
    private notificationService = new NotificationService()
  ) {}

  async createIncident(data: Omit<EmergencyIncidentInsert, 'tenant_id'>) {
    const incident = await this.incidentDAO.create(data)

    // Notify on-call staff immediately for critical incidents
    if (data.severity === 'critical') {
      await this.notifyOnCallStaff(incident)
    }

    return incident
  }

  async getActiveIncidents() {
    return this.incidentDAO.findActive()
  }

  async getIncidentById(id: string) {
    return this.incidentDAO.findById(id)
  }

  async markContained(id: string, notes?: string) {
    return this.incidentDAO.markContained(id, notes)
  }

  async markResolved(id: string, resolutionNotes: string) {
    return this.incidentDAO.markResolved(id, resolutionNotes)
  }

  async getIncidentsByLocation(locationId: string) {
    return this.incidentDAO.findByLocation(locationId)
  }

  async getRecentIncidents(days: number = 30) {
    return this.incidentDAO.findRecent(days)
  }

  private async notifyOnCallStaff(incident: any) {
    try {
      const onCallUsers = await this.onCallDAO.findCurrentOnCall(incident.location_id)
      // Would send SMS/email to on-call users
      console.log('[Emergency] Notifying on-call:', onCallUsers.map(u => u.user_id))
    } catch (error) {
      console.error('[Emergency] Failed to notify on-call:', error)
    }
  }
}
```

### D2. On-Call Schedule Service

**File to create**: `src/services/on-call-schedule.service.ts`

```typescript
import { OnCallScheduleDAO } from '@/dao/on-call-schedule.dao'
import type { OnCallScheduleInsert, OnCallScheduleUpdate } from '@/types/database-extensions'

export class OnCallScheduleService {
  constructor(private scheduleDAO = new OnCallScheduleDAO()) {}

  async createSchedule(data: Omit<OnCallScheduleInsert, 'tenant_id'>) {
    // Check for overlapping schedules
    const hasOverlap = await this.scheduleDAO.hasOverlap(
      data.user_id,
      data.start_datetime,
      data.end_datetime,
      data.location_id ?? undefined
    )

    if (hasOverlap) {
      throw new Error('Schedule overlaps with existing on-call assignment')
    }

    return this.scheduleDAO.create(data)
  }

  async getAllSchedules() {
    return this.scheduleDAO.findAll()
  }

  async getSchedulesByDateRange(start: Date, end: Date) {
    return this.scheduleDAO.findByDateRange(start.toISOString(), end.toISOString())
  }

  async getCurrentOnCall(locationId?: string) {
    return this.scheduleDAO.findCurrentOnCall(locationId)
  }

  async getSchedulesByUser(userId: string) {
    return this.scheduleDAO.findByUserId(userId)
  }

  async updateSchedule(id: string, data: OnCallScheduleUpdate) {
    return this.scheduleDAO.update(id, data)
  }

  async deleteSchedule(id: string) {
    return this.scheduleDAO.softDelete(id)
  }
}
```

### D3. Emergency API Routes

**File to create**: `src/app/api/emergencies/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { EmergencyIncidentService } from '@/services/emergency-incident.service'
import { requireAuth, requireManager } from '@/lib/auth/api-auth'
import { z } from 'zod'

const createIncidentSchema = z.object({
  location_id: z.string().uuid(),
  incident_type: z.enum(['health_closure', 'fire', 'flood', 'equipment_failure', 'power_outage', 'gas_leak', 'other']),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  severity: z.enum(['high', 'critical']).default('high'),
})

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const service = new EmergencyIncidentService()
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const locationId = searchParams.get('location_id')

  try {
    let incidents
    if (status === 'active') {
      incidents = await service.getActiveIncidents()
    } else if (locationId) {
      incidents = await service.getIncidentsByLocation(locationId)
    } else {
      incidents = await service.getRecentIncidents()
    }
    return NextResponse.json(incidents)
  } catch (err) {
    console.error('[API] Get emergencies failed:', err)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error

  try {
    const body = await request.json()
    const data = createIncidentSchema.parse(body)

    const service = new EmergencyIncidentService()
    const incident = await service.createIncident({
      ...data,
      reported_by: user.id,
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    console.error('[API] Create emergency failed:', err)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
```

**File to create**: `src/app/api/emergencies/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { EmergencyIncidentService } from '@/services/emergency-incident.service'
import { requireAuth } from '@/lib/auth/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const service = new EmergencyIncidentService()

  try {
    const incident = await service.getIncidentById(id)
    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }
    return NextResponse.json(incident)
  } catch (err) {
    console.error('[API] Get emergency failed:', err)
    return NextResponse.json({ error: 'Failed to fetch incident' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const service = new EmergencyIncidentService()

  try {
    const body = await request.json()
    const { action, notes } = body

    let incident
    if (action === 'contain') {
      incident = await service.markContained(id, notes)
    } else if (action === 'resolve') {
      if (!notes) {
        return NextResponse.json({ error: 'Resolution notes required' }, { status: 400 })
      }
      incident = await service.markResolved(id, notes)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(incident)
  } catch (err) {
    console.error('[API] Update emergency failed:', err)
    return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
  }
}
```

### D4. On-Call API Routes

**File to create**: `src/app/api/on-call/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { OnCallScheduleService } from '@/services/on-call-schedule.service'
import { requireAuth, requireAdmin } from '@/lib/auth/api-auth'
import { z } from 'zod'

const createScheduleSchema = z.object({
  user_id: z.string().uuid(),
  location_id: z.string().uuid().optional(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  is_backup: z.boolean().default(false),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { error } = await requireAuth()
  if (error) return error

  const service = new OnCallScheduleService()
  const { searchParams } = new URL(request.url)
  const current = searchParams.get('current') === 'true'
  const locationId = searchParams.get('location_id')

  try {
    if (current) {
      const onCall = await service.getCurrentOnCall(locationId ?? undefined)
      return NextResponse.json(onCall)
    }
    const schedules = await service.getAllSchedules()
    return NextResponse.json(schedules)
  } catch (err) {
    console.error('[API] Get on-call failed:', err)
    return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const body = await request.json()
    const data = createScheduleSchema.parse(body)

    const service = new OnCallScheduleService()
    const schedule = await service.createSchedule(data)

    return NextResponse.json(schedule, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 })
    }
    if (err instanceof Error && err.message.includes('overlap')) {
      return NextResponse.json({ error: err.message }, { status: 409 })
    }
    console.error('[API] Create on-call failed:', err)
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
```

### D5. Emergency List Page

**File to create**: `src/app/(dashboard)/emergencies/page.tsx`

```typescript
import { Suspense } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Plus, Clock, CheckCircle } from 'lucide-react'
import { EmergencyIncidentService } from '@/services/emergency-incident.service'
import { formatDistanceToNow } from 'date-fns'

async function EmergencyList() {
  const service = new EmergencyIncidentService()
  const [activeIncidents, recentIncidents] = await Promise.all([
    service.getActiveIncidents(),
    service.getRecentIncidents(30),
  ])

  const resolvedCount = recentIncidents.filter(i => i.status === 'resolved').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {activeIncidents.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {resolvedCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total (30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentIncidents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents */}
      {activeIncidents.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Active Emergencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/emergencies/${incident.id}`}
                  className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{incident.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {incident.incident_type.replace('_', ' ')}
                      </p>
                    </div>
                    <Badge variant={incident.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {incident.severity}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDistanceToNow(new Date(incident.reported_at), { addSuffix: true })}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent History (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {recentIncidents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No incidents in the last 30 days
            </p>
          ) : (
            <div className="space-y-2">
              {recentIncidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/emergencies/${incident.id}`}
                  className="flex items-center justify-between p-3 border rounded hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    <span>{incident.title}</span>
                  </div>
                  <Badge variant="outline">{incident.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function EmergenciesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Emergency Incidents</h1>
          <p className="text-muted-foreground">
            Track and manage emergency situations
          </p>
        </div>
        <Button asChild>
          <Link href="/emergencies/new">
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Link>
        </Button>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <EmergencyList />
      </Suspense>
    </div>
  )
}
```

### D6. Emergency Create Page

**File to create**: `src/app/(dashboard)/emergencies/new/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLocations } from '@/hooks/use-locations'
import api from '@/lib/api-client'
import { toast } from 'sonner'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const incidentTypes = [
  { value: 'health_closure', label: 'Health Department Closure' },
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood/Water Damage' },
  { value: 'equipment_failure', label: 'Major Equipment Failure' },
  { value: 'power_outage', label: 'Power Outage' },
  { value: 'gas_leak', label: 'Gas Leak' },
  { value: 'other', label: 'Other Emergency' },
]

export default function NewEmergencyPage() {
  const router = useRouter()
  const { data: locations } = useLocations()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      location_id: formData.get('location_id'),
      incident_type: formData.get('incident_type'),
      title: formData.get('title'),
      description: formData.get('description'),
      severity: formData.get('severity'),
    }

    try {
      const incident = await api.post('/api/emergencies', data)
      toast.success('Emergency incident reported')
      router.push(`/emergencies/${incident.id}`)
    } catch (error) {
      toast.error('Failed to report incident')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/emergencies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Report Emergency</h1>
          <p className="text-muted-foreground">
            Document an emergency incident
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Incident Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location_id">Location *</Label>
              <Select name="location_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="incident_type">Incident Type *</Label>
              <Select name="incident_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select name="severity" defaultValue="high">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Brief description of the emergency"
                required
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Details</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Additional details about the incident..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Reporting...' : 'Report Emergency'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/emergencies">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

### D7. Emergency Hooks

**File to create**: `src/hooks/use-emergencies.ts`

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { EmergencyIncidentRow } from '@/types/database-extensions'

export const emergencyKeys = {
  all: ['emergencies'] as const,
  active: () => [...emergencyKeys.all, 'active'] as const,
  detail: (id: string) => [...emergencyKeys.all, id] as const,
}

export function useEmergencies(status?: 'active') {
  const url = status ? `/api/emergencies?status=${status}` : '/api/emergencies'
  return useQuery({
    queryKey: status ? emergencyKeys.active() : emergencyKeys.all,
    queryFn: () => api.get<EmergencyIncidentRow[]>(url),
  })
}

export function useEmergency(id: string) {
  return useQuery({
    queryKey: emergencyKeys.detail(id),
    queryFn: () => api.get<EmergencyIncidentRow>(`/api/emergencies/${id}`),
    enabled: !!id,
  })
}

export function useCreateEmergency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/api/emergencies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all })
    },
  })
}

export function useUpdateEmergencyStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, notes }: { id: string; action: 'contain' | 'resolve'; notes?: string }) =>
      api.patch(`/api/emergencies/${id}`, { action, notes }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: emergencyKeys.all })
      queryClient.invalidateQueries({ queryKey: emergencyKeys.detail(variables.id) })
    },
  })
}
```

---

## TASK GROUP E: Export Functionality (PDF & Excel)

### E1. PDF Export Service

**File to create**: `src/lib/export/pdf.ts`

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportColumn {
  header: string
  accessor: string
}

interface PDFExportOptions {
  title: string
  columns: ExportColumn[]
  data: Record<string, any>[]
  filename?: string
  orientation?: 'portrait' | 'landscape'
}

export function exportToPDF(options: PDFExportOptions): void {
  const { title, columns, data, filename = 'export', orientation = 'portrait' } = options

  const doc = new jsPDF({ orientation })

  // Title
  doc.setFontSize(18)
  doc.text(title, 14, 20)

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)

  // Table
  autoTable(doc, {
    startY: 35,
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => {
      const value = row[col.accessor]
      // Format dates
      if (value instanceof Date) {
        return value.toLocaleDateString()
      }
      // Format currency
      if (typeof value === 'number' && col.accessor.includes('cost')) {
        return `$${value.toFixed(2)}`
      }
      return value ?? ''
    })),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] }, // Primary blue
  })

  doc.save(`${filename}.pdf`)
}

// Convenience exports for specific report types
export function exportTicketsToPDF(tickets: any[]) {
  exportToPDF({
    title: 'Tickets Report',
    columns: [
      { header: 'Ticket #', accessor: 'ticket_number' },
      { header: 'Title', accessor: 'title' },
      { header: 'Status', accessor: 'status' },
      { header: 'Priority', accessor: 'priority' },
      { header: 'Location', accessor: 'location_name' },
      { header: 'Created', accessor: 'created_at' },
    ],
    data: tickets,
    filename: 'tickets-report',
    orientation: 'landscape',
  })
}

export function exportComplianceToPDF(documents: any[]) {
  exportToPDF({
    title: 'Compliance Status Report',
    columns: [
      { header: 'Document', accessor: 'name' },
      { header: 'Type', accessor: 'type_name' },
      { header: 'Status', accessor: 'status' },
      { header: 'Expiration', accessor: 'expiration_date' },
      { header: 'Location', accessor: 'location_name' },
    ],
    data: documents,
    filename: 'compliance-report',
  })
}
```

### E2. Excel Export Service

**File to create**: `src/lib/export/excel.ts`

```typescript
import * as XLSX from 'xlsx'

interface ExcelExportOptions {
  sheetName: string
  data: Record<string, any>[]
  filename?: string
  columns?: { header: string; accessor: string }[]
}

export function exportToExcel(options: ExcelExportOptions): void {
  const { sheetName, data, filename = 'export', columns } = options

  // If columns specified, transform data to use headers
  let exportData: any[]
  if (columns) {
    exportData = data.map(row => {
      const transformed: Record<string, any> = {}
      columns.forEach(col => {
        transformed[col.header] = row[col.accessor]
      })
      return transformed
    })
  } else {
    exportData = data
  }

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

  // Auto-size columns
  const maxWidths: number[] = []
  exportData.forEach(row => {
    Object.values(row).forEach((val, i) => {
      const length = String(val).length
      maxWidths[i] = Math.max(maxWidths[i] || 10, length)
    })
  })
  worksheet['!cols'] = maxWidths.map(w => ({ wch: Math.min(w + 2, 50) }))

  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

// Convenience exports
export function exportTicketsToExcel(tickets: any[]) {
  exportToExcel({
    sheetName: 'Tickets',
    data: tickets,
    filename: 'tickets-export',
    columns: [
      { header: 'Ticket #', accessor: 'ticket_number' },
      { header: 'Title', accessor: 'title' },
      { header: 'Description', accessor: 'description' },
      { header: 'Status', accessor: 'status' },
      { header: 'Priority', accessor: 'priority' },
      { header: 'Location', accessor: 'location_name' },
      { header: 'Assigned To', accessor: 'assigned_to_name' },
      { header: 'Created', accessor: 'created_at' },
      { header: 'Completed', accessor: 'completed_at' },
      { header: 'Cost', accessor: 'actual_cost' },
    ],
  })
}

export function exportAssetsToExcel(assets: any[]) {
  exportToExcel({
    sheetName: 'Assets',
    data: assets,
    filename: 'assets-export',
    columns: [
      { header: 'Name', accessor: 'name' },
      { header: 'Serial #', accessor: 'serial_number' },
      { header: 'Model', accessor: 'model' },
      { header: 'Manufacturer', accessor: 'manufacturer' },
      { header: 'Location', accessor: 'location_name' },
      { header: 'Status', accessor: 'status' },
      { header: 'Purchase Date', accessor: 'purchase_date' },
      { header: 'Warranty Exp', accessor: 'warranty_expiration' },
    ],
  })
}
```

### E3. Update Reports Page with Export Buttons

**File to update**: `src/app/(dashboard)/reports/page.tsx`

Add import at top:
```typescript
import { exportToPDF, exportTicketsToPDF, exportComplianceToPDF } from '@/lib/export/pdf'
import { exportToExcel, exportTicketsToExcel, exportAssetsToExcel } from '@/lib/export/excel'
```

Add export buttons to the UI:
```typescript
// Add these buttons next to the existing CSV export button
<Button onClick={() => exportTicketsToPDF(reportData)}>
  <FileText className="h-4 w-4 mr-2" />
  Export PDF
</Button>
<Button onClick={() => exportTicketsToExcel(reportData)}>
  <FileSpreadsheet className="h-4 w-4 mr-2" />
  Export Excel
</Button>
```

---

## TASK GROUP F: Settings Pages

### F1. Settings Notifications Page

**File to create**: `src/app/(dashboard)/settings/notifications/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api-client'
import { toast } from 'sonner'
import { Bell, Mail, MessageSquare, Smartphone } from 'lucide-react'

interface NotificationPrefs {
  email: boolean
  sms: boolean
  push: boolean
}

export default function NotificationSettingsPage() {
  const { user, refetch } = useAuth()
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    sms: false,
    push: true,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user?.notification_preferences) {
      setPrefs(user.notification_preferences as NotificationPrefs)
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await api.patch(`/api/users/${user?.id}`, {
        notification_preferences: prefs,
      })
      toast.success('Notification preferences saved')
      refetch()
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">
          Choose how you want to receive notifications
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Enable or disable notification channels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              id="email"
              checked={prefs.email}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, email: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms">SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive text messages for urgent alerts
                </p>
              </div>
            </div>
            <Switch
              id="sms"
              checked={prefs.sms}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, sms: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive in-app push notifications
                </p>
              </div>
            </div>
            <Switch
              id="push"
              checked={prefs.push}
              onCheckedChange={(checked) => setPrefs(p => ({ ...p, push: checked }))}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### F2. Settings Tenant Page (Admin Only)

**File to create**: `src/app/(dashboard)/settings/tenant/page.tsx`

```typescript
// Similar structure - form for:
// - Organization name
// - Branding (primary color, logo upload)
// - Billing email
// - Contact info
// Requires admin role
```

### F3. Settings Categories Page

**File to create**: `src/app/(dashboard)/settings/categories/page.tsx`

```typescript
// Manage ticket categories:
// - List all categories
// - Create new category
// - Edit category (name, name_es, default assignee, preferred vendor, approval threshold, escalation hours)
// - Soft delete category
// Uses existing ticket-category DAO/service
```

---

## TASK GROUP G: Kanban Drag-Drop Backend

### G1. Update Ticket Status on Drag

**File to update**: `src/app/(dashboard)/tickets/page.tsx`

Find the drag-drop handler (likely `onDragEnd`) and add the API call:

```typescript
const handleDragEnd = async (result: DropResult) => {
  if (!result.destination) return

  const ticketId = result.draggableId
  const newStatus = result.destination.droppableId as TicketStatus

  // Optimistic update (already there)
  // ...

  // ADD: Persist to backend
  try {
    await api.patch(`/api/tickets/${ticketId}/status`, {
      status: newStatus,
    })
    // Optionally refetch or rely on realtime
  } catch (error) {
    toast.error('Failed to update ticket status')
    // Revert optimistic update
    refetch()
  }
}
```

---

## VALIDATION AFTER EACH TASK GROUP

After completing each task group (A, B, C, D, E, F, G), run:

```bash
cd "/Users/josuerodriguez/Dropbox/MHG Apps/Facilities/mhg-facilities"
npm run type-check
npm run lint
npm run build
```

Fix ALL errors before proceeding to the next task group.

---

## COMPLETION CRITERIA

All of the following must be true:

1. [ ] All create/edit pages exist and work (assets, vendors, compliance, PM)
2. [ ] Asset QR scan page works end-to-end
3. [ ] PM templates have a management UI
4. [ ] Realtime subscriptions are active on ticket list
5. [ ] Email notifications send via Resend on ticket create/assign/complete
6. [ ] PM cron actually creates tickets
7. [ ] Escalation cron promotes ticket priority
8. [ ] Compliance cron sends real emails
9. [ ] Emergency module has list/create/detail pages
10. [ ] On-call API routes work
11. [ ] PDF export works for tickets and compliance
12. [ ] Excel export works for tickets and assets
13. [ ] Settings notifications page works
14. [ ] Kanban drag-drop persists to database
15. [ ] `npm run build` passes with no errors
16. [ ] No TypeScript errors
17. [ ] No console errors in browser

---

## RALPH LOOP CONFIGURATION

### Completion Promise

When ALL completion criteria are met:

```
<promise>PHASE_7_COMPLETE</promise>
```

### Command to Run

```bash
/ralph-wiggum:ralph-loop "Execute the phase spec from .claude/ralph-loops/phase-7-finish-all-gaps.md" --completion-promise "PHASE_7_COMPLETE" --max-iterations 80
```

### Context Management

**At START of each iteration:**
```bash
cat .claude/progress.md
git log --oneline -5
```

**At END of each iteration:**
Update `.claude/progress.md` with:
- Current task group and task
- Files created/modified
- Validation results
- Next action

**Commit after each task:**
```bash
git add -A && git commit -m "feat(phase7): [description]"
```

---

## IMPORTANT NOTES

1. **Work sequentially through task groups** (A → B → C → D → E → F → G)
2. **Run validation after EACH task group** - don't accumulate errors
3. **Don't skip steps** - each builds on previous
4. **If stuck**: Document in `.claude/stuck-log.md` and output `<stuck>PHASE_7_BLOCKED: [reason]</stuck>`
5. **Test in browser** - pages should actually work, not just compile
6. **Mobile test** - check 375px width for new pages
