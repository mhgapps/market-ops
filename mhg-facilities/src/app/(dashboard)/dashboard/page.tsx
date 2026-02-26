"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

// Dynamically import heavy chart components (Recharts ~96KB)
const TicketTrendChart = dynamic(
  () =>
    import("@/components/dashboard/ticket-trend-chart").then((mod) => ({
      default: mod.TicketTrendChart,
    })),
  {
    ssr: false,
    loading: () => (
      <ChartSkeleton title="Ticket Trend (30 Days)" variant="line" />
    ),
  },
);

const StatusPieChart = dynamic(
  () =>
    import("@/components/dashboard/status-pie-chart").then((mod) => ({
      default: mod.StatusPieChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Tickets by Status" variant="pie" />,
  },
);

const PriorityBarChart = dynamic(
  () =>
    import("@/components/dashboard/priority-bar-chart").then((mod) => ({
      default: mod.PriorityBarChart,
    })),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Tickets by Priority" variant="bar" />,
  },
);
import {
  useOverviewStats,
  useTicketStats,
  useRecentActivity,
} from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { FileText, FileCheck, Wrench, Plus, AlertTriangle } from "lucide-react";

function DashboardOverview() {
  const { data: overview, isLoading: overviewLoading } = useOverviewStats();
  const { data: ticketData, isLoading: ticketsLoading } = useTicketStats(
    30,
    true,
  );
  const { data: activityData, isLoading: activityLoading } =
    useRecentActivity(10);

  if (overviewLoading || ticketsLoading || activityLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-lg bg-muted animate-pulse" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[400px] rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {/* Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Dashboard
          </h1>
        </div>
        <Button asChild className="hidden md:flex">
          <Link href="/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Strip */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
          <Link
            href="/tickets"
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors"
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{overview?.openTickets ?? 0}</span>
            <span className="text-sm text-muted-foreground">Open</span>
          </Link>
          <Link
            href="/tickets?emergency=true"
            className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors ${
              (overview?.activeEmergencies ?? 0) > 0 ? "bg-red-50" : ""
            }`}
          >
            <AlertTriangle
              className={`h-4 w-4 ${(overview?.activeEmergencies ?? 0) > 0 ? "text-red-500" : "text-muted-foreground"}`}
            />
            <span
              className={`font-semibold ${(overview?.activeEmergencies ?? 0) > 0 ? "text-red-600" : ""}`}
            >
              {overview?.activeEmergencies ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">Emergencies</span>
          </Link>
          <Link
            href="/compliance"
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors"
          >
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              {overview?.expiringCompliance ?? 0}
            </span>
            <span className="text-sm text-muted-foreground">Expiring</span>
          </Link>
          <Link
            href="/pm"
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors"
          >
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{overview?.overduePM ?? 0}</span>
            <span className="text-sm text-muted-foreground">Overdue PM</span>
          </Link>
        </div>
      </Card>

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
          <div className="h-12 rounded-lg bg-muted animate-pulse" />
        </div>
      }
    >
      <DashboardOverview />
    </Suspense>
  );
}
