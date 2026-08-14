"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import StoryCard, { type StoryCardData } from "@/components/story-card";
import StoryCardSkeleton from "@/components/story-card-skeleton";
import { logError } from "@/lib/error-logger";
import { RecommendationService } from "@/lib/api/recommendations";
import { ImageService } from "@/lib/api/images";

// Type for a recommended story
interface RecommendedStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  genre: string | null;
  tags: (string | { id: string; name: string })[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  chapterCount: number;
  similarityScore: number;
}

interface StoryRecommendationsProps {
  storyId: string;
  className?: string;
  limit?: number;
  excludeSameAuthor?: boolean;
}

export default function StoryRecommendations({
  storyId,
  className = "",
  limit = 5,
  excludeSameAuthor = false,
}: StoryRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [includesSameAuthor, setIncludesSameAuthor] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Fetch recommendations — single call, detect same-author client-side
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!storyId) return
      try {
        setLoading(true);
        setError(null);
        setIncludesSameAuthor(false);

        const response = await RecommendationService.getRecommendations(storyId, {
          limit,
          excludeSameAuthor: false, // fetch all; filter/detect client-side
        });

        if (response.success && response.data && response.data.length > 0) {
          setRecommendations(response.data);
          // If the caller wanted same-author excluded, flag it so the UI can show the note
          if (excludeSameAuthor) {
            const hasStrictResults = response.data.some(r => r.similarityScore > 0)
            setIncludesSameAuthor(!hasStrictResults)
          }
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        logError(err, { context: "Error fetching recommendations", storyId })
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [storyId, limit, excludeSameAuthor]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile);
        // Reset to first page when switching between mobile and desktop
        setCurrentIndex(0);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  // Get cards per page based on screen size
  const getCardsPerPage = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 1024) return 3;
      return 4;
    }
    return isMobile ? 2 : 4;
  };

  // Navigation functions
  const handlePrevious = () => {
    const cardsPerPage = getCardsPerPage();
    const newIndex = Math.max(0, currentIndex - cardsPerPage);
    setCurrentIndex(newIndex);
  };

  const handleNext = () => {
    const cardsPerPage = getCardsPerPage();
    const newIndex = Math.min(recommendations.length - 1, currentIndex + cardsPerPage);
    setCurrentIndex(newIndex);
  };

  // Calculate the current page
  const getCurrentPage = () => {
    const cardsPerPage = getCardsPerPage();
    return Math.floor(currentIndex / cardsPerPage);
  };

  // Calculate total number of pages
  const getTotalPages = () => {
    const cardsPerPage = getCardsPerPage();
    return Math.ceil(recommendations.length / cardsPerPage);
  };

  // If there's an error, show a message instead of returning null
  if (!loading && error) {
    return (
      <div className={`my-8 ${className}`}>
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">Unable to load recommendations.</p>
          <p className="text-sm text-muted-foreground mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-8 ${className}`}>
      {!loading && recommendations.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No recommendations found for this story yet.</p>
          <p className="text-sm text-muted-foreground mt-2">Check back later for similar stories.</p>
        </div>
      ) : loading ? (
        // Loading skeleton matching 2:3 portrait grid cards
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <StoryCardSkeleton key={i} variant="portrait-grid" />
          ))}
        </div>
      ) : (
        // Recommendations carousel
        <div className="relative">
          {/* Navigation buttons */}
          {recommendations.length > getCardsPerPage() && (
            <>
              <Button
                variant="outline"
                size="icon"
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-background/90 backdrop-blur-sm shadow-md"
                onClick={handleNext}
                disabled={currentIndex >= recommendations.length - getCardsPerPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Carousel */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
              >
                {/* Display current page of recommendations */}
                {(() => {
                  const cardsPerPage = getCardsPerPage();
                  const visibleCards = [];

                  // Display cards for current page
                  for (let i = 0; i < cardsPerPage; i++) {
                    const index = currentIndex + i;
                    if (index < recommendations.length) {
                      visibleCards.push(
                        <RecommendationCard
                          key={recommendations[index].id || index}
                          story={recommendations[index]}
                        />
                      );
                    }
                  }

                  return visibleCards;
                })()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Pagination dots */}
          {recommendations.length > 1 && (
            <div className="flex flex-col items-center mt-4 gap-2">
              <div className="flex justify-center gap-1">
                {Array.from({ length: getTotalPages() }).map((_, pageIndex) => {
                  const cardsPerPage = getCardsPerPage();
                  const isCurrentPage = getCurrentPage() === pageIndex;

                  return (
                    <button
                      key={pageIndex}
                      className={`h-2 w-2 rounded-full ${
                        isCurrentPage ? "bg-primary" : "bg-muted"
                      }`}
                      onClick={() => setCurrentIndex(pageIndex * cardsPerPage)}
                      aria-label={`Go to page ${pageIndex + 1}`}
                    />
                  );
                })}
              </div>

              {/* Note when recommendations include stories from the same author */}
              {includesSameAuthor && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing stories from the same author due to limited recommendations
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Recommendation card component using the shared StoryCard
function RecommendationCard({ story }: { story: RecommendedStory }) {
  const coverImageUrl = ImageService.getImageUrl(story.coverImage);

  const cardData: StoryCardData = {
    id: story.id,
    title: story.title,
    slug: story.slug,
    author: story.author?.name || story.author?.username || "Unknown Author",
    genre: story.genre,
    coverImage: coverImageUrl || "/placeholder.svg",
    excerpt: story.description || "",
    likeCount: story.likeCount || 0,
    commentCount: story.commentCount || 0,
    chapterCount: story.chapterCount || 0,
    status: story.status,
  };

  return <StoryCard story={cardData} variant="portrait-grid" showBookmark={true} />;
}
