'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Ticket,
  AlertTriangle,
  Calendar,
  MoreHorizontal,
} from 'lucide-react'

const bottomNavItems = [
  { title: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Tickets', href: '/tickets', icon: Ticket },
  { title: 'Emergency', href: '/emergencies', icon: AlertTriangle },
  { title: 'PM', href: '/pm', icon: Calendar },
]

interface BottomNavProps {
  onMoreClick: () => void
}

export function BottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
    >
      <div className="flex items-center justify-around h-16 pb-safe">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.title}</span>
            </Link>
          )
        })}

        {/* More button */}
        <button
          type="button"
          onClick={onMoreClick}
          className="flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="More navigation options"
        >
          <MoreHorizontal className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </nav>
  )
}
