import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { TenantContext, TenantSettings } from '@/types'
import type { Tenant } from '@/types/database'

// Partial tenant type for select queries
type TenantSelectResult = Pick<
  Tenant,
  'id' | 'slug' | 'name' | 'features' | 'branding' | 'max_users' | 'max_locations' | 'storage_limit_gb'
>

// Default tenant settings
const DEFAULT_SETTINGS: TenantSettings = {
  features: {
    compliance_tracking: true,
    preventive_maintenance: true,
    vendor_portal: false,
    budget_tracking: false,
    emergency_module: false,
    api_access: false,
    sso: false,
    custom_domain: false,
  },
  branding: {
    primary_color: '#3B82F6',
    secondary_color: '#1E40AF',
    logo_url: null,
    favicon_url: null,
  },
  limits: {
    max_users: 5,
    max_locations: 3,
    storage_gb: 5,
  },
}

export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''

  // Extract subdomain from host
  // e.g., mhg.facilities.app -> mhg
  // e.g., localhost:3000 -> null (no subdomain)
  const parts = host.split('.')
  const subdomain = parts.length > 2 ? parts[0] : null

  // Check if it's a known tenant subdomain (not www, app, localhost)
  if (subdomain && !['www', 'app', 'localhost'].includes(subdomain)) {
    const supabase = await createClient()
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug, name, features, branding, max_users, max_locations, storage_limit_gb')
      .eq('slug', subdomain)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single<TenantSelectResult>()

    if (tenant) {
      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        settings: {
          features: (tenant.features ?? DEFAULT_SETTINGS.features) as TenantSettings['features'],
          branding: (tenant.branding ?? DEFAULT_SETTINGS.branding) as TenantSettings['branding'],
          limits: {
            max_users: tenant.max_users,
            max_locations: tenant.max_locations,
            storage_gb: tenant.storage_limit_gb,
          },
        },
      }
    }
  }

  // Fallback: Get tenant from authenticated user's metadata
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.user_metadata?.tenant_id) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, slug, name, features, branding, max_users, max_locations, storage_limit_gb')
      .eq('id', user.user_metadata.tenant_id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single<TenantSelectResult>()

    if (tenant) {
      return {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        settings: {
          features: (tenant.features ?? DEFAULT_SETTINGS.features) as TenantSettings['features'],
          branding: (tenant.branding ?? DEFAULT_SETTINGS.branding) as TenantSettings['branding'],
          limits: {
            max_users: tenant.max_users,
            max_locations: tenant.max_locations,
            storage_gb: tenant.storage_limit_gb,
          },
        },
      }
    }
  }

  return null
}

// Get tenant ID only (lighter query when full context not needed)
export async function getTenantId(): Promise<string | null> {
  const context = await getTenantContext()
  return context?.id ?? null
}

// Require tenant context (throws if not found)
export async function requireTenantContext(): Promise<TenantContext> {
  const context = await getTenantContext()
  if (!context) {
    throw new Error('Tenant context required but not found')
  }
  return context
}
