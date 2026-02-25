"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { budgetCategoryColors } from "@/theme/colors";
import type { SpendByCategory } from "@/dao/budget.dao";

interface SpendByCategoryChartProps {
  data?: SpendByCategory[];
  title?: string;
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SpendByCategoryChart({
  data,
  title = "Spend by Category",
  isLoading,
}: SpendByCategoryChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <Skeleton className="h-48 w-48 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).map((item) => ({
    name: item.category_name,
    value: item.spent,
  }));

  const totalSpend = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0 || totalSpend === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No spend data available
          </div>
        </CardContent>
      </Card>
    );
  }

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
              label={({
                name,
                percent,
              }: {
                name?: string;
                percent?: number;
              }) =>
                percent && percent > 0.05
                  ? `${name ?? ""}: ${(percent * 100).toFixed(0)}%`
                  : ""
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    budgetCategoryColors[index % budgetCategoryColors.length]
                  }
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
              formatter={(value: number | undefined) => [
                formatCurrency(value ?? 0),
                "Spent",
              ]}
            />
            <Legend
              formatter={(value) => (
                <span className="text-sm capitalize">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
