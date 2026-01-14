'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PriorityCount {
  priority: string;
  count: number;
}

interface PriorityBarChartProps {
  data: PriorityCount[];
  title?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

const PRIORITY_ORDER = ['low', 'medium', 'high', 'critical'];

export function PriorityBarChart({ data, title = 'Priority Distribution' }: PriorityBarChartProps) {
  // Sort data by priority order
  const sortedData = [...data].sort((a, b) => {
    return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
  });

  const chartData = sortedData.map((item) => ({
    priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    count: item.count,
    fill: PRIORITY_COLORS[item.priority] || '#94a3b8',
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="priority" className="text-xs text-muted-foreground" />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
