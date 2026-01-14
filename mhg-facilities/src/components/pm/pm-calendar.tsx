'use client';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePMCalendar } from '@/hooks/use-pm';
import { useState } from 'react';

interface PMCalendarProps {
  assetId?: string;
}

export function PMCalendar({ assetId: _assetId }: PMCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const month = selectedDate.getMonth() + 1;
  const year = selectedDate.getFullYear();

  const { data: calendarData, isLoading } = usePMCalendar(month, year);

  // Create a map of dates with PM tasks
  const pmDates = new Set<string>();
  const dateDetails: Record<string, Array<{ task_name: string; asset_name: string; priority: string }>> = {};

  if (calendarData) {
    calendarData.forEach((schedule) => {
      const dateKey = new Date(schedule.next_due_date).toISOString().split('T')[0];
      pmDates.add(dateKey);

      if (!dateDetails[dateKey]) {
        dateDetails[dateKey] = [];
      }
      dateDetails[dateKey].push({
        task_name: schedule.task_name,
        asset_name: schedule.asset_name || 'Unknown Asset',
        priority: schedule.priority,
      });
    });
  }

  const modifiers = {
    pmDue: (date: Date) => {
      const dateKey = date.toISOString().split('T')[0];
      return pmDates.has(dateKey);
    },
  };

  const modifiersClassNames = {
    pmDue: 'bg-blue-100 text-blue-900 font-bold',
  };

  const selectedDateKey = selectedDate.toISOString().split('T')[0];
  const selectedDateTasks = dateDetails[selectedDateKey] || [];

  const getPriorityVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'warning' => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'warning';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>PM Schedule Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="rounded-md border"
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Highlighted dates have scheduled PM tasks</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : selectedDateTasks.length > 0 ? (
            <div className="space-y-3">
              {selectedDateTasks.map((task, index) => (
                <div key={index} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{task.task_name}</p>
                      <p className="text-xs text-muted-foreground">{task.asset_name}</p>
                    </div>
                    <Badge variant={getPriorityVariant(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No PM tasks scheduled for this date</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
