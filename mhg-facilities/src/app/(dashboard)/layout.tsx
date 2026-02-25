"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { MoreMenu } from "@/components/layout/more-menu";
import { NotificationFab } from "@/components/layout/notification-fab";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="md:pl-64">
        {/* Page content */}
        <main className="p-4 pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav onMoreClick={() => setMoreMenuOpen(true)} />

      {/* More menu (bottom drawer) */}
      <MoreMenu isOpen={moreMenuOpen} onClose={() => setMoreMenuOpen(false)} />

      {/* Notification FAB */}
      <NotificationFab />
    </div>
  );
}
