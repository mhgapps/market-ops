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
  submitted: '#3b82f6',
  acknowledged: '#8b5cf6',
  in_progress: '#eab308',
  completed: '#10b981',
  verified: '#06b6d4',
  closed: '#6b7280',
  rejected: '#ef4444',
  on_hold: '#f97316',
  needs_approval: '#f59e0b',
  approved: '#22c55e',
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
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => {
                const originalStatus = data[index].status;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[originalStatus] || '#94a3b8'}
                  />
                );
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
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
