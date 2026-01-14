'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePMSchedules } from '@/hooks/use-pm';

export function PMScheduleList() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();

  const { data: schedules, isLoading, error } = usePMSchedules({
    priority: priorityFilter as 'low' | 'medium' | 'high' | 'critical' | undefined,
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading schedules...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading schedules. Please try again.
      </div>
    );
  }

  const filteredSchedules = schedules?.filter((schedule) =>
    schedule.task_name.toLowerCase().includes(search.toLowerCase()) ||
    schedule.asset_name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

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

  const getStatusColor = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'text-destructive';
    if (daysUntil <= 7) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const formatDueDate = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return 'Due today';
    if (daysUntil === 1) return 'Due tomorrow';
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return due.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search schedules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No schedules found
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.task_name}</TableCell>
                  <TableCell>{schedule.asset_name || 'N/A'}</TableCell>
                  <TableCell className="capitalize">
                    {schedule.frequency.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityVariant(schedule.priority)}>
                      {schedule.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {schedule.next_due_date ? (
                      <span className={`text-sm font-medium ${getStatusColor(schedule.next_due_date)}`}>
                        {formatDueDate(schedule.next_due_date)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not scheduled</span>
                    )}
                  </TableCell>
                  <TableCell>{schedule.assigned_to_name || 'Unassigned'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/pm/${schedule.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
