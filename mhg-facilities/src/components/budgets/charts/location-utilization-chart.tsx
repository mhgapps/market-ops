'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { budgetUtilizationColors } from '@/theme/colors'
import type { LocationUtilization } from '@/hooks/use-budgets'

interface LocationUtilizationChartProps {
  data?: LocationUtilization[]
  title?: string
  isLoading?: boolean
}

function getBarColor(utilization: number): string {
  if (utilization >= 100) return budgetUtilizationColors.over.bar
  if (utilization >= 90) return budgetUtilizationColors.danger.bar
  if (utilization >= 80) return budgetUtilizationColors.warning.bar
  return budgetUtilizationColors.healthy.bar
}

export function LocationUtilizationChart({
  data,
  title = 'Utilization by Location',
  isLoading,
}: LocationUtilizationChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = (data || []).map((item) => ({
    name: item.location_name,
    utilization: item.utilization_percentage,
    budget: item.budget,
    spent: item.spent,
  }))

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No location data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              domain={[0, (dataMax: number) => Math.max(100, dataMax * 1.1)]}
              tickFormatter={(value) => `${value}%`}
              className="text-xs text-muted-foreground"
            />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number | undefined, _name: string | undefined, props: { payload?: { budget?: number; spent?: number } }) => {
                const payload = props.payload
                const val = value ?? 0
                return [
                  `${val.toFixed(1)}% (${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(payload?.spent || 0)} / ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                  }).format(payload?.budget || 0)})`,
                  'Utilization',
                ]
              }}
            />
            {/* Reference lines for thresholds */}
            <ReferenceLine
              x={80}
              stroke={budgetUtilizationColors.warning.bar}
              strokeDasharray="3 3"
              label={{ value: '80%', position: 'top', fontSize: 10 }}
            />
            <ReferenceLine
              x={100}
              stroke={budgetUtilizationColors.over.bar}
              strokeDasharray="3 3"
              label={{ value: '100%', position: 'top', fontSize: 10 }}
            />
            <Bar dataKey="utilization" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.utilization)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
