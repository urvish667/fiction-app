"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface LibraryEmptyStateProps {
  hasFilters: boolean;
}

export function LibraryEmptyState({ hasFilters }: LibraryEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-12 bg-muted/30 rounded-lg"
    >
      <h3 className="text-xl font-semibold mb-2">No stories found</h3>
      <p className="text-muted-foreground mb-6">
        {hasFilters
          ? "Try adjusting your search or filters."
          : "Your library is empty. Start browsing and save stories to read later!"}
      </p>
      <Button asChild>
        <Link href="/browse">Browse Stories</Link>
      </Button>
    </motion.div>
  );
}
