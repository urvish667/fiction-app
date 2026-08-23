"use client";

import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudioUrl } from "@/lib/utils";
import { formatStatNumber } from "@/utils/number-utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DashboardStory } from "../../types/dashboard.types";

interface TopStoriesTableProps {
  stories: DashboardStory[] | null;
  isLoading: boolean;
}

export function TopStoriesTable({ stories, isLoading }: TopStoriesTableProps) {
  const isMobile = useIsMobile();

  return (
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
        ) : !stories || stories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <p>You don&apos;t have any stories yet.</p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
              <a href={getStudioUrl()} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Create in Studio</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {stories.map((story) => (
              <div key={story.id} className="border rounded-lg p-4 space-y-2">
                <div>
                  <Link href={`/story/${story.slug}`} className="font-medium hover:text-primary text-sm">
                    {story.title}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {story.genreName || "General"}
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
                {stories.map((story) => (
                  <tr key={story.id} className="border-b">
                    <td className="py-3 px-2">
                      <Link href={`/story/${story.slug}`} className="font-medium hover:text-primary">
                        {story.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {story.genreName || "General"}
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
  );
}
