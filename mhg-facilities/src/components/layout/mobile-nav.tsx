"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Ticket,
  Wrench,
  Shield,
  Settings,
  Building2,
  X,
  LogOut,
  User,
  Calendar,
  DollarSign,
  type LucideIcon,
} from "lucide-react";

// Navigation item type
interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean;
}

// Navigation items (same as sidebar)
const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Tickets",
    href: "/tickets",
    icon: Ticket,
  },
  {
    title: "PM Schedules",
    href: "/pm",
    icon: Calendar,
  },
  {
    title: "Assets",
    href: "/assets",
    icon: Wrench,
  },
  {
    title: "Documents",
    href: "/compliance",
    icon: Shield,
    managerOnly: true,
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Building2,
    managerOnly: true,
  },
  {
    title: "Budgets",
    href: "/budgets",
    icon: DollarSign,
    managerOnly: true,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: true,
  },
];

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, tenant, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const prevPathname = useRef(pathname);

  // Close on route change (only when pathname actually changes)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Memoize filtered nav items to prevent recalculation on every render
  const filteredNavItems = useMemo(() => {
    return navItems.filter((item) => {
      if (item.adminOnly && !isAdmin) return false;
      if (item.managerOnly) {
        return isAdmin || user?.role === "manager";
      }
      return true;
    });
  }, [isAdmin, user?.role]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="flex flex-row items-center justify-between h-16 px-6 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="MHG Facilities"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="font-semibold text-foreground truncate">
              {tenant?.name ?? "MHG Facilities"}
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
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.fullName?.charAt(0)?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.fullName ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email ?? user?.role ?? "staff"}
              </p>
            </div>
          </div>

          {/* User actions */}
          <div className="p-2 space-y-1">
            <Link
              href="/settings/profile"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
