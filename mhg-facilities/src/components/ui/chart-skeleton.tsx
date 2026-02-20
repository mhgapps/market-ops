import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartSkeletonProps {
  title?: string
  height?: number
  variant?: 'line' | 'bar' | 'pie' | 'horizontal-bar'
}

export function ChartSkeleton({
  title = 'Loading...',
  height = 300,
  variant = 'line',
}: ChartSkeletonProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {variant === 'pie' ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        ) : variant === 'horizontal-bar' ? (
          <div className="space-y-3" style={{ height }}>
            {[80, 65, 50, 40, 30].map((width, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <Skeleton className="w-full" style={{ height }} />
        )}
      </CardContent>
    </Card>
  )
}

// Simple skeleton without card wrapper for inline use
export function ChartSkeletonInline({
  height = 300,
  variant = 'line',
}: Omit<ChartSkeletonProps, 'title'>) {
  if (variant === 'pie') {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>
    )
  }

  if (variant === 'horizontal-bar') {
    return (
      <div className="space-y-3" style={{ height }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 flex-1" style={{ width: `${70 - i * 10}%` }} />
          </div>
        ))}
      </div>
    )
  }

  return <Skeleton className="w-full" style={{ height }} />
}
