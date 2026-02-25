"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  List,
  CalendarDays,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PMScheduleList } from "./pm-schedule-list";
import { PMCalendar } from "@/components/pm/pm-calendar";
import { usePMStats } from "@/hooks/use-pm";

export function PMPageContent() {
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");
  const { data: stats, isLoading: statsLoading } = usePMStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Preventive Maintenance
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link href="/pm/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} loading={statsLoading} />

      {/* Tabs for List/Calendar View */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "list" | "calendar")}
      >
        <TabsList className="grid w-full max-w-[300px] grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            <span className="hidden sm:inline">List</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendar</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <PMScheduleList />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <PMCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatsCardsProps {
  stats?: {
    total: number;
    active: number;
    due_today: number;
    overdue: number;
    completed_this_month: number;
  };
  loading: boolean;
}

function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return <div className="h-12 rounded-lg bg-muted animate-pulse" />;
  }

  const data = stats || {
    total: 0,
    active: 0,
    due_today: 0,
    overdue: 0,
    completed_this_month: 0,
  };

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{data.total}</span>
          <span className="text-sm text-muted-foreground">Total</span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors ${data.due_today > 0 ? "bg-amber-50" : ""}`}
        >
          <Clock
            className={`h-4 w-4 ${data.due_today > 0 ? "text-amber-600" : "text-muted-foreground"}`}
          />
          <span
            className={`font-semibold ${data.due_today > 0 ? "text-amber-700" : ""}`}
          >
            {data.due_today}
          </span>
          <span className="text-sm text-muted-foreground">Due Today</span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors ${data.overdue > 0 ? "bg-red-50" : ""}`}
        >
          <AlertCircle
            className={`h-4 w-4 ${data.overdue > 0 ? "text-destructive" : "text-muted-foreground"}`}
          />
          <span
            className={`font-semibold ${data.overdue > 0 ? "text-red-600" : ""}`}
          >
            {data.overdue}
          </span>
          <span className="text-sm text-muted-foreground">Overdue</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-semibold">{data.completed_this_month}</span>
          <span className="text-sm text-muted-foreground">Completed</span>
        </div>
      </div>
    </Card>
  );
}
