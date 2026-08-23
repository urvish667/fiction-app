"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { StoryCard } from "@/features/story";

interface PublishedStoriesTabProps {
  stories: any[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  totalCount: number;
  onLoadMore: () => void;
}

export function PublishedStoriesTab({
  stories,
  isLoading,
  isLoadingMore,
  hasMore,
  totalCount,
  onLoadMore,
}: PublishedStoriesTabProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stories.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                variant="portrait-grid"
                showBookmark={false}
                overlayTitle={true}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={onLoadMore}
                disabled={isLoadingMore}
                size="lg"
                className="px-8"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading more stories...
                  </>
                ) : (
                  "Load More Stories"
                )}
              </Button>
            </div>
          )}

          {/* Show loaded count */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            Showing {stories.length} of {totalCount} stories
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No stories published yet</h3>
          <p className="text-muted-foreground">This user hasn&apos;t published any stories yet.</p>
        </div>
      )}
    </motion.div>
  );
}
