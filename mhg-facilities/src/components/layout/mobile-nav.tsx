'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth, useIsAdmin } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
  X,
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

// Navigation items (same as sidebar)
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

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname()
  const { user, tenant } = useAuth()
  const isAdmin = useIsAdmin()

  // Close on route change
  useEffect(() => {
    onClose()
  }, [pathname, onClose])

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.managerOnly) {
      return isAdmin || user?.role === 'manager'
    }
    return true
  })

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex flex-row items-center justify-between h-16 px-6 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground truncate">
              {tenant?.name ?? 'MHG Facilities'}
            </span>
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

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
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
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
      </SheetContent>
    </Sheet>
  )
}
