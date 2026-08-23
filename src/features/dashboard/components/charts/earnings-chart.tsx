"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { EarningsDataPoint } from "../../types/dashboard.types";

interface EarningsChartProps {
  data: EarningsDataPoint[] | null;
  isLoading: boolean;
}

export function EarningsChart({ data, isLoading }: EarningsChartProps) {
  return (
    <Card className="mb-6 md:mb-8">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Earnings Over Time</CardTitle>
        <CardDescription className="text-sm">Your earnings for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="hsl(var(--primary))"
                  dot={{ fill: "black", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  activeDot={{ fill: "black", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
