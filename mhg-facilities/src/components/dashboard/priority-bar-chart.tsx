"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriorityCount {
  priority: string;
  count: number;
}

interface PriorityBarChartProps {
  data: PriorityCount[];
  title?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--chart-2)",
  medium: "var(--chart-4)",
  high: "var(--chart-5)",
  critical: "var(--destructive)",
};

const PRIORITY_ORDER = ["low", "medium", "high", "critical"];

export function PriorityBarChart({
  data,
  title = "Priority Distribution",
}: PriorityBarChartProps) {
  // Sort data by priority order
  const sortedData = [...data].sort((a, b) => {
    return (
      PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
    );
  });

  const chartData = sortedData.map((item) => ({
    priority: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    count: item.count,
    fill: PRIORITY_COLORS[item.priority] || "var(--muted-foreground)",
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
            <XAxis
              dataKey="priority"
              className="text-xs text-muted-foreground"
            />
            <YAxis className="text-xs text-muted-foreground" />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
            />
            <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
