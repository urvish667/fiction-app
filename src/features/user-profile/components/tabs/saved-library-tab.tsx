"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { StoryCard } from "@/features/story";

interface SavedLibraryTabProps {
  savedStories: any[];
  isLoading: boolean;
}

export function SavedLibraryTab({ savedStories, isLoading }: SavedLibraryTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : savedStories.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {savedStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              variant="portrait-grid"
              showBookmark={false}
              overlayTitle={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">No saved stories</h3>
          <p className="text-muted-foreground">
            This user hasn&apos;t saved any stories to their library.
          </p>
        </div>
      )}
    </motion.div>
  );
}
