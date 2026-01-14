'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatusCount {
  status: string;
  count: number;
}

interface StatusPieChartProps {
  data: StatusCount[];
  title?: string;
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'var(--primary)',
  acknowledged: 'var(--chart-1)',
  in_progress: 'var(--chart-4)',
  completed: 'var(--chart-2)',
  verified: 'var(--chart-2)',
  closed: 'var(--muted-foreground)',
  rejected: 'var(--destructive)',
  on_hold: 'var(--chart-5)',
  needs_approval: 'var(--chart-4)',
  approved: 'var(--chart-2)',
};

export function StatusPieChart({ data, title = 'Status Distribution' }: StatusPieChartProps) {
  const chartData = data.map((item) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={80}
              fill="var(--chart-3)"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const originalStatus = data[index].status;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[originalStatus] || 'var(--muted-foreground)'}
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
