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
import type { ReadsDataPoint } from "../../types/dashboard.types";

interface ReadsChartProps {
  data: ReadsDataPoint[] | null;
  isLoading: boolean;
}

export function ReadsChart({ data, isLoading }: ReadsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Reads Over Time</CardTitle>
        <CardDescription className="text-sm">Total story views for the selected period</CardDescription>
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
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="reads"
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
