'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { theme } from '@/theme/colors'
import type { YoYComparisonData } from '@/hooks/use-budgets'

interface YoYComparisonChartProps {
  data?: YoYComparisonData
  title?: string
  isLoading?: boolean
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toFixed(0)}`
}

export function YoYComparisonChart({
  data,
  title = 'Year-over-Year Comparison',
  isLoading,
}: YoYComparisonChartProps) {
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

  if (!data || data.categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No comparison data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const chartData = data.categories.map((item) => ({
    name: item.category,
    [data.previous_year]: item.previous_year_spent,
    [data.current_year]: item.current_year_spent,
    change: item.change_percentage,
  }))

  const totalChange = data.total_change_percentage
  const isIncreased = totalChange > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{title}</CardTitle>
        <Badge
          variant="outline"
          className={isIncreased ? 'text-red-600 border-red-200' : 'text-green-600 border-green-200'}
        >
          {isIncreased ? (
            <TrendingUp className="h-3 w-3 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 mr-1" />
          )}
          {isIncreased ? '+' : ''}{totalChange.toFixed(1)}% YoY
        </Badge>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-xs text-muted-foreground"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              className="text-xs text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
              formatter={(value: number | undefined, name: string | undefined) => [
                new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                }).format(value ?? 0),
                `FY ${name ?? ''}`,
              ]}
            />
            <Legend />
            <Bar
              dataKey={data.previous_year}
              name={`FY ${data.previous_year}`}
              fill={theme.secondary.light}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey={data.current_year}
              name={`FY ${data.current_year}`}
              fill={theme.primary.main}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">FY {data.previous_year} Total</p>
            <p className="text-lg font-semibold">{formatCurrency(data.total_previous)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">FY {data.current_year} Total</p>
            <p className="text-lg font-semibold">{formatCurrency(data.total_current)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
