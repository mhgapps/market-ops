"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth, useIsAdmin } from "@/hooks/use-auth";
import {
  CalendarPlus,
  FilePlus2,
  Plus,
  TicketPlus,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickCreateItem {
  title: string;
  href: string;
  icon: LucideIcon;
  managerOnly?: boolean;
}

const quickCreateItems: QuickCreateItem[] = [
  {
    title: "Tickets",
    href: "/tickets/new",
    icon: TicketPlus,
  },
  {
    title: "Assets",
    href: "/assets/new",
    icon: Wrench,
  },
  {
    title: "PM",
    href: "/pm/new",
    icon: CalendarPlus,
  },
  {
    title: "Docs",
    href: "/compliance/new",
    icon: FilePlus2,
    managerOnly: true,
  },
];

export function NotificationFab() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const filteredQuickCreateItems = useMemo(() => {
    return quickCreateItems.filter((item) => {
      if (item.managerOnly) {
        return isAdmin || user?.role === "manager";
      }
      return true;
    });
  }, [isAdmin, user?.role]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          className={cn(
            "fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-50 md:bottom-6",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-transform hover:scale-105 active:scale-95",
          )}
          aria-label="Quick create"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="top"
        sideOffset={10}
        className="w-44"
      >
        <DropdownMenuLabel>Quick Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filteredQuickCreateItems.map((item) => {
          const Icon = item.icon;

          return (
            <DropdownMenuItem key={item.href} asChild>
              <Link
                href={item.href}
                className="flex items-center cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
