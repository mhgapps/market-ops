'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { TicketTrendChart } from '@/components/dashboard/ticket-trend-chart';
import { StatusPieChart } from '@/components/dashboard/status-pie-chart';
import { PriorityBarChart } from '@/components/dashboard/priority-bar-chart';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import {
  useOverviewStats,
  useTicketStats,
  useRecentActivity,
} from '@/hooks/use-dashboard';
import {
  FileText,
  AlertCircle,
  FileCheck,
  Wrench,
  Plus,
} from 'lucide-react';

function DashboardOverview() {
  const { data: overview, isLoading: overviewLoading } = useOverviewStats();
  const { data: ticketData, isLoading: ticketsLoading } = useTicketStats(30, true);
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(10);

  if (overviewLoading || ticketsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[400px] rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome back! Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <Button asChild className="hidden md:flex">
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Open Tickets"
          value={overview?.openTickets ?? 0}
          icon={<FileText className="h-4 w-4" />}
          href="/tickets"
          description="Active tickets"
        />
        <StatCard
          title="Pending Approvals"
          value={overview?.pendingApprovals ?? 0}
          icon={<AlertCircle className="h-4 w-4" />}
          href="/approvals"
          description="Awaiting approval"
        />
        <StatCard
          title="Expiring Compliance"
          value={overview?.expiringCompliance ?? 0}
          icon={<FileCheck className="h-4 w-4" />}
          href="/compliance"
          description="Next 30 days"
        />
        <StatCard
          title="Overdue PM"
          value={overview?.overduePM ?? 0}
          icon={<Wrench className="h-4 w-4" />}
          href="/pm"
          description="Needs attention"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {ticketData?.trend && (
          <TicketTrendChart
            data={ticketData.trend}
            title="Ticket Trend (30 Days)"
          />
        )}
        {ticketData?.byStatus && (
          <StatusPieChart
            data={ticketData.byStatus}
            title="Tickets by Status"
          />
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {ticketData?.byPriority && (
          <PriorityBarChart
            data={ticketData.byPriority}
            title="Tickets by Priority"
          />
        )}
        {activityData?.activities && (
          <ActivityFeed
            activities={activityData.activities}
            title="Recent Activity"
          />
        )}
      </div>

      {/* Mobile Quick Action Button */}
      <div className="fixed bottom-4 right-4 md:hidden">
        <Button asChild size="lg" className="rounded-full h-14 w-14 shadow-lg">
          <Link href="/tickets/new">
            <Plus className="h-6 w-6" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardOverview />
    </Suspense>
  );
}
