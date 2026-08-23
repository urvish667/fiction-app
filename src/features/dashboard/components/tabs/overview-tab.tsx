"use client";

import { motion } from "framer-motion";
import { BookOpen, Heart, MessageSquare, Users, DollarSign, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatStatNumber } from "@/utils/number-utils";

import { StatsCard } from "../stats-card";
import { ReadsChart } from "../charts/reads-chart";
import { EngagementChart } from "../charts/engagement-chart";
import { TopStoriesTable } from "../overview/top-stories-table";
import { useDashboardStats } from "../../hooks/use-dashboard-stats";
import { useDashboardStories } from "../../hooks/use-dashboard-stories";
import { useReadsChartData, useEngagementChartData } from "../../hooks/use-chart-data";

interface OverviewTabProps {
  timeRange: string;
}

export function OverviewTab({ timeRange }: OverviewTabProps) {
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats(timeRange);

  const {
    data: storiesData,
    isLoading: storiesLoading,
    error: storiesError,
  } = useDashboardStories(5, "reads", timeRange);

  const {
    data: readsData,
    isLoading: readsLoading,
    error: readsError,
  } = useReadsChartData(timeRange);

  const {
    data: engagementData,
    isLoading: engagementLoading,
    error: engagementError,
  } = useEngagementChartData(timeRange);

  const isLoading = statsLoading || storiesLoading || readsLoading || engagementLoading;
  const error = statsError || storiesError || readsError || engagementError;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {error && process.env.NODE_ENV === "production" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 mb-6 md:mb-8">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsData && (
            <>
              <StatsCard
                title="Total Reads"
                value={formatStatNumber(statsData.totalReads)}
                change={statsData.readsChange}
                icon={<BookOpen className="h-4 w-4" />}
              />
              <StatsCard
                title="Total Likes"
                value={formatStatNumber(statsData.totalLikes)}
                change={statsData.likesChange}
                icon={<Heart className="h-4 w-4" />}
              />
              <StatsCard
                title="Comments"
                value={formatStatNumber(statsData.totalComments)}
                change={statsData.commentsChange}
                icon={<MessageSquare className="h-4 w-4" />}
              />
              <StatsCard
                title="Followers"
                value={formatStatNumber(statsData.totalFollowers)}
                change={statsData.followersChange}
                icon={<Users className="h-4 w-4" />}
              />
              <StatsCard
                title="Earnings"
                value={`$${formatStatNumber(statsData.totalEarnings)}`}
                change={statsData.earningsChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
            </>
          )
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <ReadsChart data={readsData} isLoading={isLoading} />
        <EngagementChart data={engagementData} isLoading={isLoading} />
      </div>

      {/* Top Performing Stories */}
      <TopStoriesTable stories={storiesData} isLoading={isLoading} />
    </motion.div>
  );
}
