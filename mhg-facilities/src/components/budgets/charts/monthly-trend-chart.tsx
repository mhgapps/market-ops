"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { theme, budgetUtilizationColors } from "@/theme/colors";
import type { MonthlyTrendData } from "@/hooks/use-budgets";

interface MonthlyTrendChartProps {
  data?: MonthlyTrendData[];
  title?: string;
  isLoading?: boolean;
  totalBudget?: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

export function MonthlyTrendChart({
  data,
  title = "Monthly Spend Trend",
  isLoading,
  totalBudget,
}: MonthlyTrendChartProps) {
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
    );
  }

  const chartData = (data || []).map((item) => ({
    month: MONTHS[item.month - 1],
    spent: item.spent,
    cumulative: item.cumulative_spend,
    budgetPace: item.budget_pace,
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No trend data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate monthly budget pace for reference line
  const monthlyBudgetPace = totalBudget ? totalBudget / 12 : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs text-muted-foreground" />
            <YAxis
              className="text-xs text-muted-foreground"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
              formatter={(
                value: number | undefined,
                name: string | undefined,
              ) => [
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 0,
                }).format(value ?? 0),
                name === "spent" ? "Monthly Spend" : "Cumulative",
              ]}
            />
            {/* Monthly budget pace reference */}
            {monthlyBudgetPace && (
              <ReferenceLine
                y={monthlyBudgetPace}
                stroke={budgetUtilizationColors.warning.bar}
                strokeDasharray="5 5"
                label={{
                  value: "Monthly Avg",
                  position: "right",
                  fontSize: 10,
                  fill: budgetUtilizationColors.warning.bar,
                }}
              />
            )}
            {/* Monthly spend line */}
            <Line
              type="monotone"
              dataKey="spent"
              stroke={theme.primary.main}
              strokeWidth={2}
              dot={{ fill: theme.primary.main, r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Cumulative spend line */}
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke={theme.secondary.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: theme.primary.main }}
            />
            <span className="text-muted-foreground">Monthly Spend</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-0.5"
              style={{
                backgroundColor: theme.secondary.main,
                borderStyle: "dashed",
              }}
            />
            <span className="text-muted-foreground">Cumulative</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
