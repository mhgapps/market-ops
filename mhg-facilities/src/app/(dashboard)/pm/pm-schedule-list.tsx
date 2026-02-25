"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePMSchedules } from "@/hooks/use-pm";

export function PMScheduleList() {
  const [search, setSearch] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const {
    data: schedules,
    isLoading,
    error,
  } = usePMSchedules({
    frequency: frequencyFilter !== "all" ? frequencyFilter : undefined,
    is_active:
      statusFilter === "active"
        ? true
        : statusFilter === "inactive"
          ? false
          : undefined,
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

  const filteredSchedules =
    schedules?.filter(
      (schedule) =>
        schedule.name.toLowerCase().includes(search.toLowerCase()) ||
        schedule.asset_name?.toLowerCase().includes(search.toLowerCase()) ||
        schedule.location_name?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  const getStatusColor = (dueDate: string | null) => {
    if (!dueDate) return "text-muted-foreground";
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntil = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil < 0) return "text-destructive";
    if (daysUntil <= 7) return "text-amber-600";
    return "text-muted-foreground";
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return "Not scheduled";
    const due = new Date(dueDate);
    const today = new Date();
    const daysUntil = Math.ceil(
      (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil <= 7) return `Due in ${daysUntil} days`;
    return due.toLocaleDateString();
  };

  const formatFrequency = (frequency: string) => {
    return frequency.replace(/_/g, " ").replace(/ly$/, "");
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
        <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="biweekly">Bi-Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="semi_annually">Semi-Annually</SelectItem>
            <SelectItem value="annually">Annually</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task Name</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Due</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-muted-foreground"
                >
                  No schedules found
                </TableCell>
              </TableRow>
            ) : (
              filteredSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.name}</TableCell>
                  <TableCell>
                    {schedule.asset_name || schedule.location_name || "N/A"}
                    {schedule.asset_name && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Asset)
                      </span>
                    )}
                    {schedule.location_name && !schedule.asset_name && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (Location)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatFrequency(schedule.frequency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`text-sm font-medium ${getStatusColor(schedule.next_due_date)}`}
                    >
                      {formatDueDate(schedule.next_due_date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {schedule.assigned_to_name || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={schedule.is_active ? "default" : "secondary"}
                    >
                      {schedule.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
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
