"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { EngagementDataPoint } from "../../types/dashboard.types";

interface EngagementChartProps {
  data: EngagementDataPoint[] | null;
  isLoading: boolean;
}

export function EngagementChart({ data, isLoading }: EngagementChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Engagement</CardTitle>
        <CardDescription className="text-sm">Likes and comments on your stories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 md:h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="likes"
                  fill="hsl(var(--primary))"
                  stroke="black"
                  strokeWidth={1}
                />
                <Bar
                  dataKey="comments"
                  fill="hsl(var(--secondary))"
                  stroke="black"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
