import { priorityColors } from '@/theme/colors'
import { cn } from '@/lib/utils'

type Priority = 'low' | 'medium' | 'high' | 'critical'

interface PriorityIndicatorProps {
  priority: Priority
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
}

const labelSizeClasses = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
}

export function PriorityIndicator({
  priority,
  showLabel = false,
  size = 'md',
  className,
}: PriorityIndicatorProps) {
  const config = priorityColors[priority]
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)

  if (showLabel) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium',
          labelSizeClasses[size],
          className
        )}
        style={{
          backgroundColor: config.bg,
          color: config.text,
        }}
      >
        <span
          className={cn('rounded-full flex-shrink-0', sizeClasses[size])}
          style={{ backgroundColor: config.dot }}
        />
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn('rounded-full flex-shrink-0', sizeClasses[size], className)}
      style={{ backgroundColor: config.dot }}
      title={`${label} priority`}
    />
  )
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  return <PriorityIndicator priority={priority} showLabel size="md" className={className} />
}
