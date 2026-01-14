'use client';

import dynamic from 'next/dynamic';
import type { TrendData, StatusCount, PriorityCount } from '@/services/dashboard.service';

// Dynamic imports for chart components - only loaded on client when needed
// This keeps Recharts (~96KB) out of the initial bundle
const TicketTrendChart = dynamic(
  () => import('./ticket-trend-chart').then((mod) => ({ default: mod.TicketTrendChart })),
  {
    ssr: false,
    loading: () => <div className="h-[400px] rounded-lg bg-muted animate-pulse" />,
  }
);

const StatusPieChart = dynamic(
  () => import('./status-pie-chart').then((mod) => ({ default: mod.StatusPieChart })),
  {
    ssr: false,
    loading: () => <div className="h-[400px] rounded-lg bg-muted animate-pulse" />,
  }
);

const PriorityBarChart = dynamic(
  () => import('./priority-bar-chart').then((mod) => ({ default: mod.PriorityBarChart })),
  {
    ssr: false,
    loading: () => <div className="h-[400px] rounded-lg bg-muted animate-pulse" />,
  }
);

interface DashboardChartsProps {
  ticketStats: {
    trend: TrendData[];
    byStatus: StatusCount[];
    byPriority: PriorityCount[];
  };
}

export function DashboardCharts({ ticketStats }: DashboardChartsProps) {
  return (
    <>
      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {ticketStats.trend && (
          <TicketTrendChart data={ticketStats.trend} title="Ticket Trend (30 Days)" />
        )}
        {ticketStats.byStatus && (
          <StatusPieChart data={ticketStats.byStatus} title="Tickets by Status" />
        )}
      </div>

      {/* Charts Row 2 - Priority only, Activity is rendered separately as Server Component */}
      <div className="grid gap-6 md:grid-cols-2">
        {ticketStats.byPriority && (
          <PriorityBarChart data={ticketStats.byPriority} title="Tickets by Priority" />
        )}
      </div>
    </>
  );
}
