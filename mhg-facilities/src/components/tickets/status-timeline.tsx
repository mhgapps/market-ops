import { Check, Circle, X, Pause, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import type { TicketStatus } from './status-badge'

interface StatusChange {
  id: string
  status: TicketStatus
  changed_at: string
  changed_by: {
    id: string
    full_name: string
  }
  notes?: string | null
}

interface StatusTimelineProps {
  statusHistory: StatusChange[]
  currentStatus: TicketStatus
  className?: string
}

const statusIcons: Record<TicketStatus, React.ComponentType<{ className?: string }>> = {
  submitted: Clock,
  in_progress: Circle,
  completed: Check,
  closed: Check,
  rejected: X,
  on_hold: Pause,
}

const statusColors: Record<TicketStatus, string> = {
  submitted: 'text-blue-600 bg-blue-100',
  in_progress: 'text-purple-600 bg-purple-100',
  completed: 'text-green-600 bg-green-100',
  closed: 'text-gray-600 bg-gray-100',
  rejected: 'text-red-600 bg-red-100',
  on_hold: 'text-orange-600 bg-orange-100',
}

const statusLabels: Record<TicketStatus, string> = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
  rejected: 'Rejected',
  on_hold: 'On Hold',
}

export function StatusTimeline({
  statusHistory,
  currentStatus,
  className,
}: StatusTimelineProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-sm font-medium text-gray-900">Status History</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {statusHistory.map((change, changeIdx) => {
            const Icon = statusIcons[change.status]
            const isLast = changeIdx === statusHistory.length - 1
            const isCurrent = change.status === currentStatus

            return (
              <li key={change.id}>
                <div className="relative pb-8">
                  {!isLast && (
                    <span
                      className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white',
                          statusColors[change.status]
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p
                          className={cn(
                            'text-sm',
                            isCurrent ? 'font-semibold text-gray-900' : 'text-gray-700'
                          )}
                        >
                          {statusLabels[change.status]}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          by {change.changed_by.full_name}
                        </p>
                        {change.notes && (
                          <p className="mt-1 text-xs text-gray-600">{change.notes}</p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-xs text-gray-500">
                        <time dateTime={change.changed_at}>
                          {format(new Date(change.changed_at), 'MMM d, yyyy')}
                        </time>
                        <br />
                        <time dateTime={change.changed_at}>
                          {format(new Date(change.changed_at), 'h:mm a')}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
