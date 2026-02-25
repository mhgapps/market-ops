"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTickets, ticketKeys, type Ticket } from "@/hooks/use-tickets";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/tickets/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  LayoutList,
  LayoutGrid,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { format } from "date-fns";
import { DragDropContext, Draggable } from "@hello-pangea/dnd";
import { TableLoadingOverlay } from "@/components/ui/table-loading-overlay";
import { KanbanCard } from "@/components/tickets/kanban-card";
import { KanbanColumn } from "@/components/tickets/kanban-column";
import type { TicketStatus } from "@/types/database";

export function TicketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [emergencyFilter, setEmergencyFilter] = useState<string>(() => {
    return searchParams.get("emergency") === "true" ? "emergency" : "all";
  });
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const filters = {
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(priorityFilter !== "all" && { priority: priorityFilter }),
    ...(emergencyFilter !== "all" && {
      is_emergency: emergencyFilter === "emergency",
    }),
    ...(debouncedSearch && { search: debouncedSearch }),
    page,
    pageSize,
  };

  const { data: ticketResponse, isLoading, isFetching } = useTickets(filters);
  const tickets = ticketResponse?.data ?? [];
  const totalCount = ticketResponse?.total ?? 0;

  const stats = useMemo(() => {
    let submitted = 0;
    let inProgress = 0;
    let completed = 0;
    let emergencyCount = 0;

    for (const ticket of tickets) {
      if (ticket.status === "submitted") submitted++;
      else if (ticket.status === "in_progress") inProgress++;
      else if (ticket.status === "completed") completed++;
      if (ticket.is_emergency) emergencyCount++;
    }

    return { submitted, inProgress, completed, emergencyCount };
  }, [tickets]);

  const kanbanColumns = useMemo(
    () => ({
      submitted: tickets.filter((t) => t.status === "submitted"),
      in_progress: tickets.filter((t) => t.status === "in_progress"),
      completed: tickets.filter((t) => t.status === "completed"),
      closed: tickets.filter((t) => t.status === "closed"),
    }),
    [tickets],
  );

  const handleDragEnd = useCallback(
    async (result: {
      destination?: { droppableId: string } | null;
      draggableId: string;
    }) => {
      const currentFilters = { ...filters };

      if (!result.destination) {
        return;
      }

      const ticketId = result.draggableId;
      const newStatus = result.destination.droppableId;

      const ticket = tickets.find((t) => t.id === ticketId);
      if (!ticket || ticket.status === newStatus) {
        return;
      }

      const previousData = queryClient.getQueryData(
        ticketKeys.list(currentFilters),
      );

      queryClient.setQueryData(
        ticketKeys.list(currentFilters),
        (old: typeof previousData) => {
          if (!old || !("data" in (old as object))) return old;
          const oldData = old as {
            data: Ticket[];
            total: number;
            page: number;
            pageSize: number;
            totalPages: number;
          };
          return {
            ...oldData,
            data: oldData.data.map((t: Ticket) =>
              t.id === ticketId ? { ...t, status: newStatus } : t,
            ),
          };
        },
      );

      try {
        await api.patch(`/api/tickets/${ticketId}/status`, {
          action: "set_status",
          new_status: newStatus,
        });

        queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });

        toast.success("Ticket status updated");
      } catch (error) {
        queryClient.setQueryData(ticketKeys.list(currentFilters), previousData);

        console.error("Failed to update ticket status:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to update ticket status";
        toast.error(errorMessage);
      }
    },
    [tickets, filters, queryClient],
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading && !ticketResponse) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
        <Button onClick={() => router.push("/tickets/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Stats Strip */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-border">
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setStatusFilter("submitted");
              setEmergencyFilter("all");
            }}
          >
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{stats.submitted}</span>
            <span className="text-sm text-muted-foreground">Submitted</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setStatusFilter("in_progress");
              setEmergencyFilter("all");
            }}
          >
            <LayoutList className="h-4 w-4 text-blue-600" />
            <span className="font-semibold">{stats.inProgress}</span>
            <span className="text-sm text-muted-foreground">In Progress</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer"
            onClick={() => {
              setStatusFilter("completed");
              setEmergencyFilter("all");
            }}
          >
            <LayoutGrid className="h-4 w-4 text-green-600" />
            <span className="font-semibold">{stats.completed}</span>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-3 flex-1 min-w-[50%] md:min-w-0 hover:bg-accent transition-colors cursor-pointer ${
              stats.emergencyCount > 0 ? "bg-red-50" : ""
            }`}
            onClick={() => {
              setStatusFilter("all");
              setEmergencyFilter("emergency");
            }}
          >
            <AlertTriangle
              className={`h-4 w-4 ${
                stats.emergencyCount > 0
                  ? "text-red-500"
                  : "text-muted-foreground"
              }`}
            />
            <span
              className={`font-semibold ${
                stats.emergencyCount > 0 ? "text-red-600" : ""
              }`}
            >
              {stats.emergencyCount}
            </span>
            <span className="text-sm text-muted-foreground">Emergencies</span>
          </div>
        </div>
      </Card>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={emergencyFilter}
                onValueChange={setEmergencyFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="emergency">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      Emergencies Only
                    </span>
                  </SelectItem>
                  <SelectItem value="regular">Regular Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("kanban")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {view === "list" && (
        <TableLoadingOverlay isLoading={isFetching}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Assignee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500"
                    >
                      No tickets found
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/tickets/${ticket.id}`)}
                    >
                      <TableCell className="font-medium">
                        {ticket.ticket_number}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        <span className="flex items-center gap-2">
                          {ticket.is_emergency && (
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          )}
                          {ticket.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.location?.name || "N/A"}</TableCell>
                      <TableCell>
                        {format(new Date(ticket.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {ticket.assignee?.full_name || (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-4">
                <span className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, totalCount)} of {totalCount}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= totalCount}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TableLoadingOverlay>
      )}

      {/* Kanban View */}
      {view === "kanban" && (
        <TableLoadingOverlay isLoading={isFetching}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {(
                Object.entries(kanbanColumns) as [TicketStatus, Ticket[]][]
              ).map(([status, columnTickets]) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  count={columnTickets.length}
                >
                  {columnTickets.map((ticket, index) => (
                    <Draggable
                      key={ticket.id}
                      draggableId={ticket.id}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <KanbanCard
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          id={ticket.id}
                          ticketNumber={ticket.ticket_number}
                          title={ticket.title}
                          priority={
                            ticket.priority as
                              | "low"
                              | "medium"
                              | "high"
                              | "critical"
                          }
                          locationName={ticket.location?.name}
                          isEmergency={ticket.is_emergency}
                          isDragging={snapshot.isDragging}
                          onClick={() => router.push(`/tickets/${ticket.id}`)}
                        />
                      )}
                    </Draggable>
                  ))}
                </KanbanColumn>
              ))}
            </div>
          </DragDropContext>
        </TableLoadingOverlay>
      )}
    </div>
  );
}
