'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth, useIsAdmin } from '@/hooks/use-auth'
import {
  LayoutDashboard,
  MapPin,
  Ticket,
  Wrench,
  Users,
  Shield,
  BarChart3,
  Settings,
  Building2,
  type LucideIcon,
} from 'lucide-react'

// Navigation item type
interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
  managerOnly?: boolean
}

// Navigation items
const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Locations',
    href: '/locations',
    icon: MapPin,
  },
  {
    title: 'Tickets',
    href: '/tickets',
    icon: Ticket,
  },
  {
    title: 'Assets',
    href: '/assets',
    icon: Wrench,
  },
  {
    title: 'Vendors',
    href: '/vendors',
    icon: Building2,
    managerOnly: true,
  },
  {
    title: 'Compliance',
    href: '/compliance',
    icon: Shield,
    managerOnly: true,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    managerOnly: true,
  },
  {
    title: 'Users',
    href: '/settings/users',
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    adminOnly: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, tenant } = useAuth()
  const isAdmin = useIsAdmin()

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.managerOnly) {
      return isAdmin || user?.role === 'manager'
    }
    return true
  })

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground truncate">
            {tenant?.name ?? 'MHG Facilities'}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* User info at bottom */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-sm font-medium text-muted-foreground">
              {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName ?? 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.role ?? 'staff'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
