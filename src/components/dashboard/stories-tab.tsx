"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BookText, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { useUserStories } from "@/hooks/use-user-stories"

export function StoriesTab() {
  const { data: stories, isLoading, error } = useUserStories();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Stories</h2>
        <Button asChild>
          <Link href="/works">
            <BookText className="h-4 w-4 mr-2" />
            Manage All Stories
          </Link>
        </Button>
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
            ) : !stories || stories.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p>You don't have any stories yet.</p>
                <Button asChild className="mt-4">
                  <Link href="/write/story-info">
                    Create your first story
                  </Link>
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-6">Story</th>
                    <th className="text-center py-4 px-4">Status</th>
                    <th className="text-right py-4 px-4">Reads</th>
                    <th className="text-right py-4 px-4">Likes</th>
                    <th className="text-right py-4 px-4">Comments</th>
                    <th className="text-right py-4 px-4">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {stories.map((story) => (
                    <tr key={story.id} className="border-b hover:bg-muted/50">
                      <td className="py-4 px-6">
                        <Link href={`/story/${story.id}`} className="font-medium hover:text-primary">
                          {story.title}
                        </Link>
                        <div className="text-xs text-muted-foreground">{story.genre}</div>
                      </td>
                      <td className="text-center py-4 px-4">
                        <Badge variant={story.status === "published" ? "default" : "outline"}>
                          {story.status === "ongoing" ? "Ongoing" : story.status === "completed" ? "Completed" : story.status}
                        </Badge>
                      </td>
                      <td className="text-right py-4 px-4">{story.reads.toLocaleString()}</td>
                      <td className="text-right py-4 px-4">{story.likes.toLocaleString()}</td>
                      <td className="text-right py-4 px-4">{story.comments.toLocaleString()}</td>
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
