"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { logError } from "@/lib/error-logger";

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
  tags: string[];
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

  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        setIncludesSameAuthor(false); // Reset this flag when fetching new recommendations

        // First try with excludeSameAuthor as specified
        const url = `/api/recommendations/${storyId}?limit=${limit}&excludeSameAuthor=${excludeSameAuthor}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`);
        }

        const data = await response.json();

        // If we got recommendations, use them
        if (data.length > 0) {
          setRecommendations(data);
        }
        // If we got no recommendations and we were excluding same author, try again including same author
        else if (excludeSameAuthor) {

          // Try again with excludeSameAuthor=false
          const fallbackUrl = `/api/recommendations/${storyId}?limit=${limit}&excludeSameAuthor=false`;
          const fallbackResponse = await fetch(fallbackUrl);

          if (!fallbackResponse.ok) {
            throw new Error(`Failed to fetch fallback recommendations: ${fallbackResponse.status}`);
          }

          const fallbackData = await fallbackResponse.json();
          setRecommendations(fallbackData);
          setIncludesSameAuthor(true);
        } else {
          // No recommendations found even with same author included
          setRecommendations([]);
        }
      } catch (err) {
        logError(err, { context: "Error fetching recommendations", storyId })
        setError("Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchRecommendations();
    }
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
    return isMobile ? 1 : 3;
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
        // Loading skeleton
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-[3/2] relative bg-muted">
                <Skeleton className="h-full w-full" />
              </div>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
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
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
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
                          key={index}
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

// Recommendation card component
function RecommendationCard({ story }: { story: RecommendedStory }) {
  // Get the full image URL
  const getFullImageUrl = (imagePath: string | null) => {
    if (!imagePath) return null;

    // If it's already a full URL, return it as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // If it's a relative path to the API endpoint, use it as is
    // The Next.js Image component will resolve it relative to the base URL
    return imagePath;
  };

  const coverImageUrl = getFullImageUrl(story.coverImage);

  return (
    <Card className="overflow-hidden transition-all hover:border-primary">
      <Link href={`/story/${story.slug}`} className="block">
        <div className="aspect-[3/2] relative bg-muted">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={story.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              unoptimized={true} // Skip Next.js image optimization for external URLs
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="text-muted-foreground" />
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link href={`/story/${story.slug}`} className="block">
          <h3 className="font-medium line-clamp-1 hover:text-primary transition-colors">
            {story.title}
          </h3>
        </Link>

        <Link href={`/user/${story.author.username || story.author.id}`}>
          <p className="text-sm text-muted-foreground mb-2 hover:text-primary transition-colors">
            by {story.author.name || story.author.username || "Unknown"}
          </p>
        </Link>

        {story.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {story.description}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {story.genre && (
            <Badge variant="outline" className="text-xs">
              {story.genre}
            </Badge>
          )}
          {story.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {story.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{story.tags.length - 2}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
