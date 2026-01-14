import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type TicketStatus =
  | 'submitted'
  | 'acknowledged'
  | 'needs_approval'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'rejected'
  | 'on_hold'

interface StatusBadgeProps {
  status: TicketStatus
  className?: string
}

const statusConfig: Record<
  TicketStatus,
  {
    label: string
    variant: 'default' | 'secondary' | 'destructive' | 'outline'
    className: string
  }
> = {
  submitted: {
    label: 'Submitted',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  },
  acknowledged: {
    label: 'Acknowledged',
    variant: 'secondary',
    className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
  },
  needs_approval: {
    label: 'Needs Approval',
    variant: 'outline',
    className: 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100',
  },
  approved: {
    label: 'Approved',
    variant: 'secondary',
    className: 'bg-teal-100 text-teal-800 hover:bg-teal-100',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'default',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  },
  completed: {
    label: 'Completed',
    variant: 'secondary',
    className: 'bg-green-100 text-green-800 hover:bg-green-100',
  },
  verified: {
    label: 'Verified',
    variant: 'secondary',
    className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  },
  closed: {
    label: 'Closed',
    variant: 'outline',
    className: 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-100',
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'bg-red-100 text-red-800 hover:bg-red-100',
  },
  on_hold: {
    label: 'On Hold',
    variant: 'outline',
    className: 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  )
}
