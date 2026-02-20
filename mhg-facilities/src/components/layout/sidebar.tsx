'use client'

import { useState, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useAuth, useIsAdmin } from '@/hooks/use-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Ticket,
  Wrench,
  Shield,
  Settings,
  Building2,
  Calendar,
  DollarSign,
  LogOut,
  User,
  ChevronUp,
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
    title: 'Tickets',
    href: '/tickets',
    icon: Ticket,
  },
  {
    title: 'PM Schedules',
    href: '/pm',
    icon: Calendar,
  },
  {
    title: 'Documents',
    href: '/compliance',
    icon: Shield,
    managerOnly: true,
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
    title: 'Budgets',
    href: '/budgets',
    icon: DollarSign,
    managerOnly: true,
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
  const router = useRouter()
  const { user, logout } = useAuth()
  const isAdmin = useIsAdmin()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Memoize filtered nav items to prevent recalculation on every render
  // Admin and super_admin can see everything
  // Manager can see managerOnly items
  // Staff/vendor/readonly only see items without restrictions
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // Admins see everything
      if (isAdmin) return true

      // Admin-only items are hidden for non-admins
      if (item.adminOnly) return false

      // Manager-only items: managers and above can see them
      if (item.managerOnly) {
        return user?.role === 'manager'
      }

      // No restrictions - everyone can see
      return true
    })
  }, [isAdmin, user?.role])

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-card border-r border-border">
      {/* Logo/Brand */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="MHG Facilities"
            width={32}
            height={32}
            className="w-8 h-8"
          />
          <span className="font-semibold text-foreground truncate">
            MHG Facilities
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

      {/* User menu at bottom */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-accent transition-colors text-left">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {user?.fullName?.charAt(0)?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.fullName ?? 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email ?? user?.role ?? 'staff'}
                </p>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" side="top" sideOffset={8}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName ?? 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email ?? ''}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
