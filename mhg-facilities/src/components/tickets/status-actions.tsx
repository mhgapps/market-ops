import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  PlayCircle,
  CheckCheck,
  Shield,
  XCircle,
  Pause,
  Play,
  Lock,
} from 'lucide-react'
import type { TicketStatus } from './status-badge'

interface StatusActionsProps {
  ticketId: string
  currentStatus: TicketStatus
  userRole: 'admin' | 'manager' | 'staff' | 'user'
  isAssigned: boolean
  onAction: (action: string) => void | Promise<void>
  loading?: boolean
}

interface ActionButton {
  action: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  variant: 'default' | 'outline' | 'destructive' | 'secondary'
  requiresAssignment?: boolean
}

// Define which actions are available for each status and role
const statusActions: Record<
  TicketStatus,
  {
    staff: ActionButton[]
    manager: ActionButton[]
    admin: ActionButton[]
    user: ActionButton[]
  }
> = {
  submitted: {
    staff: [
      {
        action: 'acknowledge',
        label: 'Acknowledge',
        icon: CheckCircle2,
        variant: 'default',
      },
      {
        action: 'reject',
        label: 'Reject',
        icon: XCircle,
        variant: 'destructive',
      },
    ],
    manager: [
      {
        action: 'acknowledge',
        label: 'Acknowledge',
        icon: CheckCircle2,
        variant: 'default',
      },
      {
        action: 'reject',
        label: 'Reject',
        icon: XCircle,
        variant: 'destructive',
      },
    ],
    admin: [
      {
        action: 'acknowledge',
        label: 'Acknowledge',
        icon: CheckCircle2,
        variant: 'default',
      },
      {
        action: 'reject',
        label: 'Reject',
        icon: XCircle,
        variant: 'destructive',
      },
    ],
    user: [],
  },
  acknowledged: {
    staff: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
        requiresAssignment: true,
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    manager: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    admin: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    user: [],
  },
  needs_approval: {
    staff: [],
    manager: [
      {
        action: 'approve',
        label: 'Approve',
        icon: CheckCircle2,
        variant: 'default',
      },
      {
        action: 'reject',
        label: 'Reject',
        icon: XCircle,
        variant: 'destructive',
      },
    ],
    admin: [
      {
        action: 'approve',
        label: 'Approve',
        icon: CheckCircle2,
        variant: 'default',
      },
      {
        action: 'reject',
        label: 'Reject',
        icon: XCircle,
        variant: 'destructive',
      },
    ],
    user: [],
  },
  approved: {
    staff: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
        requiresAssignment: true,
      },
    ],
    manager: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
      },
    ],
    admin: [
      {
        action: 'start_work',
        label: 'Start Work',
        icon: PlayCircle,
        variant: 'default',
      },
    ],
    user: [],
  },
  in_progress: {
    staff: [
      {
        action: 'complete',
        label: 'Mark Complete',
        icon: CheckCheck,
        variant: 'default',
        requiresAssignment: true,
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    manager: [
      {
        action: 'complete',
        label: 'Mark Complete',
        icon: CheckCheck,
        variant: 'default',
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    admin: [
      {
        action: 'complete',
        label: 'Mark Complete',
        icon: CheckCheck,
        variant: 'default',
      },
      {
        action: 'hold',
        label: 'Put On Hold',
        icon: Pause,
        variant: 'outline',
      },
    ],
    user: [],
  },
  completed: {
    staff: [],
    manager: [
      {
        action: 'verify',
        label: 'Verify',
        icon: Shield,
        variant: 'default',
      },
    ],
    admin: [
      {
        action: 'verify',
        label: 'Verify',
        icon: Shield,
        variant: 'default',
      },
    ],
    user: [
      {
        action: 'verify',
        label: 'Verify',
        icon: Shield,
        variant: 'default',
      },
    ],
  },
  verified: {
    staff: [],
    manager: [
      {
        action: 'close',
        label: 'Close Ticket',
        icon: Lock,
        variant: 'outline',
      },
    ],
    admin: [
      {
        action: 'close',
        label: 'Close Ticket',
        icon: Lock,
        variant: 'outline',
      },
    ],
    user: [],
  },
  closed: {
    staff: [],
    manager: [],
    admin: [],
    user: [],
  },
  rejected: {
    staff: [],
    manager: [],
    admin: [],
    user: [],
  },
  on_hold: {
    staff: [
      {
        action: 'resume',
        label: 'Resume Work',
        icon: Play,
        variant: 'default',
        requiresAssignment: true,
      },
    ],
    manager: [
      {
        action: 'resume',
        label: 'Resume Work',
        icon: Play,
        variant: 'default',
      },
    ],
    admin: [
      {
        action: 'resume',
        label: 'Resume Work',
        icon: Play,
        variant: 'default',
      },
    ],
    user: [],
  },
}

export function StatusActions({
  ticketId,
  currentStatus,
  userRole,
  isAssigned,
  onAction,
  loading = false,
}: StatusActionsProps) {
  const availableActions = statusActions[currentStatus][userRole] || []

  if (availableActions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableActions.map((action) => {
        const Icon = action.icon
        const isDisabled =
          loading || (action.requiresAssignment && !isAssigned && userRole === 'staff')

        return (
          <Button
            key={action.action}
            variant={action.variant}
            size="sm"
            onClick={() => onAction(action.action)}
            disabled={isDisabled}
            className="gap-2"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}
