import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  FileText,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

type ApprovalStatus = 'pending' | 'approved' | 'denied'

interface CostApproval {
  id: string
  estimated_cost: number
  actual_cost?: number | null
  vendor_quote_path?: string | null
  requested_by: {
    id: string
    full_name: string
  }
  approved_by?: {
    id: string
    full_name: string
  } | null
  status: ApprovalStatus
  approved_at?: string | null
  denial_reason?: string | null
  notes?: string | null
  requested_at: string
}

interface ApprovalStatusProps {
  approval: CostApproval
  userRole: 'admin' | 'manager' | 'staff' | 'user'
  onApprove?: () => void | Promise<void>
  onDeny?: (reason: string) => void | Promise<void>
  loading?: boolean
}

const statusConfig: Record<
  ApprovalStatus,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    badgeClass: string
    cardClass: string
  }
> = {
  pending: {
    label: 'Pending Approval',
    icon: Clock,
    badgeClass: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
    cardClass: 'border-amber-200 bg-amber-50',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-green-100 text-green-800 hover:bg-green-100',
    cardClass: 'border-green-200 bg-green-50',
  },
  denied: {
    label: 'Denied',
    icon: XCircle,
    badgeClass: 'bg-red-100 text-red-800 hover:bg-red-100',
    cardClass: 'border-red-200 bg-red-50',
  },
}

export function ApprovalStatus({
  approval,
  userRole,
  onApprove,
  onDeny,
  loading = false,
}: ApprovalStatusProps) {
  const config = statusConfig[approval.status]
  const StatusIcon = config.icon

  const canApprove =
    approval.status === 'pending' && (userRole === 'manager' || userRole === 'admin')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Card className={cn('border-2', config.cardClass)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Cost Approval
          </CardTitle>
          <Badge className={config.badgeClass}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cost Information */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-gray-700">Estimated Cost</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(approval.estimated_cost)}
            </p>
          </div>

          {approval.actual_cost !== null && approval.actual_cost !== undefined && (
            <div>
              <p className="text-sm font-medium text-gray-700">Actual Cost</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {formatCurrency(approval.actual_cost)}
              </p>
            </div>
          )}
        </div>

        {/* Requester Info */}
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">
            Requested by <span className="font-medium">{approval.requested_by.full_name}</span>
          </span>
        </div>

        {/* Request Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-gray-700">
            {format(new Date(approval.requested_at), 'MMM d, yyyy h:mm a')}
          </span>
        </div>

        {/* Notes */}
        {approval.notes && (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              Cost Details
            </div>
            <p className="rounded-md bg-white p-3 text-sm text-gray-700">{approval.notes}</p>
          </div>
        )}

        {/* Vendor Quote */}
        {approval.vendor_quote_path && (
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Vendor Quote</p>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-4 w-4" />
              View Quote
            </Button>
          </div>
        )}

        {/* Approval/Denial Info */}
        {approval.status === 'approved' && approval.approved_by && (
          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Approved by {approval.approved_by.full_name}</span>
              {approval.approved_at && (
                <span className="text-green-700">
                  {' '}
                  on {format(new Date(approval.approved_at), 'MMM d, yyyy')}
                </span>
              )}
            </p>
          </div>
        )}

        {approval.status === 'denied' && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3">
            <p className="text-sm font-medium text-red-800">Denial Reason:</p>
            <p className="mt-1 text-sm text-red-700">
              {approval.denial_reason || 'No reason provided'}
            </p>
            {approval.approved_by && (
              <p className="mt-2 text-xs text-red-600">
                Denied by {approval.approved_by.full_name}
                {approval.approved_at &&
                  ` on ${format(new Date(approval.approved_at), 'MMM d, yyyy')}`}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {canApprove && onApprove && onDeny && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onApprove}
              disabled={loading}
              className="flex-1 gap-2"
              variant="default"
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve
            </Button>
            <Button
              onClick={() => {
                const reason = prompt('Please provide a reason for denial:')
                if (reason) {
                  onDeny(reason)
                }
              }}
              disabled={loading}
              className="flex-1 gap-2"
              variant="destructive"
            >
              <XCircle className="h-4 w-4" />
              Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
