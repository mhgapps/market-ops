import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { DashboardChartsSkeleton } from '@/components/ui/skeletons';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { DashboardService } from '@/services/dashboard.service';
import {
  FileText,
  AlertCircle,
  FileCheck,
  Wrench,
  Plus,
} from 'lucide-react';
import type {
  OverviewStats,
  TicketStats,
  TrendData,
  StatusCount,
  PriorityCount,
  ActivityItem,
} from '@/services/dashboard.service';

// Types for dashboard data
interface DashboardData {
  overview: OverviewStats;
  ticketStats: {
    stats: TicketStats;
    trend: TrendData[];
    byStatus: StatusCount[];
    byPriority: PriorityCount[];
  };
  recentActivity: ActivityItem[];
}

// Server-side data fetching function
async function fetchDashboardData(): Promise<DashboardData> {
  const service = new DashboardService();

  // Fetch all dashboard data in parallel
  const [overview, ticketStats, ticketTrend, byStatus, byPriority, recentActivity] =
    await Promise.all([
      service.getOverviewStats(),
      service.getTicketStats(),
      service.getTicketTrend(30),
      service.getTicketsByStatus(),
      service.getTicketsByPriority(),
      service.getRecentActivity(10),
    ]);

  return {
    overview,
    ticketStats: {
      stats: ticketStats,
      trend: ticketTrend,
      byStatus,
      byPriority,
    },
    recentActivity,
  };
}

// Stats Cards - Server Component (no interactivity needed)
function DashboardStats({ overview }: { overview: OverviewStats }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      <StatCard
        title="Open Tickets"
        value={overview.openTickets}
        icon={<FileText className="h-4 w-4" />}
        href="/tickets"
        description="Active tickets"
      />
      <StatCard
        title="Pending Approvals"
        value={overview.pendingApprovals}
        icon={<AlertCircle className="h-4 w-4" />}
        href="/approvals"
        description="Awaiting approval"
      />
      <StatCard
        title="Expiring Compliance"
        value={overview.expiringCompliance}
        icon={<FileCheck className="h-4 w-4" />}
        href="/compliance"
        description="Next 30 days"
      />
      <StatCard
        title="Overdue PM"
        value={overview.overduePM}
        icon={<Wrench className="h-4 w-4" />}
        href="/pm"
        description="Needs attention"
      />
    </div>
  );
}

// Loading skeleton for stats
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 md:h-32 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// Mobile FAB Button - needs to be a client component for proper hydration
function MobileFAB() {
  return (
    <div className="fixed bottom-4 right-4 md:hidden">
      <Button asChild size="lg" className="rounded-full h-14 w-14 shadow-lg">
        <Link href="/tickets/new">
          <Plus className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}

// Main Dashboard Page - Server Component
export default async function DashboardPage() {
  const data = await fetchDashboardData();

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

      {/* Overview Cards - Server Component */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats overview={data.overview} />
      </Suspense>

      {/* Charts - Client Component with dynamic imports for Recharts */}
      <Suspense fallback={<DashboardChartsSkeleton />}>
        <DashboardCharts ticketStats={data.ticketStats} />
      </Suspense>

      {/* Activity Feed with Priority Chart - grid layout */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-start-2">
          <ActivityFeed
            activities={data.recentActivity}
            title="Recent Activity"
          />
        </div>
      </div>

      {/* Mobile Quick Action Button */}
      <MobileFAB />
    </div>
  );
}
