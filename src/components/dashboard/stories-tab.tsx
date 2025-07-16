"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BookText, AlertCircle, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useUserStories } from "@/hooks/use-user-stories"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState, useMemo } from "react"

type SortKey = "title" | "status" | "reads" | "likes" | "comments" | "updatedAt";

interface StoriesTabProps {
  timeRange: string;
}

export function StoriesTab({ timeRange }: StoriesTabProps) {
  const { data: stories, isLoading, error } = useUserStories(timeRange);
  const isMobile = useIsMobile();
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortedStories = useMemo(() => {
    if (!stories) return [];
    return [...stories].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [stories, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  // Format date for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return "Unknown date";
    }

    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "Unknown date";
      }

      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return "Unknown date";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-xl md:text-2xl font-bold">Your Stories</h2>
        <div className="flex items-center gap-2">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/works">
              <BookText className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Manage All Stories</span>
              <span className="sm:hidden">Manage All</span>
            </Link>
          </Button>
        </div>
      </div>

      {error && (
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

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : !sortedStories || sortedStories.length === 0 ? (
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
              <div className="space-y-3 p-4">
                {sortedStories.map((story) => (
                  <div key={story.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <Link href={`/story/${story.slug || story.id}`} className="font-medium hover:text-primary text-sm">
                          {story.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1">
                          {story.genreName || story.genre || 'General'}
                        </div>
                      </div>
                      <Badge variant={story.status === "published" ? "default" : "outline"} className="ml-2 text-xs">
                        {story.status === "ongoing" ? "Ongoing" : story.status === "completed" ? "Completed" : story.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reads:</span>
                        <span className="font-medium">{(story.reads || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Likes:</span>
                        <span className="font-medium">{(story.likes || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Comments:</span>
                        <span className="font-medium">{(story.comments || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated:</span>
                        <span className="font-medium">{formatDate(story.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop table layout
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6 cursor-pointer" onClick={() => handleSort("title")}>
                      Story {sortKey === "title" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                    <th className="text-center py-4 px-4 cursor-pointer" onClick={() => handleSort("status")}>
                      Status {sortKey === "status" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                    <th className="text-right py-4 px-4 cursor-pointer" onClick={() => handleSort("reads")}>
                      Reads {sortKey === "reads" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                    <th className="text-right py-4 px-4 cursor-pointer" onClick={() => handleSort("likes")}>
                      Likes {sortKey === "likes" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                    <th className="text-right py-4 px-4 cursor-pointer" onClick={() => handleSort("comments")}>
                      Comments {sortKey === "comments" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                    <th className="text-right py-4 px-4 cursor-pointer" onClick={() => handleSort("updatedAt")}>
                      Last Updated {sortKey === "updatedAt" && (sortDirection === "asc" ? <ArrowUp className="inline h-4 w-4" /> : <ArrowDown className="inline h-4 w-4" />)}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedStories.map((story) => (
                    <tr key={story.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-6">
                        <Link href={`/story/${story.slug || story.id}`} className="font-medium hover:text-primary">
                          {story.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">{story.genreName || story.genre || 'General'}</div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <Badge variant={story.status === "published" ? "default" : "outline"}>
                          {story.status === "ongoing" ? "Ongoing" : story.status === "completed" ? "Completed" : story.status}
                        </Badge>
                      </td>
                      <td className="text-right py-4 px-4">{(story.reads || 0).toLocaleString()}</td>
                      <td className="text-right py-4 px-4">{(story.likes || 0).toLocaleString()}</td>
                      <td className="text-right py-4 px-4">{(story.comments || 0).toLocaleString()}</td>
                      <td className="text-right py-4 px-4">{formatDate(story.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
