# MHG Facilities Management System
## Development Plan v2.0

### Overview

A custom-built, **multi-tenant** facilities management platform initially built for Market Hospitality Group, designed to handle maintenance requests, asset tracking, compliance document management, and operational workflows. Built with commercial SaaS potential in mind.

**Current Deployment:** MHG (14 restaurant locations)
**Architecture:** Multi-tenant with full data isolation per organization

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19.2, TypeScript 5.x, Supabase (Auth, Database, Storage, Realtime), Tailwind CSS 4, shadcn/ui (latest), Zod, React Hook Form, TanStack Query v5

---

## Tech Stack Details

### Core Framework
| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.x | App Router, Turbopack (default), Cache Components, proxy.ts |
| React | 19.2 | View Transitions, useEffectEvent, Activity, React Compiler |
| TypeScript | 5.x | Type safety |
| Node.js | 20.9+ | Runtime (minimum required for Next.js 16) |

### Next.js 16 Key Changes
| Feature | Description |
|---------|-------------|
| **Turbopack (default)** | No flags needed — 10x faster Fast Refresh, 2-5x faster builds |
| **Cache Components** | Explicit `"use cache"` directive replaces implicit caching |
| **proxy.ts** | Replaces middleware.ts — clearer network boundary |
| **Async params** | `params` and `searchParams` must be awaited |
| **DevTools MCP** | AI-assisted debugging with Model Context Protocol |
| **React 19.2** | View Transitions, useEffectEvent, Activity component |
| **React Compiler** | Stable, opt-in automatic memoization |

### UI & Styling
| Package | Version | Purpose |
|---------|---------|---------|
| Tailwind CSS | 4.x | Utility-first CSS (new engine, CSS-first config) |
| shadcn/ui | latest | Component library (copy-paste, fully customizable) |
| Radix UI | latest | Accessible primitives (used by shadcn) |
| Lucide React | latest | Icons |
| class-variance-authority | latest | Component variants |
| clsx + tailwind-merge | latest | Conditional classes |

### Data & State
| Package | Version | Purpose |
|---------|---------|---------|
| Supabase | latest | Auth, PostgreSQL, Storage, Realtime subscriptions |
| @supabase/ssr | latest | Server-side auth helpers for Next.js 16 |
| TanStack Query | v5 | Server state management, caching, mutations |
| Zustand | latest | Client state (minimal, for UI state only) |
| Zod | latest | Schema validation |
| React Hook Form | latest | Form handling with Zod resolver |

### File Handling & Media
| Package | Version | Purpose |
|---------|---------|---------|
| react-dropzone | latest | File uploads |
| qrcode.react | latest | QR code generation |
| html5-qrcode | latest | QR scanning (mobile camera) |
| sharp | latest | Image optimization (server-side) |

### Notifications & Communication
| Package | Version | Purpose |
|---------|---------|---------|
| Resend | latest | Transactional email |
| @react-email/components | latest | Email templates |
| Twilio | latest | SMS notifications |

### Charts & Reporting
| Package | Version | Purpose |
|---------|---------|---------|
| Recharts | latest | Dashboard charts |
| @tanstack/react-table | v8 | Data tables with sorting/filtering |
| jspdf + jspdf-autotable | latest | PDF export |
| xlsx | latest | Excel export |

### i18n (Bilingual Support)
| Package | Version | Purpose |
|---------|---------|---------|
| next-intl | latest | Internationalization for App Router |

### Development & Testing
| Package | Version | Purpose |
|---------|---------|---------|
| ESLint | latest | Linting (note: `next lint` deprecated, use eslint directly) |
| Prettier | latest | Formatting |
| Vitest | latest | Unit testing |
| Playwright | latest | E2E testing |

### Project Initialization Commands

```bash
# Create Next.js 16 project (Turbopack is now default)
npx create-next-app@latest mhg-facilities --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project
cd mhg-facilities

# Initialize shadcn/ui (auto-detects Next.js 16 + Tailwind 4)
npx shadcn@latest init

# Add commonly needed shadcn components
npx shadcn@latest add button card dialog dropdown-menu form input label select sheet table tabs textarea toast badge avatar calendar checkbox command popover separator skeleton switch tooltip

# Install additional dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query @tanstack/react-table
npm install react-hook-form @hookform/resolvers zod
npm install zustand
npm install lucide-react
npm install recharts
npm install next-intl
npm install react-dropzone
npm install qrcode.react html5-qrcode
npm install resend @react-email/components
npm install date-fns
npm install jspdf jspdf-autotable xlsx

# Dev dependencies
npm install -D vitest @vitejs/plugin-react playwright
```

---

## Multi-Tenant Architecture

### Tenant Model Overview

The system uses a **shared database, shared schema** multi-tenant model with `tenant_id` on all tenant-scoped tables. This provides:

- **Data isolation**: All queries automatically filter by tenant
- **Cost efficiency**: Single database for all tenants
- **Easy onboarding**: New tenants = new row in `tenants` table
- **Scalability path**: Can migrate high-volume tenants to dedicated DBs later

### Tenant Identification Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    TENANT RESOLUTION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Request → Subdomain Check → User's tenant_id → Query Filter    │
│                                                                  │
│  Examples:                                                       │
│  • mhg.facilities.app → tenant: mhg                             │
│  • acme.facilities.app → tenant: acme                           │
│  • facilities.app/login → Determine from user after auth        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Resolution Priority:**
1. Subdomain (e.g., `mhg.facilities.app`)
2. Custom domain (CNAME → tenant mapping)
3. User's `tenant_id` from JWT claims (after auth)

### Tenant Context Pattern

```typescript
// lib/tenant/context.ts
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getTenantContext() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''

  // Extract subdomain
  const subdomain = host.split('.')[0]

  // Check if it's a known tenant subdomain
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug, name, settings')
      .eq('slug', subdomain)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single()

    if (tenant) return tenant
  }

  // Fallback: Get from authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.user_metadata?.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug, name, settings')
      .eq('id', user.user_metadata.tenant_id)
      .single()

    return tenant
  }

  return null
}

// Type for tenant context
export type TenantContext = {
  id: string
  slug: string
  name: string
  settings: TenantSettings
}

export type TenantSettings = {
  features: {
    compliance_tracking: boolean
    preventive_maintenance: boolean
    vendor_portal: boolean
    budget_tracking: boolean
    emergency_module: boolean
  }
  branding: {
    primary_color: string
    logo_url: string | null
  }
  limits: {
    max_users: number
    max_locations: number
    storage_gb: number
  }
}
```

### Tenant-Aware Base DAO

```typescript
// dao/base.dao.ts
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import type { Database } from '@/types/database'

type TableName = keyof Database['public']['Tables']

export abstract class BaseDAO<T extends TableName> {
  constructor(protected tableName: T) {}

  // Get tenant-scoped client
  protected async getClient() {
    const supabase = await getPooledSupabaseClient()
    const tenant = await getTenantContext()

    if (!tenant) {
      throw new Error('Tenant context required')
    }

    return { supabase, tenantId: tenant.id }
  }

  // CRITICAL: All queries MUST filter by tenant_id
  async findAll() {
    const { supabase, tenantId } = await this.getClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId as any)
      .is('deleted_at', null)
    if (error) throw error
    return data
  }

  async findById(id: string) {
    const { supabase, tenantId } = await this.getClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id as any)
      .eq('tenant_id', tenantId as any)  // CRITICAL: Tenant isolation
      .is('deleted_at', null)
      .single()
    if (error) throw error
    return data
  }

  async create(data: Partial<Database['public']['Tables'][T]['Insert']>) {
    const { supabase, tenantId } = await this.getClient()
    const { data: result, error } = await supabase
      .from(this.tableName)
      .insert({ ...data, tenant_id: tenantId } as any)
      .select()
      .single()
    if (error) throw error
    return result
  }

  // CRITICAL: Soft delete only - NEVER hard delete
  async softDelete(id: string): Promise<void> {
    const { supabase, tenantId } = await this.getClient()
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id as any)
      .eq('tenant_id', tenantId as any)  // CRITICAL: Tenant isolation
    if (error) throw error
  }
}
```

### Tenant-Scoped Storage Paths

```typescript
// Storage path convention: {tenant_id}/{bucket_purpose}/{entity_id}/{filename}
// Example: mhg-uuid/ticket-photos/ticket-123/photo1.jpg

// lib/storage/paths.ts
export function getStoragePath(
  tenantId: string,
  bucket: string,
  entityId: string,
  filename: string
) {
  return `${tenantId}/${entityId}/${filename}`
}

// Storage bucket paths include tenant isolation
// Bucket: ticket-photos
// Path: {tenant_id}/{ticket_id}/{filename}
```

### Super Admin Cross-Tenant Access

```typescript
// For platform administrators who need to access all tenants
// lib/tenant/super-admin.ts

export async function getSuperAdminContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user has platform_admin role (not tenant-specific)
  if (user?.app_metadata?.platform_role === 'platform_admin') {
    return {
      isSuperAdmin: true,
      canAccessAllTenants: true
    }
  }

  return { isSuperAdmin: false, canAccessAllTenants: false }
}

// Usage in admin dashboard to list all tenants
export async function getAllTenants() {
  const { isSuperAdmin } = await getSuperAdminContext()
  if (!isSuperAdmin) throw new Error('Unauthorized')

  const supabase = await getPooledSupabaseClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('*, users(count), locations(count)')
    .is('deleted_at', null)

  if (error) throw error
  return data
}
```

### Supabase Storage Buckets

```sql
-- Create storage buckets for file uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('ticket-photos', 'ticket-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('ticket-documents', 'ticket-documents', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']),
  ('compliance-docs', 'compliance-docs', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']),
  ('asset-photos', 'asset-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('asset-manuals', 'asset-manuals', false, 104857600, array['application/pdf']),
  ('vendor-invoices', 'vendor-invoices', false, 52428800, array['application/pdf', 'image/jpeg', 'image/png']);

-- Storage RLS policies
create policy "Users can upload to ticket-photos"
  on storage.objects for insert
  with check (
    bucket_id = 'ticket-photos'
    and auth.uid() is not null
  );

create policy "Users can view ticket photos for accessible tickets"
  on storage.objects for select
  using (
    bucket_id = 'ticket-photos'
    and auth.uid() is not null
    -- Path format: ticket-photos/{ticket_id}/{filename}
    and exists (
      select 1 from tickets t
      where t.id::text = (string_to_array(name, '/'))[1]
      and (
        t.location_id = get_user_location(auth.uid())
        or t.submitted_by = auth.uid()
        or t.assigned_to = auth.uid()
        or is_admin_or_above(auth.uid())
      )
    )
  );

create policy "Users can upload compliance docs"
  on storage.objects for insert
  with check (
    bucket_id = 'compliance-docs'
    and get_user_role(auth.uid()) in ('manager', 'admin', 'super_admin')
  );

create policy "Users can view compliance docs for their location"
  on storage.objects for select
  using (
    bucket_id = 'compliance-docs'
    and auth.uid() is not null
  );

create policy "Admins can manage all storage objects"
  on storage.objects for all
  using (is_admin_or_above(auth.uid()));
```

### File Upload Validation (Server-Side)

```typescript
// lib/validations/file-upload.ts
import { z } from 'zod'

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  photo: 10 * 1024 * 1024,      // 10MB for photos
  document: 50 * 1024 * 1024,   // 50MB for documents
  manual: 100 * 1024 * 1024,    // 100MB for equipment manuals
} as const

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  document: ['application/pdf', 'image/jpeg', 'image/png'],
  manual: ['application/pdf'],
} as const

export const fileUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= FILE_SIZE_LIMITS.document,
    { message: 'File size must be less than 50MB' }
  ),
  type: z.enum(['photo', 'document', 'manual']),
})

// Validate file on server before storage upload
export function validateFileUpload(file: File, type: keyof typeof FILE_SIZE_LIMITS) {
  const maxSize = FILE_SIZE_LIMITS[type]
  const allowedTypes = ALLOWED_MIME_TYPES[type]

  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
  }

  if (!allowedTypes.includes(file.type as any)) {
    throw new Error(`File type ${file.type} not allowed. Allowed: ${allowedTypes.join(', ')}`)
  }

  // Validate file extension matches MIME type (prevent spoofing)
  const extension = file.name.split('.').pop()?.toLowerCase()
  const mimeToExt: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'image/heic': ['heic'],
    'application/pdf': ['pdf'],
  }

  const validExtensions = mimeToExt[file.type] ?? []
  if (!validExtensions.includes(extension ?? '')) {
    throw new Error('File extension does not match file type')
  }

  return true
}
```

### next.config.ts (Next.js 16)

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is now default - no flag needed
  
  // Enable Cache Components (PPR + use cache)
  cacheComponents: true,
  
  // Optional: Enable React Compiler for automatic memoization
  reactCompiler: true,
  
  // Optional: Turbopack file system caching for even faster rebuilds
  experimental: {
    turbopackFileSystemCacheForDev: true,
    turbopackFileSystemCacheForBuild: true,
  },
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
```

### Folder Structure (Next.js 16 App Router)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Authenticated layout with sidebar
│   │   ├── page.tsx                # Dashboard home
│   │   ├── tickets/
│   │   │   ├── page.tsx            # Ticket list
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # New ticket form
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Ticket detail
│   │   ├── assets/
│   │   │   ├── page.tsx
│   │   │   ├── scan/
│   │   │   │   └── page.tsx        # QR scanner (client component)
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── compliance/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── pm/
│   │   │   ├── page.tsx
│   │   │   └── calendar/
│   │   │       └── page.tsx
│   │   ├── vendors/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── emergencies/
│   │   │   └── page.tsx
│   │   ├── budgets/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── users/
│   │       │   └── page.tsx
│   │       └── locations/
│   │           └── page.tsx
│   ├── (vendor-portal)/
│   │   ├── layout.tsx              # Vendor-specific layout
│   │   └── portal/
│   │       └── page.tsx
│   ├── (platform-admin)/           # Super admin routes (cross-tenant)
│   │   ├── layout.tsx              # Platform admin layout
│   │   ├── tenants/
│   │   │   ├── page.tsx            # All tenants list
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # Create new tenant
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Tenant details/edit
│   │   ├── analytics/
│   │   │   └── page.tsx            # Platform-wide analytics
│   │   └── billing/
│   │       └── page.tsx            # Subscription management
│   ├── api/                        # API Routes (HTTP handling only)
│   │   ├── tickets/
│   │   │   ├── route.ts            # GET all, POST create
│   │   │   └── [id]/
│   │   │       └── route.ts        # GET, PATCH, DELETE by id
│   │   ├── assets/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── compliance/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── vendors/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── locations/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── webhooks/
│   │   │   ├── route.ts
│   │   │   └── stripe/
│   │   │       └── route.ts        # Stripe subscription webhooks
│   │   ├── cron/
│   │   │   ├── compliance-alerts/
│   │   │   │   └── route.ts
│   │   │   └── pm-generator/
│   │   │       └── route.ts
│   │   └── platform/               # Platform admin API (super admin only)
│   │       ├── tenants/
│   │       │   ├── route.ts        # GET all, POST create
│   │       │   └── [id]/
│   │       │       └── route.ts    # GET, PATCH tenant
│   │       └── analytics/
│   │           └── route.ts        # Platform-wide stats
│   ├── layout.tsx                  # Root layout
│   ├── not-found.tsx
│   └── error.tsx
├── proxy.ts                        # Replaces middleware.ts in Next.js 16
├── components/
│   ├── ui/                         # shadcn components (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── tickets/
│   │   ├── ticket-form.tsx
│   │   ├── ticket-list.tsx
│   │   ├── ticket-detail.tsx
│   │   ├── ticket-status-badge.tsx
│   │   └── duplicate-warning.tsx
│   ├── assets/
│   │   ├── asset-form.tsx
│   │   ├── asset-list.tsx
│   │   ├── qr-scanner.tsx
│   │   └── warranty-banner.tsx
│   ├── compliance/
│   │   ├── document-form.tsx
│   │   ├── expiration-calendar.tsx
│   │   └── status-badge.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── breadcrumbs.tsx
│   ├── dashboard/
│   │   ├── stats-cards.tsx
│   │   ├── ticket-chart.tsx
│   │   └── recent-activity.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── file-upload.tsx
│       ├── confirm-dialog.tsx
│       ├── loading-skeleton.tsx
│       └── language-toggle.tsx
├── dao/                            # Database Access Objects (DB queries ONLY)
│   ├── base.dao.ts                 # Abstract base with soft-delete support
│   ├── tickets.dao.ts
│   ├── assets.dao.ts
│   ├── compliance.dao.ts
│   ├── vendors.dao.ts
│   ├── users.dao.ts
│   ├── locations.dao.ts
│   ├── pm-schedules.dao.ts
│   └── budgets.dao.ts
├── services/                       # Business Logic Layer
│   ├── tickets.service.ts
│   ├── assets.service.ts
│   ├── compliance.service.ts
│   ├── vendors.service.ts
│   ├── users.service.ts
│   ├── locations.service.ts
│   ├── pm.service.ts
│   ├── budgets.service.ts
│   ├── notifications.service.ts
│   └── auth.service.ts
├── iao/                            # Integration Access Objects (external APIs)
│   ├── resend/
│   │   └── index.ts                # Email sending wrapper
│   ├── twilio/
│   │   └── index.ts                # SMS notifications wrapper
│   └── storage/
│       └── index.ts                # Supabase Storage wrapper
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client (cookies)
│   │   ├── server-pooled.ts        # Pooled connection for DAOs
│   │   ├── proxy.ts                # Auth helper for proxy.ts
│   │   └── types.ts                # Generated DB types
│   ├── tenant/                     # Multi-tenant context handling
│   │   ├── context.ts              # getTenantContext() - resolves tenant from subdomain/user
│   │   ├── middleware.ts           # Tenant validation for proxy.ts
│   │   ├── super-admin.ts          # Cross-tenant access for platform admins
│   │   └── types.ts                # TenantContext, TenantSettings types
│   ├── api-client.ts               # HTTP client for client components (NEVER use raw fetch)
│   ├── actions/
│   │   ├── tickets.ts              # Server Actions for tickets
│   │   ├── assets.ts
│   │   ├── compliance.ts
│   │   ├── vendors.ts
│   │   └── users.ts
│   ├── queries/
│   │   ├── tickets.ts              # TanStack Query hooks (use api-client)
│   │   ├── assets.ts
│   │   └── ...
│   ├── cache/
│   │   ├── tickets.ts              # "use cache" functions
│   │   ├── locations.ts
│   │   └── ...
│   ├── validations/
│   │   ├── ticket.ts               # Zod schemas
│   │   ├── asset.ts
│   │   └── ...
│   ├── utils/
│   │   ├── cn.ts                   # Class name helper
│   │   ├── format.ts               # Date/currency formatters
│   │   └── constants.ts
│   └── hooks/
│       ├── use-user.ts
│       ├── use-location.ts
│       └── use-realtime.ts
├── stores/
│   └── ui-store.ts                 # Zustand store for UI state
├── theme/                          # Design tokens (NEVER use hex colors directly)
│   ├── colors.ts
│   └── index.ts
├── messages/
│   ├── en.json                     # English translations
│   └── es.json                     # Spanish translations
├── emails/
│   ├── ticket-created.tsx          # React Email templates
│   ├── ticket-assigned.tsx
│   └── compliance-alert.tsx
└── types/
    ├── index.ts
    └── database.ts                 # Supabase generated types
```

### 3-Layer Architecture Pattern (MANDATORY)

**CRITICAL**: All data flow MUST follow this pattern:

```
Client Component (uses api-client, NEVER raw fetch)
  → API Route (HTTP handling ONLY, uses Service)
    → Service (business logic, constructor injects DAOs)
      → DAO (database queries ONLY, uses pooled client)
        → External API? Use IAO (Integration Access Object)
```

**API Route Example:**
```typescript
// app/api/tickets/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TicketService } from '@/services/tickets.service'
import { ticketCreateSchema } from '@/lib/validations/ticket'

const ticketService = new TicketService()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const locationId = searchParams.get('location_id') ?? undefined

  const tickets = await ticketService.getTickets({ locationId })
  return NextResponse.json(tickets)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = ticketCreateSchema.parse(body)

  const result = await ticketService.createTicket(validated)
  return NextResponse.json(result, { status: 201 })
}
```

**Service Example:**
```typescript
// services/tickets.service.ts
import { TicketDAO } from '@/dao/tickets.dao'
import { AssetDAO } from '@/dao/assets.dao'
import { NotificationService } from './notifications.service'
import type { CreateTicketInput } from '@/types'

export class TicketService {
  constructor(
    private ticketDAO = new TicketDAO(),
    private assetDAO = new AssetDAO(),
    private notificationService = new NotificationService()
  ) {}

  async createTicket(data: CreateTicketInput) {
    // Business logic: check for duplicates
    const duplicates = await this.ticketDAO.findDuplicates(
      data.location_id,
      data.asset_id,
      data.title
    )
    if (duplicates.length > 0) {
      return { duplicates, requiresConfirmation: true }
    }

    // Business logic: check warranty status
    if (data.asset_id) {
      const asset = await this.assetDAO.findById(data.asset_id)
      if (asset?.warranty_expiration && new Date(asset.warranty_expiration) > new Date()) {
        data.is_warranty_claim = true
      }
    }

    const ticket = await this.ticketDAO.create(data)

    // Side effect: send notification (async, don't await)
    this.notificationService.notifyTicketCreated(ticket)

    return ticket
  }
}
```

**DAO Example (Tenant-Aware):**
```typescript
// dao/tickets.dao.ts
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import { getTenantContext } from '@/lib/tenant/context'
import { BaseDAO } from './base.dao'
import type { Database } from '@/types/database'

type Ticket = Database['public']['Tables']['tickets']['Row']

export class TicketDAO extends BaseDAO<'tickets'> {
  constructor() {
    super('tickets')
  }

  async findDuplicates(locationId: string, assetId: string | null, title: string) {
    const { supabase, tenantId } = await this.getClient()
    const { data, error } = await supabase
      .rpc('check_duplicate_ticket', {
        p_tenant_id: tenantId,  // CRITICAL: Tenant isolation
        p_location_id: locationId,
        p_asset_id: assetId,
        p_title: title,
        p_hours_back: 48
      })
    if (error) throw error
    return data ?? []
  }

  async findByLocation(locationId: string): Promise<Ticket[]> {
    const { supabase, tenantId } = await this.getClient()
    const { data, error } = await supabase
      .from('tickets')
      .select('*, location:locations(name), asset:assets(*)')
      .eq('tenant_id', tenantId)  // CRITICAL: Tenant isolation
      .eq('location_id', locationId)
      .is('deleted_at', null)  // ALWAYS filter soft-deleted records
      .order('created_at', { ascending: false })
    if (error) throw error
    return data ?? []
  }
}
```

**Base DAO with Soft Delete:**
```typescript
// dao/base.dao.ts
import { getPooledSupabaseClient } from '@/lib/supabase/server-pooled'
import type { Database } from '@/types/database'

type TableName = keyof Database['public']['Tables']

export abstract class BaseDAO<T extends TableName> {
  constructor(protected tableName: T) {}

  // CRITICAL: Soft delete only - NEVER hard delete
  async softDelete(id: string): Promise<void> {
    const supabase = await getPooledSupabaseClient()
    const { error } = await supabase
      .from(this.tableName)
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq('id', id as any)
    if (error) throw error
  }

  async findById(id: string) {
    const supabase = await getPooledSupabaseClient()
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id as any)
      .is('deleted_at', null)
      .single()
    if (error) throw error
    return data
  }
}
```

**IAO Example (External API Wrapper):**
```typescript
// iao/resend/index.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export class ResendIAO {
  async sendEmail(params: {
    to: string | string[]
    subject: string
    html: string
    from?: string
  }) {
    const { data, error } = await resend.emails.send({
      from: params.from ?? 'MHG Facilities <facilities@mhg.com>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    })
    if (error) throw error
    return data
  }
}
```

**API Client (for Client Components):**
```typescript
// lib/api-client.ts
class ApiClient {
  private baseUrl = ''

  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.status}`)
    }
    return response.json()
  }

  async post<T>(url: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.status}`)
    }
    return response.json()
  }

  async patch<T>(url: string, body: unknown, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.status}`)
    }
    return response.json()
  }

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    })
    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API Error: ${response.status}`)
    }
    return response.json()
  }
}

const api = new ApiClient()
export default api
```

**TanStack Query with API Client:**
```typescript
// lib/queries/tickets.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api-client'
import type { Ticket, CreateTicketInput } from '@/types'

export function useTickets(locationId?: string) {
  const url = locationId
    ? `/api/tickets?location_id=${locationId}`
    : '/api/tickets'

  return useQuery({
    queryKey: ['tickets', locationId],
    queryFn: () => api.get<Ticket[]>(url),
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTicketInput) =>
      api.post<Ticket>('/api/tickets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
```

### Key Next.js 16 / React 19.2 Patterns

**Async Params (Required in Next.js 16)**
```tsx
// app/(dashboard)/tickets/[id]/page.tsx
// params and searchParams are now async - must await them

interface TicketPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function TicketPage({ params, searchParams }: TicketPageProps) {
  // Must await params in Next.js 16
  const { id } = await params
  const { tab } = await searchParams
  
  const supabase = await createClient()
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*, location:locations(name), asset:assets(*)')
    .eq('id', id)
    .single()

  return <TicketDetail ticket={ticket} activeTab={tab} />
}
```

**Cache Components with "use cache" Directive**
```tsx
// lib/cache/locations.ts
// Explicit caching replaces implicit caching in Next.js 16

import { unstable_cacheLife as cacheLife } from 'next/cache'

export async function getLocations() {
  'use cache'
  cacheLife('hours') // Cache for 1 hour
  
  const supabase = await createClient()
  const { data } = await supabase
    .from('locations')
    .select('*')
    .eq('status', 'active')
    .order('name')
  
  return data ?? []
}

// Usage in Server Component - data is cached
export default async function LocationSelector() {
  const locations = await getLocations() // Cached!
  return <Select options={locations} />
}
```

**proxy.ts (Replaces middleware.ts)**
```tsx
// src/proxy.ts
// Next.js 16 renames middleware.ts to proxy.ts for clarity

import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request: NextRequest) {
  // Auth session refresh
  const response = await updateSession(request)
  
  const { pathname } = request.nextUrl
  
  // Protected routes
  const protectedPaths = ['/tickets', '/assets', '/compliance', '/settings']
  const isProtected = protectedPaths.some(path => pathname.startsWith(path))
  
  if (isProtected) {
    const supabase = createServerClient(request)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Server Actions (Same as before)**
```tsx
// lib/actions/tickets.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ticketSchema } from '@/lib/validations/ticket'

export async function createTicket(formData: FormData) {
  const supabase = await createClient()
  
  const validated = ticketSchema.parse({
    title: formData.get('title'),
    description: formData.get('description'),
    location_id: formData.get('location_id'),
    category_id: formData.get('category_id'),
    priority: formData.get('priority'),
  })

  const { data, error } = await supabase
    .from('tickets')
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Invalidate cached ticket lists
  revalidateTag('tickets')
  revalidatePath('/tickets')
  
  return data
}
```

**React 19.2 View Transitions**
```tsx
// components/tickets/ticket-list.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function TicketRow({ ticket }: { ticket: Ticket }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const handleClick = () => {
    // View Transitions animate the navigation
    startTransition(() => {
      router.push(`/tickets/${ticket.id}`)
    })
  }

  return (
    <tr 
      onClick={handleClick}
      style={{ viewTransitionName: `ticket-${ticket.id}` }}
      className={isPending ? 'opacity-50' : ''}
    >
      <td>{ticket.ticket_number}</td>
      <td>{ticket.title}</td>
      <td>{ticket.status}</td>
    </tr>
  )
}
```

**useFormStatus + useOptimistic (React 19)**
```tsx
// components/tickets/ticket-form.tsx
'use client'

import { useFormStatus } from 'react-dom'
import { useOptimistic, useActionState } from 'react'
import { createTicket } from '@/lib/actions/tickets'
import { Button } from '@/components/ui/button'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit Ticket'}
    </Button>
  )
}

export function TicketForm() {
  const [state, formAction] = useActionState(createTicket, null)
  
  return (
    <form action={formAction}>
      {/* form fields */}
      <SubmitButton />
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

**TanStack Query for Client-Side Data**
```tsx
// lib/queries/tickets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useTickets(locationId?: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['tickets', locationId],
    queryFn: async () => {
      let query = supabase.from('tickets').select('*')
      if (locationId) query = query.eq('location_id', locationId)
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}
```

**Supabase Realtime Hook**
```tsx
// lib/hooks/use-realtime.ts
'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useTicketRealtime() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tickets'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, supabase])
}
```

---

## Core Modules

### 1. Work Orders & Tickets

**Submission & Tracking**
- Submit maintenance requests with photos, priority level, and category
- Bilingual support (English/Spanish) for submission forms
- Offline-capable submission with queue sync when back online
- QR code scanning to pre-fill asset and location
- Duplicate detection warning based on title/location/asset match within 48 hours

**Assignment & Routing**
- Auto-assign based on issue type, location, or on-call schedule
- Delegation rules when assigned user is unavailable
- Escalation paths configurable per category
- Re-assignment workflow with reason tracking
- Orphaned ticket detection (assigned to inactive users)

**Status Workflow**
```
Submitted → Acknowledged → [Needs Approval] → In Progress → Completed → Verified → Closed
                                    ↓
                               Rejected (back to Submitted with notes)
```

**Escalation Rules**
- Auto-escalate if not acknowledged within configurable timeframe (default 4 hours)
- Critical tickets immediately notify on-call + admin via SMS
- After-hours routing to on-call rotation
- Stale ticket alerts (no update in X days)

**Ticket Relationships**
- Parent/child tickets for complex issues (HVAC broken → diagnose, order parts, install, verify)
- Link related tickets across locations (bad batch of equipment, vendor issues)
- Merge duplicate tickets with audit trail
- Multi-location incident tracking

**Completion & Verification**
- Completion photos/documentation required before closing
- Manager verification step with approve/reject
- Rejection requires notes and reopens ticket
- Dispute resolution workflow

### 2. Asset Management

**Asset Registry**
- Equipment database: HVAC, refrigeration, kitchen equipment, POS hardware, furniture, vehicles
- Track per asset: serial number, model, manufacturer, purchase date, purchase price, warranty expiration, vendor, location
- QR code generation for physical asset tagging
- QR scanner for mobile (scan to view details or submit ticket)
- Bulk import/export via CSV
- Asset photos and manual/spec document attachments

**Warranty & Lifecycle**
- Warranty expiration tracking with alerts at 90/60/30 days
- **Warranty flag on tickets** — Banner displayed when creating ticket for asset under warranty
- Depreciation tracking (straight-line or custom)
- Expected lifespan tracking with replacement forecasting
- Status tracking: Active, Under Maintenance, Retired, Transferred, Disposed

**Asset Transfers**
- Transfer equipment between locations with full audit trail
- Transfer history preserved on asset record
- Bulk transfer support for location closures/openings

**Maintenance History**
- Complete service history per asset
- Link all tickets, PM completions, and repairs
- Cost accumulation per asset (total cost of ownership)
- "Lemon" detection — flag assets exceeding repair cost thresholds

### 3. Licenses, Permits & Compliance

**Document Management**
- Document storage with expiration date tracking
- Categories: Health permits, liquor licenses, fire safety, elevator certs, music licenses (ASCAP/BMI), business licenses, food handler certs, ADA compliance
- Multi-location permits supported (single permit covering multiple locations)
- Document versioning (keep historical copies)

**Status Tracking**
- Statuses: Active, Expiring Soon, Expired, Pending Renewal, Conditional/Provisional, Failed Inspection, Suspended
- Conditional permit tracking with required remediation tasks
- Failed inspection workflow with corrective action checklist
- Renewal application tracking (submitted, in review, approved)

**Alerts & Notifications**
- Automated alerts at 90/60/30/14/7 days before expiration
- Escalating alert urgency as deadline approaches
- Expired permit immediate notification to admin + location manager
- Custom alert schedules per document type

**Audit Support**
- Fast export of compliance history with proof documentation
- Inspector-ready reports (all hood cleaning records, fire extinguisher inspections, etc.)
- Audit trail for all document changes
- Batch export for insurance or legal requests

### 4. Vendor Management

**Vendor Directory**
- Contact info, service categories, contract terms
- Link vendors to assets and work orders
- Preferred vendor designation per category/location
- Emergency contact and after-hours availability

**Contract & Insurance Tracking**
- Contract expiration alerts (90/60/30 days)
- Insurance certificate expiration alerts
- Required insurance minimums tracking
- Auto-generated renewal reminders

**Vendor Scorecards**
- Response time tracking (time to acknowledge, time to complete)
- Completion rate and quality scores
- Cost trends over time
- Manager ratings on completed work
- Comparison reports across vendors in same category

**Vendor Portal**
- Limited access for vendors to view/update assigned tickets
- Scoped visibility (vendor only sees their tickets)
- Direct communication thread
- Invoice/quote submission

### 5. Preventive Maintenance

**Scheduling**
- Recurring maintenance schedules (daily, weekly, monthly, quarterly, annually)
- Asset-specific or location-wide schedules
- Checklist templates per maintenance type
- Auto-generate work orders based on schedule

**Tracking & Compliance**
- Calendar view across all locations
- Completion rate tracking
- Overdue PM alerts with escalation
- Vendor no-show detection and auto-reassignment option

**Common PM Types**
- Hood/exhaust cleaning
- Grease trap service
- HVAC filter replacement
- Fire suppression inspection
- Refrigeration coil cleaning
- Pest control
- Fire extinguisher inspection
- Backflow testing
- Elevator inspection

### 6. Emergency Management

**On-Call System**
- On-call rotation schedule per location or region
- Primary and backup on-call designation
- Automatic routing of after-hours critical tickets
- On-call handoff notifications

**Emergency Response**
- Emergency shutdown tracking (health dept closure, fire, flood, etc.)
- Rapid-response mode with required remediation checklist
- Cascading failure alerts (HVAC down → refrigeration at risk → food safety)
- Emergency contact quick-dial integration
- Incident documentation package for insurance claims

**Severity Classification**
| Level | Definition | Response Time | Notification |
|-------|------------|---------------|--------------|
| Critical | Safety hazard, health violation, business interruption | 1 hour | SMS + Call to on-call |
| High | Major equipment down, significant impact | 4 hours | Email + SMS to manager |
| Medium | Degraded operation, workaround available | 24 hours | Email to manager |
| Low | Minor issue, cosmetic, can wait | 1 week | App notification |

### 7. Financial & Budget Management

**Budget Tracking**
- Annual maintenance budget per location
- Category-level budgets (HVAC, plumbing, equipment, etc.)
- Real-time spend tracking against budget
- Budget variance alerts (80%, 90%, 100% thresholds)
- Year-over-year comparison

**Cost Approval Workflow**
- Configurable approval thresholds per role
- Default: Manager approves up to $1,000, Admin approves up to $5,000, Owner above $5,000
- Estimate submission with vendor quote attachment
- Approval/denial with required notes
- Approved estimates auto-update ticket

**Invoice & Receipt Management**
- Attach invoices to completed work orders
- Invoice approval workflow
- Receipt photo capture for small purchases
- Chargeback/refund tracking for subpar work

**Cost Reporting**
- Cost per location trending
- Cost per asset (total cost of ownership)
- Vendor cost comparison
- Forecast next year's budget based on historical data
- Unexpected vs. planned maintenance spend ratio

### 8. Reporting & Analytics

**Dashboards**
- Role-based dashboard views
- Real-time ticket status across all locations
- Compliance status overview (green/yellow/red)
- Budget health indicators
- PM completion rates

**Operational Reports**
- Open tickets by location, category, age
- Average time to resolution by category
- Ticket volume trends (daily, weekly, monthly)
- Repeat issues detection (same asset, same problem)
- Location comparison scorecards

**Vendor Reports**
- Response time by vendor
- Cost per vendor over time
- Quality ratings
- SLA compliance

**Financial Reports**
- Spend by location, category, vendor
- Budget vs. actual
- Cost per square foot benchmarking
- Warranty savings tracking (repairs avoided due to warranty)

**Compliance Reports**
- Expiring documents next 30/60/90 days
- Compliance completion rates
- Audit-ready documentation packages
- Historical compliance timeline

**Export Options**
- CSV export for all reports
- PDF generation for formal reports
- Scheduled report delivery via email
- Custom date range filtering

---

## Database Schema (Supabase/PostgreSQL)

```sql
-- =====================
-- ENUM TYPES (Type Safety)
-- =====================

create type user_role as enum ('super_admin', 'admin', 'manager', 'staff', 'vendor', 'readonly');
create type tenant_plan as enum ('free', 'starter', 'professional', 'enterprise');
create type tenant_status as enum ('active', 'suspended', 'cancelled', 'trial');
create type location_status as enum ('active', 'temporarily_closed', 'permanently_closed');
create type asset_status as enum ('active', 'under_maintenance', 'retired', 'transferred', 'disposed');
create type ticket_status as enum ('submitted', 'acknowledged', 'needs_approval', 'approved', 'in_progress', 'completed', 'verified', 'closed', 'rejected', 'on_hold');
create type ticket_priority as enum ('low', 'medium', 'high', 'critical');
create type compliance_status as enum ('active', 'expiring_soon', 'expired', 'pending_renewal', 'conditional', 'failed_inspection', 'suspended');
create type approval_status as enum ('pending', 'approved', 'denied');
create type invoice_status as enum ('pending', 'approved', 'paid', 'disputed');
create type incident_status as enum ('active', 'contained', 'resolved');
create type incident_severity as enum ('high', 'critical');
create type pm_frequency as enum ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'semi_annually', 'annually');
create type notification_channel as enum ('email', 'sms', 'push', 'slack');

-- =====================
-- TENANT TABLE (Multi-Tenant Foundation)
-- =====================

-- Tenants (organizations using the platform)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,  -- Used for subdomain: {slug}.facilities.app

  -- Subscription & billing
  plan tenant_plan default 'trial',
  status tenant_status default 'trial',
  trial_ends_at timestamptz default now() + interval '14 days',
  stripe_customer_id text unique,
  stripe_subscription_id text,

  -- Limits (enforced at application layer)
  max_users int default 5,
  max_locations int default 3,
  storage_limit_gb int default 5,

  -- Feature flags (override plan defaults)
  features jsonb default '{
    "compliance_tracking": true,
    "preventive_maintenance": true,
    "vendor_portal": false,
    "budget_tracking": false,
    "emergency_module": false,
    "api_access": false,
    "sso": false,
    "custom_domain": false
  }'::jsonb,

  -- Branding (white-label support)
  branding jsonb default '{
    "primary_color": "#3B82F6",
    "secondary_color": "#1E40AF",
    "logo_url": null,
    "favicon_url": null
  }'::jsonb,

  -- Custom domain support
  custom_domain text unique,
  domain_verified_at timestamptz,

  -- Contact info
  owner_email text not null,
  billing_email text,
  phone text,
  address text,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Tenant invitations (for onboarding new team members)
create table tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,
  email text not null,
  role user_role not null,
  invited_by uuid,  -- FK added after users table
  token text unique default encode(gen_random_bytes(32), 'hex'),
  expires_at timestamptz default now() + interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz default now(),
  deleted_at timestamptz
);

-- =====================
-- CORE TABLES
-- =====================

-- Locations (created first without manager_id FK to break circular dependency)
create table locations (
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  square_footage int,
  manager_id uuid,  -- FK added after users table
  emergency_contact_phone text,
  status location_status default 'active',
  opened_date date,
  closed_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  email text not null,
  full_name text not null,
  role user_role not null,
  phone text,
  location_id uuid references locations(id),
  language_preference text default 'en' check (language_preference in ('en', 'es')),
  is_active boolean default true,
  deactivated_at timestamptz,
  notification_preferences jsonb default '{"email": true, "sms": false, "push": true}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,  -- CRITICAL: Soft delete support

  -- Email unique per tenant, not globally
  unique(tenant_id, email)
);

-- Add manager_id FK after users table exists
alter table locations add constraint fk_locations_manager foreign key (manager_id) references users(id);

-- Add invited_by FK to tenant_invitations after users table exists
alter table tenant_invitations add constraint fk_invitations_invited_by foreign key (invited_by) references users(id);

-- =====================
-- ASSET MANAGEMENT
-- =====================

-- Asset Categories
create table asset_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  description text,
  default_lifespan_years int,
  parent_category_id uuid references asset_categories(id),
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Assets
create table assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  category_id uuid references asset_categories(id),
  location_id uuid references locations(id),
  serial_number text,
  model text,
  manufacturer text,
  purchase_date date,
  purchase_price decimal(10,2),
  warranty_expiration date,
  expected_lifespan_years int,
  vendor_id uuid references vendors(id),
  status asset_status default 'active',
  qr_code text,
  manual_url text,
  spec_sheet_path text,
  photo_path text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,  -- CRITICAL: Soft delete support

  -- QR code unique per tenant, not globally
  unique(tenant_id, qr_code)
);

-- Asset Transfers (audit trail - no soft delete needed)
create table asset_transfers (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),  -- No CASCADE - preserve history
  from_location_id uuid references locations(id),
  to_location_id uuid references locations(id),
  transferred_by uuid references users(id),
  transferred_at timestamptz default now(),
  reason text,
  notes text
);

-- Asset Maintenance History (audit trail - no soft delete needed)
create table asset_history (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id),  -- No CASCADE - preserve history
  ticket_id uuid references tickets(id),
  maintenance_type text check (maintenance_type in ('repair', 'preventive', 'inspection', 'replacement', 'warranty_claim')),
  description text,
  cost decimal(10,2),
  performed_by text,
  vendor_id uuid references vendors(id),
  performed_at timestamptz default now()
);

-- =====================
-- VENDORS
-- =====================

-- Vendors
create table vendors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  contact_name text,
  email text,
  phone text,
  emergency_phone text,
  address text,
  service_categories text[],
  is_preferred boolean default false,
  contract_start_date date,
  contract_expiration date,
  insurance_expiration date,
  insurance_minimum_required decimal(10,2),
  hourly_rate decimal(8,2),
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Vendor Ratings (audit trail - no soft delete needed)
create table vendor_ratings (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references vendors(id),  -- No CASCADE - preserve ratings
  ticket_id uuid references tickets(id),
  rated_by uuid references users(id),
  rating int check (rating between 1 and 5),
  response_time_rating int check (response_time_rating between 1 and 5),
  quality_rating int check (quality_rating between 1 and 5),
  cost_rating int check (cost_rating between 1 and 5),
  comments text,
  created_at timestamptz default now()
);

-- =====================
-- TICKETS / WORK ORDERS
-- =====================

-- Ticket Categories
create table ticket_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  name_es text, -- Spanish translation
  description text,
  default_priority ticket_priority default 'medium',
  default_assignee_id uuid references users(id),
  preferred_vendor_id uuid references vendors(id),
  approval_threshold decimal(10,2), -- cost above this requires approval
  escalation_hours int default 4,
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  ticket_number int not null,  -- Auto-increment per tenant (see trigger below)
  title text not null,
  description text,
  category_id uuid references ticket_categories(id),
  location_id uuid references locations(id),
  asset_id uuid references assets(id),
  priority ticket_priority default 'medium',
  status ticket_status default 'submitted',

  -- Assignment
  submitted_by uuid references users(id),
  assigned_to uuid references users(id),
  vendor_id uuid references vendors(id),

  -- Relationships
  parent_ticket_id uuid references tickets(id),
  related_ticket_ids uuid[],
  merged_into_ticket_id uuid references tickets(id),
  is_duplicate boolean default false,

  -- Financials
  estimated_cost decimal(10,2),
  approved_cost decimal(10,2),
  actual_cost decimal(10,2),
  is_warranty_claim boolean default false,

  -- Timestamps
  due_date timestamptz,
  acknowledged_at timestamptz,
  approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  verified_at timestamptz,
  closed_at timestamptz,

  -- Flags
  is_emergency boolean default false,
  requires_approval boolean default false,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,  -- CRITICAL: Soft delete support

  -- Ticket number unique per tenant
  unique(tenant_id, ticket_number)
);

-- Ticket Status History (audit trail - no soft delete needed)
create table ticket_status_history (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),  -- No CASCADE - preserve history
  from_status ticket_status,
  to_status ticket_status not null,
  changed_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- Ticket Comments
create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),  -- No CASCADE - preserve comments
  user_id uuid references users(id),
  comment text not null,
  is_internal boolean default false, -- internal notes not visible to vendors/submitters
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Ticket Attachments
create table ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),  -- No CASCADE - preserve attachments
  file_path text not null,
  file_name text not null,
  file_type text,
  file_size_bytes int check (file_size_bytes <= 52428800),  -- Max 50MB
  uploaded_by uuid references users(id),
  attachment_type text check (attachment_type in ('initial', 'progress', 'completion', 'invoice', 'quote')),
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Cost Approvals (audit trail - no soft delete needed)
create table cost_approvals (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),  -- No CASCADE - preserve approvals
  estimated_cost decimal(10,2) not null,
  vendor_quote_path text,
  requested_by uuid references users(id),
  requested_at timestamptz default now(),
  reviewed_by uuid references users(id),
  reviewed_at timestamptz,
  status approval_status default 'pending',
  denial_reason text,
  notes text
);

-- =====================
-- COMPLIANCE
-- =====================

-- Compliance Document Types
create table compliance_document_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  name_es text,
  description text,
  default_alert_days int[] default '{90, 60, 30, 14, 7}',
  renewal_checklist jsonb,
  is_location_specific boolean default true, -- false for multi-location permits
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Compliance Documents
create table compliance_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  document_type_id uuid references compliance_document_types(id),
  location_id uuid references locations(id), -- null for multi-location permits
  location_ids uuid[], -- for multi-location permits
  issue_date date,
  expiration_date date,
  issuing_authority text,
  document_number text,
  file_path text,
  status compliance_status default 'active',

  -- Conditional/Provisional tracking
  is_conditional boolean default false,
  conditional_requirements text,
  conditional_deadline date,

  -- Renewal tracking
  renewal_submitted_date date,
  renewal_cost decimal(10,2),
  renewal_assigned_to uuid references users(id),

  -- Failed inspection tracking
  failed_inspection_date date,
  corrective_action_required text,
  reinspection_date date,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Compliance Document Versions (audit trail - no soft delete needed)
create table compliance_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references compliance_documents(id),  -- No CASCADE - preserve history
  file_path text not null,
  version_number int not null,
  uploaded_by uuid references users(id),
  notes text,
  created_at timestamptz default now()
);

-- Compliance Alerts Log (audit trail - no soft delete needed)
create table compliance_alerts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references compliance_documents(id),  -- No CASCADE - preserve history
  alert_type text check (alert_type in ('90_day', '60_day', '30_day', '14_day', '7_day', 'expired', 'failed_inspection')),
  sent_at timestamptz default now(),
  sent_to text[],
  delivery_method text check (delivery_method in ('email', 'sms', 'both'))
);

-- =====================
-- PREVENTIVE MAINTENANCE
-- =====================

-- PM Templates
create table pm_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  description text,
  category text, -- hood_cleaning, grease_trap, hvac, fire_safety, pest_control, etc.
  checklist jsonb, -- array of checklist items
  estimated_duration_hours decimal(4,2),
  default_vendor_id uuid references vendors(id),
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- PM Schedules
create table pm_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  template_id uuid references pm_templates(id),
  name text not null,
  description text,
  asset_id uuid references assets(id),
  location_id uuid references locations(id),
  frequency_type pm_frequency not null,
  frequency_value int default 1,
  day_of_week int check (day_of_week between 0 and 6), -- 0-6 for weekly
  day_of_month int check (day_of_month between 1 and 31), -- 1-31 for monthly
  month_of_year int check (month_of_year between 1 and 12), -- 1-12 for annually
  last_completed_date date,
  next_due_date date,
  assigned_to uuid references users(id),
  vendor_id uuid references vendors(id),
  estimated_cost decimal(10,2),
  is_active boolean default true,
  auto_create_ticket boolean default true,
  advance_ticket_days int default 7, -- create ticket X days before due
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- PM Completions (audit trail - no soft delete needed)
create table pm_completions (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid references pm_schedules(id),  -- No CASCADE - preserve history
  ticket_id uuid references tickets(id),
  completed_by uuid references users(id),
  vendor_id uuid references vendors(id),
  completed_at timestamptz default now(),
  checklist_results jsonb,
  notes text,
  cost decimal(10,2),
  attachments text[]
);

-- =====================
-- ON-CALL & EMERGENCY
-- =====================

-- On-Call Schedules
create table on_call_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  user_id uuid references users(id),
  location_id uuid references locations(id), -- null for all locations
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  is_backup boolean default false,
  notes text,
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Emergency Incidents
create table emergency_incidents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  location_id uuid references locations(id),
  incident_type text not null check (incident_type in ('health_closure', 'fire', 'flood', 'equipment_failure', 'power_outage', 'gas_leak', 'other')),
  title text not null,
  description text,
  severity incident_severity default 'high',
  status incident_status default 'active',

  -- Timestamps
  reported_at timestamptz default now(),
  contained_at timestamptz,
  resolved_at timestamptz,

  -- Tracking
  reported_by uuid references users(id),
  incident_commander uuid references users(id),

  -- Documentation
  insurance_claim_number text,
  estimated_damages decimal(12,2),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Emergency Incident Tasks
create table emergency_incident_tasks (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references emergency_incidents(id),  -- No CASCADE - preserve history
  task_description text not null,
  assigned_to uuid references users(id),
  due_date timestamptz,
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- =====================
-- BUDGETS & FINANCIALS
-- =====================

-- Location Budgets
create table location_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  location_id uuid references locations(id),
  fiscal_year int not null,
  category text, -- total, hvac, plumbing, electrical, equipment, compliance, other
  budget_amount decimal(12,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,  -- CRITICAL: Soft delete support
  unique(tenant_id, location_id, fiscal_year, category)
);

-- Budget Alerts (audit trail - no soft delete needed)
create table budget_alerts (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references location_budgets(id),  -- No CASCADE - preserve history
  threshold_percent int check (threshold_percent in (80, 90, 100, 110)),
  triggered_at timestamptz default now(),
  notified_users uuid[]
);

-- Invoices
create table invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  ticket_id uuid references tickets(id),
  vendor_id uuid references vendors(id),
  invoice_number text,
  invoice_date date,
  amount decimal(10,2) not null,
  file_path text,
  status invoice_status default 'pending',
  approved_by uuid references users(id),
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Chargebacks/Refunds (audit trail - no soft delete needed)
create table chargebacks (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),
  vendor_id uuid references vendors(id),
  original_amount decimal(10,2),
  refund_amount decimal(10,2),
  reason text,
  status text default 'requested' check (status in ('requested', 'approved', 'received', 'denied')),
  requested_at timestamptz default now(),
  resolved_at timestamptz,
  notes text
);

-- =====================
-- NOTIFICATIONS
-- =====================

-- Notification Templates
create table notification_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) not null,  -- CRITICAL: Tenant isolation
  name text not null,
  event_type text not null, -- ticket_created, ticket_assigned, ticket_escalated, compliance_expiring, etc.
  subject_en text,
  subject_es text,
  body_en text,
  body_es text,
  channels notification_channel[] default '{email}',
  is_active boolean default true,
  created_at timestamptz default now(),
  deleted_at timestamptz  -- CRITICAL: Soft delete support
);

-- Notification Log (audit trail - no soft delete needed)
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references notification_templates(id),
  recipient_id uuid references users(id),
  recipient_email text,
  recipient_phone text,
  channel notification_channel,
  subject text,
  body text,
  status text default 'sent' check (status in ('sent', 'delivered', 'failed', 'bounced')),
  related_ticket_id uuid references tickets(id),
  related_document_id uuid references compliance_documents(id),
  sent_at timestamptz default now(),
  error_message text
);

-- =====================
-- SYSTEM & AUDIT
-- =====================

-- Audit Log
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null, -- create, update, delete, login, export, etc.
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- System Settings
create table system_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  description text,
  updated_by uuid references users(id),
  updated_at timestamptz default now()
);

-- Offline Queue (for sync) - transient data, no soft delete needed
create table offline_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action_type text not null check (action_type in ('create_ticket', 'add_comment', 'upload_photo', 'update_status')),
  payload jsonb not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  retry_count int default 0,
  max_retries int default 3,
  created_at timestamptz default now(),
  processed_at timestamptz,
  error_message text
);

-- =====================
-- INDEXES
-- =====================

-- CRITICAL: Tenant isolation indexes (ALL queries filter by tenant_id)
create index idx_tenants_slug on tenants(slug) where deleted_at is null;
create index idx_tenants_custom_domain on tenants(custom_domain) where custom_domain is not null and deleted_at is null;
create index idx_users_tenant on users(tenant_id) where deleted_at is null;
create index idx_locations_tenant on locations(tenant_id) where deleted_at is null;
create index idx_tickets_tenant on tickets(tenant_id) where deleted_at is null;
create index idx_assets_tenant on assets(tenant_id) where deleted_at is null;
create index idx_vendors_tenant on vendors(tenant_id) where deleted_at is null;
create index idx_compliance_tenant on compliance_documents(tenant_id) where deleted_at is null;

-- Original indexes (now include tenant_id for performance)
create index idx_tickets_tenant_location on tickets(tenant_id, location_id) where deleted_at is null;
create index idx_tickets_tenant_status on tickets(tenant_id, status) where deleted_at is null;
create index idx_tickets_tenant_assigned on tickets(tenant_id, assigned_to) where deleted_at is null;
create index idx_tickets_priority on tickets(priority);
create index idx_tickets_created on tickets(created_at desc);
create index idx_tickets_parent on tickets(parent_ticket_id);

create index idx_assets_tenant_location on assets(tenant_id, location_id) where deleted_at is null;
create index idx_assets_category on assets(category_id);
create index idx_assets_warranty on assets(warranty_expiration);
create index idx_assets_tenant_qr on assets(tenant_id, qr_code) where deleted_at is null;

create index idx_compliance_tenant_expiration on compliance_documents(tenant_id, expiration_date) where deleted_at is null;
create index idx_compliance_status on compliance_documents(status);
create index idx_compliance_location on compliance_documents(location_id);

create index idx_pm_next_due on pm_schedules(next_due_date);
create index idx_pm_tenant_location on pm_schedules(tenant_id, location_id) where deleted_at is null;

create index idx_on_call_datetime on on_call_schedules(start_datetime, end_datetime);
create index idx_on_call_user on on_call_schedules(user_id);

create index idx_audit_user on audit_log(user_id);
create index idx_audit_table on audit_log(table_name, record_id);
create index idx_audit_created on audit_log(created_at desc);

create index idx_budgets_tenant_location_year on location_budgets(tenant_id, location_id, fiscal_year) where deleted_at is null;

-- Soft delete indexes (for filtering active records)
create index idx_users_deleted on users(deleted_at) where deleted_at is null;
create index idx_locations_deleted on locations(deleted_at) where deleted_at is null;
create index idx_tickets_deleted on tickets(deleted_at) where deleted_at is null;
create index idx_assets_deleted on assets(deleted_at) where deleted_at is null;
create index idx_vendors_deleted on vendors(deleted_at) where deleted_at is null;
create index idx_compliance_deleted on compliance_documents(deleted_at) where deleted_at is null;

-- =====================
-- VIEWS
-- =====================

-- Active tickets summary
create view v_active_tickets as
select
  t.*,
  l.name as location_name,
  tc.name as category_name,
  u_submitted.full_name as submitted_by_name,
  u_assigned.full_name as assigned_to_name,
  v.name as vendor_name,
  a.name as asset_name,
  a.warranty_expiration as asset_warranty_expiration,
  case when a.warranty_expiration > current_date then true else false end as is_under_warranty
from tickets t
left join locations l on t.location_id = l.id and l.deleted_at is null
left join ticket_categories tc on t.category_id = tc.id and tc.deleted_at is null
left join users u_submitted on t.submitted_by = u_submitted.id and u_submitted.deleted_at is null
left join users u_assigned on t.assigned_to = u_assigned.id and u_assigned.deleted_at is null
left join vendors v on t.vendor_id = v.id and v.deleted_at is null
left join assets a on t.asset_id = a.id and a.deleted_at is null
where t.status not in ('closed', 'verified')
  and t.deleted_at is null;  -- CRITICAL: Filter soft-deleted

-- Expiring compliance documents
create view v_expiring_compliance as
select
  cd.*,
  cdt.name as document_type_name,
  l.name as location_name,
  cd.expiration_date - current_date as days_until_expiration
from compliance_documents cd
left join compliance_document_types cdt on cd.document_type_id = cdt.id and cdt.deleted_at is null
left join locations l on cd.location_id = l.id and l.deleted_at is null
where cd.expiration_date between current_date and current_date + interval '90 days'
  and cd.status not in ('expired', 'suspended')
  and cd.deleted_at is null  -- CRITICAL: Filter soft-deleted
order by cd.expiration_date;

-- Budget utilization
create view v_budget_utilization as
select
  lb.*,
  l.name as location_name,
  coalesce(sum(t.actual_cost), 0) as spent_amount,
  lb.budget_amount - coalesce(sum(t.actual_cost), 0) as remaining_amount,
  round((coalesce(sum(t.actual_cost), 0) / nullif(lb.budget_amount, 0) * 100)::numeric, 2) as utilization_percent
from location_budgets lb
join locations l on lb.location_id = l.id and l.deleted_at is null
left join tickets t on t.location_id = lb.location_id
  and extract(year from t.completed_at) = lb.fiscal_year
  and t.status in ('completed', 'verified', 'closed')
  and t.deleted_at is null  -- CRITICAL: Filter soft-deleted
where lb.deleted_at is null  -- CRITICAL: Filter soft-deleted
group by lb.id, l.name;

-- Vendor scorecard
create view v_vendor_scorecard as
select
  v.id,
  v.name,
  count(t.id) as total_tickets,
  count(case when t.status in ('completed', 'verified', 'closed') then 1 end) as completed_tickets,
  round(avg(extract(epoch from (t.acknowledged_at - t.created_at))/3600)::numeric, 2) as avg_response_hours,
  round(avg(extract(epoch from (t.completed_at - t.created_at))/3600)::numeric, 2) as avg_completion_hours,
  round(avg(vr.rating)::numeric, 2) as avg_rating,
  sum(t.actual_cost) as total_billed
from vendors v
left join tickets t on t.vendor_id = v.id and t.deleted_at is null
left join vendor_ratings vr on vr.vendor_id = v.id
where v.deleted_at is null  -- CRITICAL: Filter soft-deleted
group by v.id, v.name;

-- =====================
-- FUNCTIONS
-- =====================

-- Function to auto-increment ticket_number per tenant
create or replace function set_tenant_ticket_number() returns trigger as $$
declare
  next_number int;
begin
  -- Get the next ticket number for this tenant
  select coalesce(max(ticket_number), 0) + 1 into next_number
  from tickets
  where tenant_id = new.tenant_id;

  new.ticket_number := next_number;
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-set ticket_number before insert
create trigger trg_set_ticket_number
  before insert on tickets
  for each row
  execute function set_tenant_ticket_number();

-- Function to check for duplicate tickets (tenant-scoped)
create or replace function check_duplicate_ticket(
  p_tenant_id uuid,
  p_location_id uuid,
  p_asset_id uuid,
  p_title text,
  p_hours_back int default 48
) returns table(ticket_id uuid, ticket_number int, title text, created_at timestamptz) as $$
begin
  return query
  select t.id, t.ticket_number, t.title, t.created_at
  from tickets t
  where t.tenant_id = p_tenant_id  -- CRITICAL: Tenant isolation
    and t.location_id = p_location_id
    and t.created_at > now() - (p_hours_back || ' hours')::interval
    and t.status not in ('closed', 'verified')
    and t.deleted_at is null  -- CRITICAL: Filter soft-deleted
    and (
      t.asset_id = p_asset_id
      or t.title ilike '%' || p_title || '%'
      or p_title ilike '%' || t.title || '%'
    );
end;
$$ language plpgsql;

-- Function to get current on-call user (tenant-scoped)
create or replace function get_on_call_user(
  p_tenant_id uuid,
  p_location_id uuid default null
) returns table(user_id uuid, full_name text, phone text, is_backup boolean) as $$
begin
  return query
  select oc.user_id, u.full_name, u.phone, oc.is_backup
  from on_call_schedules oc
  join users u on oc.user_id = u.id and u.deleted_at is null
  where oc.tenant_id = p_tenant_id  -- CRITICAL: Tenant isolation
    and now() between oc.start_datetime and oc.end_datetime
    and oc.deleted_at is null  -- CRITICAL: Filter soft-deleted
    and (p_location_id is null or oc.location_id is null or oc.location_id = p_location_id)
  order by oc.is_backup, oc.start_datetime;
end;
$$ language plpgsql;

-- Function to calculate budget spend (tenant-scoped)
create or replace function calculate_budget_spend(
  p_tenant_id uuid,
  p_location_id uuid,
  p_fiscal_year int,
  p_category text default 'total'
) returns decimal as $$
declare
  v_spend decimal;
begin
  select coalesce(sum(actual_cost), 0) into v_spend
  from tickets t
  left join ticket_categories tc on t.category_id = tc.id and tc.deleted_at is null
  where t.tenant_id = p_tenant_id  -- CRITICAL: Tenant isolation
    and t.location_id = p_location_id
    and extract(year from t.completed_at) = p_fiscal_year
    and t.status in ('completed', 'verified', 'closed')
    and t.deleted_at is null  -- CRITICAL: Filter soft-deleted
    and (p_category = 'total' or tc.name = p_category);

  return v_spend;
end;
$$ language plpgsql;

-- Trigger to update ticket timestamps
create or replace function update_ticket_timestamps() returns trigger as $$
begin
  new.updated_at = now();
  
  if old.status != new.status then
    case new.status
      when 'acknowledged' then new.acknowledged_at = now();
      when 'approved' then new.approved_at = now();
      when 'in_progress' then new.started_at = now();
      when 'completed' then new.completed_at = now();
      when 'verified' then new.verified_at = now();
      when 'closed' then new.closed_at = now();
    end case;
    
    insert into ticket_status_history (ticket_id, from_status, to_status)
    values (new.id, old.status, new.status);
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger trg_ticket_timestamps
  before update on tickets
  for each row execute function update_ticket_timestamps();

-- Trigger to auto-calculate next PM due date
create or replace function calculate_next_pm_date() returns trigger as $$
begin
  if new.last_completed_date is distinct from old.last_completed_date then
    new.next_due_date = case new.frequency_type
      when 'daily' then new.last_completed_date + (new.frequency_value || ' days')::interval
      when 'weekly' then new.last_completed_date + (new.frequency_value * 7 || ' days')::interval
      when 'biweekly' then new.last_completed_date + (new.frequency_value * 14 || ' days')::interval
      when 'monthly' then new.last_completed_date + (new.frequency_value || ' months')::interval
      when 'quarterly' then new.last_completed_date + (new.frequency_value * 3 || ' months')::interval
      when 'semi_annually' then new.last_completed_date + (new.frequency_value * 6 || ' months')::interval
      when 'annually' then new.last_completed_date + (new.frequency_value || ' years')::interval
    end;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger trg_pm_next_date
  before update on pm_schedules
  for each row execute function calculate_next_pm_date();
```

---

## Key Features by Role

| Role | Capabilities |
|------|-------------|
| **Staff** | Submit tickets (bilingual), view own tickets, scan QR codes, basic asset lookup |
| **Manager** | All staff + view/manage location tickets, approve costs up to threshold, verify completions, manage location assets, view location reports |
| **Admin** | All manager + multi-location access, full approval authority, user management, vendor management, system configuration, all reports |
| **Super Admin** | All admin + organization settings, billing, integrations, audit logs |
| **Vendor** | View assigned tickets only, update status, add comments/photos, submit invoices |
| **Read-only** | View-only access to specified locations/reports (for investors, insurance, landlords) |

---

## UI/UX Structure

```
/                              → Dashboard (role-based)
/tickets                       → Ticket list with filters
/tickets/new                   → Submit new ticket (bilingual)
/tickets/[id]                  → Ticket detail/management
/tickets/[id]/approve          → Cost approval workflow

/assets                        → Asset registry
/assets/[id]                   → Asset detail + history + warranty status
/assets/scan                   → QR scanner (mobile)
/assets/transfer               → Asset transfer wizard
/assets/import                 → Bulk CSV import

/compliance                    → License/permit tracker
/compliance/[id]               → Document detail + renewal workflow
/compliance/calendar           → Expiration calendar
/compliance/audit-export       → Generate audit packages

/pm                            → Preventive maintenance schedules
/pm/calendar                   → Calendar view (all locations)
/pm/templates                  → PM checklist templates

/vendors                       → Vendor directory
/vendors/[id]                  → Vendor detail + scorecard
/vendors/[id]/rate             → Rate vendor performance

/emergencies                   → Emergency incident tracker
/emergencies/[id]              → Incident detail + tasks
/on-call                       → On-call schedule management

/budgets                       → Budget overview
/budgets/[location]            → Location budget detail
/budgets/approvals             → Pending cost approvals

/reports                       → Report hub
/reports/tickets               → Ticket analytics
/reports/costs                 → Financial reports
/reports/vendors               → Vendor scorecards
/reports/compliance            → Compliance status
/reports/locations             → Location comparisons

/settings                      → System configuration
/settings/users                → User management
/settings/locations            → Location management
/settings/categories           → Ticket categories
/settings/notifications        → Notification rules
/settings/thresholds           → Approval thresholds

/vendor-portal                 → Vendor-specific portal (separate auth)
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Project setup with Next.js 16, React 19.2, Tailwind CSS 4, shadcn/ui
- Configure Turbopack file system caching + React Compiler
- Supabase project creation and schema deployment
- Authentication with @supabase/ssr (server-side auth)
- Role-based authorization in proxy.ts (replaces middleware.ts)
- TanStack Query provider setup
- Cache Components setup with `"use cache"` for static data
- Location management CRUD (Server Components + Server Actions)
- User management CRUD with role assignment
- Resend integration for transactional email
- next-intl setup for bilingual support (EN/ES)

### Phase 2: Core Ticketing (Week 3-5)
- Ticket submission form with photo upload
- **Bilingual submission form (EN/ES)**
- **Duplicate detection warning on submit**
- Ticket list with filtering/sorting/search
- Ticket detail view with full status workflow
- Comment system (internal + external)
- **Cost approval workflow with thresholds**
- Status change notifications
- Basic dashboard with ticket metrics
- **Escalation rules and alerts**

### Phase 3: Asset Management (Week 6-7)
- Asset registry CRUD
- QR code generation (qrcode.react)
- QR scanner for mobile (html5-qrcode)
- Asset-to-ticket linking
- **Warranty flag display on ticket creation**
- Maintenance history view
- Asset transfer workflow
- Bulk import via CSV

### Phase 4: Compliance & PM (Week 8-10)
- Compliance document management
- **Multi-location permit support**
- **Conditional/provisional permit tracking**
- **Failed inspection workflow**
- Expiration tracking & tiered alerts
- Audit-ready export functionality
- Preventive maintenance schedules
- PM templates with checklists
- Auto-generated work orders
- Calendar views

### Phase 5: Emergency & On-Call (Week 11-12)
- On-call rotation management
- After-hours ticket routing
- Emergency incident tracking
- Incident task checklists
- Critical ticket SMS alerts (Twilio)
- **Cascading failure warnings**

### Phase 6: Financial Management (Week 13-14)
- Budget setup per location/category
- Budget utilization tracking
- Budget threshold alerts
- Invoice management
- Chargeback tracking
- Cost forecasting reports

### Phase 7: Vendors & Reporting (Week 15-16)
- Vendor portal with scoped access
- Vendor rating system
- **Vendor scorecards with metrics**
- Comprehensive reporting dashboard
- **Location comparison reports**
- Export functionality (CSV, PDF)
- Scheduled report delivery

### Phase 8: Polish & Mobile (Week 17-18)
- **Offline mode with sync queue** (Service Worker + IndexedDB)
- Progressive Web App (PWA) with @ducanh2912/next-pwa
- Mobile-optimized views with responsive shadcn components
- View Transitions for smooth navigation animations (React 19.2)
- Performance optimization (React Compiler, Turbopack caching)
- DevTools MCP integration for AI-assisted debugging
- Full audit logging with Server Actions
- Vitest unit tests for critical paths
- Playwright E2E tests for main workflows
- Documentation and runbooks

---

## Notification Rules

| Event | Channel | Recipients | Timing |
|-------|---------|------------|--------|
| New ticket submitted | Email, Push | Location manager, Category default assignee | Immediate |
| Ticket assigned | Email, Push | Assignee | Immediate |
| Critical ticket | Email, SMS, Slack | On-call, Admin | Immediate |
| Ticket not acknowledged | Email, SMS | Admin, Location manager | 4 hours |
| Ticket stale (no update) | Email | Assigned user, Manager | 3 days |
| Cost approval needed | Email, Push | Approver based on threshold | Immediate |
| Cost approved/denied | Email, Push | Requester | Immediate |
| Ticket completed | Push | Submitter | Immediate |
| Completion rejected | Email, Push | Assignee, Vendor | Immediate |
| Compliance 90 day | Email | Admin | Once |
| Compliance 60 day | Email | Admin, Location manager | Once |
| Compliance 30 day | Email, Push | Admin, Location manager | Once |
| Compliance 14 day | Email, SMS | Admin, Location manager | Once |
| Compliance 7 day | Email, SMS | Admin, Location manager, Owner | Daily |
| Compliance expired | Email, SMS | Admin, Owner | Daily until resolved |
| Vendor insurance expiring | Email | Admin | 60, 30, 14 days |
| PM task due soon | Email, Push | Assignee | 7 days before |
| PM overdue | Email | Assignee, Manager, Admin | Daily |
| Budget 80% | Email | Location manager, Admin | Once |
| Budget 90% | Email, Push | Admin | Once |
| Budget exceeded | Email, SMS | Admin, Owner | Once |
| Warranty expiring | Email | Admin | 90, 30 days |

---

## Integrations

| Integration | Purpose | Priority |
|-------------|---------|----------|
| **Resend** | Transactional emails | P0 - Required |
| **Twilio** | SMS alerts for critical issues | P0 - Required |
| **Supabase Storage** | File/photo storage | P0 - Required |
| **Supabase Realtime** | Live ticket updates | P1 - High |
| **Slack** | Team notifications channel | P1 - High |
| **Google Calendar** | PM schedule sync | P2 - Medium |
| **QuickBooks** | Invoice/expense sync | P2 - Medium |
| **Toast POS** | Pull location data | P2 - Medium |
| **Zapier** | Custom workflow automation | P3 - Nice to have |

---

## Estimated Costs (Monthly)

### Single Tenant (MHG Only)

| Service | Estimated Cost | Notes |
|---------|----------------|-------|
| Supabase Pro | $25 | Base plan, 8GB database, 250GB bandwidth |
| Supabase Storage | $25-50 | ~50GB estimated for photos/docs across 14 locations |
| Vercel Pro | $20 | Includes 1TB bandwidth, analytics |
| Resend (email) | $20 | ~3,000 emails/month (notifications, alerts) |
| Twilio (SMS) | $50-100 | ~500 SMS/month for critical alerts, compliance |
| Slack (existing) | $0 | Uses existing workspace |
| Domain | ~$1 | Annual cost amortized |
| **Total** | **~$150-220/month** | Conservative estimate |

### Multi-Tenant SaaS (10+ Tenants)

| Service | Estimated Cost | Notes |
|---------|----------------|-------|
| Supabase Team | $599 | 100GB database, dedicated resources |
| Supabase Storage | $100-200 | ~500GB across all tenants |
| Vercel Pro | $20 | Per-seat; may need Team ($150) at scale |
| Resend (email) | $100 | ~30,000 emails/month |
| Twilio (SMS) | $200-400 | ~5,000 SMS/month across tenants |
| Stripe | Variable | 2.9% + $0.30 per transaction |
| Custom domain DNS | $5 | Cloudflare, wildcard SSL |
| **Total** | **~$1,000-1,400/month** | 10+ active tenants |

### Suggested SaaS Pricing Tiers

| Plan | Price | Limits | Features |
|------|-------|--------|----------|
| **Free/Trial** | $0 | 14 days, 3 users, 1 location | Core ticketing, basic reports |
| **Starter** | $49/mo | 10 users, 3 locations, 5GB | + Compliance tracking, PM schedules |
| **Professional** | $149/mo | 25 users, 10 locations, 25GB | + Vendor portal, budget tracking |
| **Enterprise** | $399/mo | Unlimited users, unlimited locations | + SSO, API access, custom domain, priority support |

**Break-even Analysis:**
- Platform costs: ~$1,200/month
- At $149/mo average: Need 8 paying tenants to break even
- At 20 tenants: ~$3,000/month revenue = $1,800/month profit

### ROI Comparison (For Customers)

- UpKeep: $45/user/month × 20 users = $900/month
- Fiix: $40/user/month × 20 users = $800/month
- Limble CMMS: $35/user/month × 20 users = $700/month
- **Our Professional Plan: $149/month (up to 25 users)**

**Customer Annual Savings: $6,500-9,000** vs commercial solutions

---

## MVP Feature Checklist (Quick Launch)

These features would give you a functional system in 4-6 weeks:

- [ ] User auth with roles (admin, manager, staff)
- [ ] Location management
- [ ] Ticket submission with photos (EN/ES)
- [ ] Duplicate ticket warning
- [ ] Ticket list and detail views
- [ ] Basic status workflow (submitted → in progress → completed)
- [ ] Email notifications for new tickets
- [ ] Asset registry with warranty dates
- [ ] Warranty flag on ticket creation
- [ ] QR code generation for assets
- [ ] Compliance document tracker
- [ ] Expiration alerts (email)
- [ ] Basic dashboard
- [ ] Simple cost approval (yes/no for amounts over $500)
- [ ] On-call phone number in settings

---

## Future Expansion Possibilities

1. **White-label for COMP** — Offer as facilities module to COMP customers
2. **AI-powered triage** — Auto-categorize and prioritize tickets from descriptions
3. **Predictive maintenance** — ML model to predict equipment failures
4. **IoT integration** — Connect to smart sensors (temp monitors, leak detectors)
5. **Energy management** — Track utility usage per location
6. **Contractor marketplace** — Bid system for larger projects
7. **Mobile app** — Native iOS/Android for field workers
8. **Multi-tenant SaaS** — Expand beyond MHG to other restaurant groups

---

## Next Steps

1. ☐ Review and confirm scope/priorities
2. ☐ Set up Supabase project
3. ☐ Deploy database schema
4. ☐ Initialize Next.js project with auth
5. ☐ Build ticket submission MVP
6. ☐ Add compliance tracking
7. ☐ Iterate based on usage

---

## Security Considerations

### API Rate Limiting

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Different rate limits per endpoint type
export const rateLimiters = {
  // Standard API: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
  }),

  // Auth endpoints: 10 requests per minute (prevent brute force)
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
  }),

  // File uploads: 20 per minute
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
  }),
}

// Usage in API route
export async function checkRateLimit(
  identifier: string,
  type: keyof typeof rateLimiters = 'api'
) {
  const { success, limit, reset, remaining } = await rateLimiters[type].limit(identifier)

  return {
    success,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  }
}
```

### RBAC Permission Matrix

| Permission | Staff | Manager | Admin | Super Admin | Vendor | Read-only |
|------------|-------|---------|-------|-------------|--------|-----------|
| View own tickets | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View location tickets | - | ✓ | ✓ | ✓ | - | ✓ |
| View all tickets | - | - | ✓ | ✓ | - | - |
| Create tickets | ✓ | ✓ | ✓ | ✓ | - | - |
| Update tickets | Own | Location | All | All | Assigned | - |
| Approve costs (<$1K) | - | ✓ | ✓ | ✓ | - | - |
| Approve costs (<$5K) | - | - | ✓ | ✓ | - | - |
| Approve costs (any) | - | - | - | ✓ | - | - |
| Manage users | - | - | ✓ | ✓ | - | - |
| Manage locations | - | - | ✓ | ✓ | - | - |
| System settings | - | - | - | ✓ | - | - |
| View audit logs | - | - | - | ✓ | - | - |
| Export data | - | ✓ | ✓ | ✓ | - | ✓ |

---

*Document Version: 4.0*
*Tech Stack: Next.js 16 / React 19.2 / Tailwind CSS 4 / shadcn/ui*
*Last Updated: January 2025*
*Architecture: Multi-Tenant SaaS, 3-Layer (DAO → Service → Route) with Soft Deletes*
