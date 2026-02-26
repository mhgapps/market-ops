"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Shield,
  Settings,
  Building2,
  DollarSign,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  managerOnly?: boolean;
}

// Items NOT in bottom nav (the "more" items)
const moreMenuItems: MenuItem[] = [
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

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = useIsAdmin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  // Filter items based on user role
  const filteredItems = moreMenuItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly) {
      return isAdmin || user?.role === "manager";
    }
    return true;
  });

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border">
          <DrawerTitle>More</DrawerTitle>
        </DrawerHeader>
        <nav className="grid grid-cols-3 gap-2 p-4">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium text-center">
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Divider + User section */}
        <div className="border-t border-border">
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
          <div className="p-2 space-y-1">
            <Link
              href="/settings/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors min-h-[44px]"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full disabled:opacity-50 min-h-[44px]"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
