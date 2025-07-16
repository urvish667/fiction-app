"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, Heart, MessageSquare, Users, DollarSign, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { StatsCard } from "@/components/dashboard/stats-card"
import { useDashboardStats } from "@/hooks/use-dashboard-stats"
import { useDashboardStories } from "@/hooks/use-dashboard-stories"
import { useReadsChartData, useEngagementChartData } from "@/hooks/use-chart-data"
import { formatStatNumber } from "@/utils/number-utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface OverviewTabProps {
  timeRange: string;
}

export function OverviewTab({ timeRange }: OverviewTabProps) {
  const isMobile = useIsMobile();

  // Fetch stats data
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError
  } = useDashboardStats(timeRange);

  // Fetch stories data
  const {
    data: storiesData,
    isLoading: storiesLoading,
    error: storiesError
  } = useDashboardStories(5, 'reads', timeRange);

  // Fetch chart data
  const {
    data: readsData,
    isLoading: readsLoading,
    error: readsError
  } = useReadsChartData(timeRange);

  const {
    data: engagementData,
    isLoading: engagementLoading,
    error: engagementError
  } = useEngagementChartData(timeRange);

  // Combine loading states
  const isLoading = statsLoading || storiesLoading || readsLoading || engagementLoading;

  // Combine error states
  const error = statsError || storiesError || readsError || engagementError;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {error && process.env.NODE_ENV === 'production' && (
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
          // Loading skeletons for stats cards
          <>
            {Array.from({ length: 5 }).map((_, i) => (
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
            ))}
          </>
        ) : (
          <>
            {statsData && (
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
            )}
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
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
                  <LineChart data={readsData || []}>
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
                  <BarChart data={engagementData || []}>
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
      </div>

      {/* Top Performing Stories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Stories</CardTitle>
          <CardDescription>Your most popular stories based on reads</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !storiesData || storiesData.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>You don't have any stories yet.</p>
              <Button asChild className="mt-4">
                <Link href="/write/story-info">
                  Create your first story
                </Link>
              </Button>
            </div>
          ) : isMobile ? (
            // Mobile card layout
            <div className="space-y-3">
              {storiesData.map((story) => (
                <div key={story.id} className="border rounded-lg p-4 space-y-2">
                  <div>
                    <Link href={`/story/${story.slug}`} className="font-medium hover:text-primary text-sm">
                      {story.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {story.genreName || 'General'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reads:</span>
                      <span className="font-medium">{formatStatNumber(story.reads || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Likes:</span>
                      <span className="font-medium">{formatStatNumber(story.likes || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comments:</span>
                      <span className="font-medium">{formatStatNumber(story.comments || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Earnings:</span>
                      <span className="font-medium">${formatStatNumber(story.earnings || 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop table layout
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Story</th>
                    <th className="text-right py-3 px-2">Reads</th>
                    <th className="text-right py-3 px-2">Likes</th>
                    <th className="text-right py-3 px-2">Comments</th>
                    <th className="text-right py-3 px-2">Earnings</th>
                  </tr>
                </thead>
                <tbody>
                  {storiesData.map((story) => (
                    <tr key={story.id} className="border-b">
                      <td className="py-3 px-2">
                        <Link href={`/story/${story.slug}`} className="font-medium hover:text-primary">
                          {story.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {story.genreName || 'General'}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">{formatStatNumber(story.reads || 0)}</td>
                      <td className="text-right py-3 px-2">{formatStatNumber(story.likes || 0)}</td>
                      <td className="text-right py-3 px-2">{formatStatNumber(story.comments || 0)}</td>
                      <td className="text-right py-3 px-2">${formatStatNumber(story.earnings || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
