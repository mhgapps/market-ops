"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePMCalendar } from "@/hooks/use-pm";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Clock,
  CalendarDays,
} from "lucide-react";

interface PMCalendarProps {
  assetId?: string;
}

interface CalendarTask {
  id: string;
  name: string;
  target: string;
  targetType: "asset" | "location";
  frequency: string;
  dueDate: string;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
}

export function PMCalendar({ assetId: _assetId }: PMCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());

  const month = viewMonth.getMonth() + 1;
  const year = viewMonth.getFullYear();

  const { data: calendarData, isLoading } = usePMCalendar(month, year);

  // Process calendar data into organized structure
  const { pmDates, dateDetails, upcomingTasks } = useMemo(() => {
    const dates = new Set<string>();
    const details: Record<string, CalendarTask[]> = {};
    const upcoming: CalendarTask[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (calendarData) {
      calendarData.forEach((schedule) => {
        if (!schedule.next_due_date) return;

        const dueDate = new Date(schedule.next_due_date);
        dueDate.setHours(0, 0, 0, 0);
        const dateKey = schedule.next_due_date;
        dates.add(dateKey);

        const daysDiff = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        const task: CalendarTask = {
          id: schedule.id,
          name: schedule.name,
          target: schedule.asset_name || schedule.location_name || "Unknown",
          targetType: schedule.asset_name ? "asset" : "location",
          frequency: schedule.frequency,
          dueDate: schedule.next_due_date,
          isOverdue: daysDiff < 0,
          isDueToday: daysDiff === 0,
          isDueSoon: daysDiff > 0 && daysDiff <= 7,
        };

        if (!details[dateKey]) {
          details[dateKey] = [];
        }
        details[dateKey].push(task);
        upcoming.push(task);
      });
    }

    // Sort upcoming by due date
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return { pmDates: dates, dateDetails: details, upcomingTasks: upcoming };
  }, [calendarData]);

  const modifiers = {
    pmDue: (date: Date) => {
      const dateKey = date.toISOString().split("T")[0];
      return pmDates.has(dateKey);
    },
    pmOverdue: (date: Date) => {
      const dateKey = date.toISOString().split("T")[0];
      const tasks = dateDetails[dateKey];
      return tasks?.some((t) => t.isOverdue) || false;
    },
    pmDueToday: (date: Date) => {
      const dateKey = date.toISOString().split("T")[0];
      const tasks = dateDetails[dateKey];
      return tasks?.some((t) => t.isDueToday) || false;
    },
  };

  const modifiersClassNames = {
    pmDue: "bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200",
    pmOverdue: "bg-red-100 text-red-900 font-semibold hover:bg-red-200",
    pmDueToday: "bg-amber-100 text-amber-900 font-semibold hover:bg-amber-200",
  };

  const selectedDateKey = selectedDate.toISOString().split("T")[0];
  const selectedDateTasks = dateDetails[selectedDateKey] || [];

  const formatFrequency = (frequency: string) => {
    const map: Record<string, string> = {
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Bi-Weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      semi_annually: "Semi-Annual",
      annually: "Annual",
    };
    return map[frequency] || frequency.replace(/_/g, " ");
  };

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);

    const daysDiff = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff < 0)
      return `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) !== 1 ? "s" : ""}`;
    if (daysDiff === 0) return "Due Today";
    if (daysDiff === 1) return "Tomorrow";
    if (daysDiff <= 7) return `In ${daysDiff} days`;
    return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(viewMonth);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setViewMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setViewMonth(today);
    setSelectedDate(today);
  };

  // Group upcoming tasks by urgency
  const overdueCount = upcomingTasks.filter((t) => t.isOverdue).length;
  const dueTodayCount = upcomingTasks.filter((t) => t.isDueToday).length;
  const dueSoonCount = upcomingTasks.filter((t) => t.isDueSoon).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          className={`${overdueCount > 0 ? "border-red-200 bg-red-50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle
                className={`h-5 w-5 ${overdueCount > 0 ? "text-red-600" : "text-muted-foreground"}`}
              />
              <div>
                <p
                  className={`text-2xl font-bold ${overdueCount > 0 ? "text-red-600" : ""}`}
                >
                  {overdueCount}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`${dueTodayCount > 0 ? "border-amber-200 bg-amber-50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CalendarDays
                className={`h-5 w-5 ${dueTodayCount > 0 ? "text-amber-600" : "text-muted-foreground"}`}
              />
              <div>
                <p
                  className={`text-2xl font-bold ${dueTodayCount > 0 ? "text-amber-600" : ""}`}
                >
                  {dueTodayCount}
                </p>
                <p className="text-xs text-muted-foreground">Due Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {dueSoonCount}
                </p>
                <p className="text-xs text-muted-foreground">Next 7 Days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Calendar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {viewMonth.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              month={viewMonth}
              onMonthChange={setViewMonth}
              modifiers={modifiers}
              modifiersClassNames={modifiersClassNames}
              className="rounded-md border"
            />
            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-red-100 border border-red-300" />
                <span className="text-muted-foreground">Overdue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-amber-100 border border-amber-300" />
                <span className="text-muted-foreground">Due Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded bg-blue-100 border border-blue-300" />
                <span className="text-muted-foreground">Scheduled</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-lg bg-muted animate-pulse"
                  />
                ))}
              </div>
            ) : selectedDateTasks.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`rounded-lg border p-3 space-y-2 transition-colors ${
                      task.isOverdue
                        ? "border-red-200 bg-red-50"
                        : task.isDueToday
                          ? "border-amber-200 bg-amber-50"
                          : "hover:bg-accent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{task.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {task.target}
                          <span className="text-xs ml-1">
                            (
                            {task.targetType === "asset" ? "Asset" : "Location"}
                            )
                          </span>
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/pm/${task.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatFrequency(task.frequency)}
                      </Badge>
                      {task.isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      )}
                      {task.isDueToday && !task.isOverdue && (
                        <Badge className="text-xs bg-amber-500 hover:bg-amber-600">
                          Due Today
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No PM tasks scheduled for this date</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            Upcoming Maintenance Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : upcomingTasks.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    task.isOverdue
                      ? "border-red-200 bg-red-50"
                      : task.isDueToday
                        ? "border-amber-200 bg-amber-50"
                        : task.isDueSoon
                          ? "border-blue-100 bg-blue-50/50"
                          : "hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        task.isOverdue
                          ? "bg-red-500"
                          : task.isDueToday
                            ? "bg-amber-500"
                            : task.isDueSoon
                              ? "bg-blue-500"
                              : "bg-gray-300"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{task.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {task.target}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-sm font-medium ${
                        task.isOverdue
                          ? "text-red-600"
                          : task.isDueToday
                            ? "text-amber-600"
                            : task.isDueSoon
                              ? "text-blue-600"
                              : "text-muted-foreground"
                      }`}
                    >
                      {formatDueDate(task.dueDate)}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pm/${task.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No upcoming maintenance tasks this month</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
