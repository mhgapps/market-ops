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

interface LocationTicketCount {
  locationId: string;
  locationName: string;
  ticketCount: number;
}

interface LocationChartProps {
  data: LocationTicketCount[];
  title?: string;
}

export function LocationChart({
  data,
  title = "Tickets by Location",
}: LocationChartProps) {
  // Sort by ticket count descending and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.ticketCount - a.ticketCount)
    .slice(0, 10);

  const chartData = sortedData.map((item) => ({
    name: item.locationName,
    tickets: item.ticketCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 40)}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis type="number" className="text-xs text-muted-foreground" />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs text-muted-foreground"
              width={70}
              tickFormatter={(v: string) => v.length > 10 ? v.slice(0, 10) + "\u2026" : v}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
              }}
            />
            <Bar
              dataKey="tickets"
              fill="var(--primary)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
