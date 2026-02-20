'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth, useIsAdmin } from '@/hooks/use-auth'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Wrench,
  Settings,
  Building2,
  DollarSign,
  type LucideIcon,
} from 'lucide-react'

interface MenuItem {
  title: string
  href: string
  icon: LucideIcon
  adminOnly?: boolean
  managerOnly?: boolean
}

// Items NOT in bottom nav (the "more" items)
const moreMenuItems: MenuItem[] = [
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

interface MoreMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isAdmin = useIsAdmin()

  // Filter items based on user role
  const filteredItems = moreMenuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.managerOnly) {
      return isAdmin || user?.role === 'manager'
    }
    return true
  })

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>More</DrawerTitle>
        </DrawerHeader>
        <nav className="grid grid-cols-3 gap-2 p-4">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
