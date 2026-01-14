import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Client component for the data display
import { PMScheduleList } from './pm-schedule-list';

export const metadata = {
  title: 'Preventive Maintenance',
  description: 'Manage preventive maintenance schedules and tasks',
};

export default async function PMPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preventive Maintenance</h1>
          <p className="text-muted-foreground">
            Schedule and track preventive maintenance tasks
          </p>
        </div>
        <Button asChild>
          <Link href="/pm/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Schedule
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <StatsCards />
      </Suspense>

      {/* PM Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedules</CardTitle>
          <CardDescription>
            View and manage all preventive maintenance schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading schedules...</div>}>
            <PMScheduleList />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function StatsCards() {
  // This would fetch from API in real implementation
  // For now, using placeholder data structure
  const stats = {
    total_schedules: 0,
    due_this_week: 0,
    overdue: 0,
    completed_this_month: 0,
  };

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Total</p>
              <p className="text-base font-bold">{stats.total_schedules}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_schedules}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Due</p>
              <p className="text-base font-bold">{stats.due_this_week}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.due_this_week}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Overdue</p>
              <p className="text-base font-bold">{stats.overdue}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdue}</div>
          </CardContent>
        </div>
      </Card>

      <Card>
        {/* Mobile compact layout */}
        <CardContent className="p-3 md:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground truncate">Done</p>
              <p className="text-base font-bold">{stats.completed_this_month}</p>
            </div>
          </div>
        </CardContent>
        {/* Desktop layout */}
        <div className="hidden md:block">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed_this_month}</div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 md:h-28 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  );
}
