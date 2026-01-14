'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTickets } from '@/hooks/use-tickets'
import { useTicketRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'
import api from '@/lib/api-client'
import type { Database } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/tickets/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, LayoutList, LayoutGrid, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

export default function TicketsPage() {
  const router = useRouter()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Enable realtime updates for tickets
  useTicketRealtime()

  const filters = {
    ...(statusFilter !== 'all' && { status: statusFilter }),
    ...(priorityFilter !== 'all' && { priority: priorityFilter }),
  }

  const { data: tickets = [], isLoading } = useTickets(filters)


  type TicketWithRelations = Database['public']['Tables']['tickets']['Row'] & {
    location?: { name: string } | null
    category?: { name: string } | null
    assignee?: { full_name: string } | null
  }

  // Filter tickets by search query
  const filteredTickets = (tickets as unknown as TicketWithRelations[]).filter((ticket) =>
    ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticket_number.toString().includes(searchQuery.toLowerCase())
  )

  // Group tickets by status for Kanban view
  const kanbanColumns = {
    submitted: filteredTickets.filter((t) => t.status === 'submitted'),
    acknowledged: filteredTickets.filter((t) => t.status === 'acknowledged'),
    in_progress: filteredTickets.filter((t) => t.status === 'in_progress'),
    completed: filteredTickets.filter((t) => t.status === 'completed'),
    closed: filteredTickets.filter((t) => t.status === 'closed'),
  }

  const handleDragEnd = async (result: { destination?: { droppableId: string } | null; draggableId: string }) => {
    // If dropped outside a droppable area, do nothing
    if (!result.destination) {
      return
    }

    const ticketId = result.draggableId
    const newStatus = result.destination.droppableId

    // If status didn't change, do nothing
    const ticket = filteredTickets.find((t) => t.id === ticketId)
    if (!ticket || ticket.status === newStatus) {
      return
    }

    // Optimistically update UI (handled by realtime subscription)
    try {
      // Update ticket status via API
      await api.patch(`/api/tickets/${ticketId}/status`, {
        action: 'change_status',
        new_status: newStatus,
      })

      toast.success('Ticket status updated')
    } catch (error) {
      console.error('Failed to update ticket status:', error)
      toast.error('Failed to update ticket status')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="mt-1 text-gray-600">
            Manage maintenance and facilities requests
          </p>
        </div>
        <Button onClick={() => router.push('/tickets/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

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
                  <SelectItem value="acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
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
            </div>

            <div className="flex gap-2">
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'kanban' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List View */}
      {view === 'list' && (
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
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No tickets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => router.push(`/tickets/${ticket.id}`)}
                  >
                    <TableCell className="font-medium">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {ticket.title}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.location?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
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
        </Card>
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Object.entries(kanbanColumns).map(([status, tickets]: [string, TicketWithRelations[]]) => (
              <Card key={status} className="flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                    <Badge variant="secondary">{tickets.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <CardContent
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 space-y-2 ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : ''
                      }`}
                    >
                      {tickets.map((ticket, index) => (
                        <Draggable
                          key={ticket.id}
                          draggableId={ticket.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`cursor-pointer transition-shadow hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                              onClick={() => router.push(`/tickets/${ticket.id}`)}
                            >
                              <CardContent className="p-3">
                                <p className="text-xs font-medium text-gray-500">
                                  {ticket.ticket_number}
                                </p>
                                <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
                                  {ticket.title}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge
                                    className={getPriorityColor(ticket.priority)}
                                    variant="secondary"
                                  >
                                    {ticket.priority}
                                  </Badge>
                                </div>
                                {ticket.assignee && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    {ticket.assignee.full_name}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {tickets.length === 0 && (
                        <p className="py-4 text-center text-sm text-gray-400">
                          No tickets
                        </p>
                      )}
                    </CardContent>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  )
}
