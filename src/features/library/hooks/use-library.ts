"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRequireAuth } from "@/features/auth";
import { StoryService } from "@/lib/api/story";
import { ImageService } from "@/lib/api/images";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";
import { getGenreName, type StoryCardData } from "@/features/story";
import type { Story } from "@/types/story";
import type { LibrarySortOption } from "../types/library.types";

const getAuthorName = (author: StoryCardData["author"]): string => {
  if (typeof author === "string") return author;
  if (author && typeof author === "object") return author.name || author.username || "";
  return "";
};

const formatStoryCardItem = (story: Story | any): StoryCardData => {
  const authorName =
    story.author?.name ||
    story.author?.username ||
    (typeof story.author === "string" ? story.author : "Unknown Author");

  const languageName =
    typeof story.language === "object" && story.language !== null ? story.language.name : (story.language ?? "");

  const coverUrl = story.coverImage
    ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg"
    : "/placeholder.svg";

  const dateObj = story.createdAt ? new Date(story.createdAt) : new Date();

  return {
    id: story.id,
    title: story.title,
    author: authorName,
    genre: story.genre?.name ?? "General",
    language: languageName,
    status: story.status || "ongoing",
    coverImage: coverUrl,
    excerpt: story.description ?? "",
    description: story.description ?? "",
    likeCount: story.likeCount ?? 0,
    commentCount: story.commentCount ?? 0,
    viewCount: story.viewCount ?? 0,
    chapterCount: story.chapterCount ?? story._count?.chapters ?? undefined,
    readTime: Math.ceil((story.wordCount || 0) / 200),
    date: dateObj,
    createdAt: dateObj,
    slug: story.slug ?? undefined,
    tags: Array.isArray(story.tags)
      ? story.tags.map((t: any) => (typeof t === "string" ? t : t?.name ?? ""))
      : [],
    isMature: story.isMature || false,
    isBookmarked: true,
  };
};

export function useLibrary() {
  const { toast } = useToast();
  const { user } = useRequireAuth();

  const [bookmarkedStories, setBookmarkedStories] = useState<StoryCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<LibrarySortOption>("recent");
  const [filterGenre, setFilterGenre] = useState("all");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchBookmarkedStories = async () => {
      try {
        setLoading(true);
        const response = await StoryService.getBookmarkedStories();

        if (isCancelled) return;

        if (!response.success || !response.data) {
          throw new Error(response.message || "Failed to fetch bookmarked stories");
        }

        const { data: { stories } } = response;
        const formattedStories: StoryCardData[] = (stories || []).map(formatStoryCardItem);

        setBookmarkedStories(formattedStories);
      } catch (error) {
        if (isCancelled) return;
        logError(error, { context: "Fetching bookmarked stories" });
        toast({
          title: "Error",
          description: "Failed to load your library. Please try again.",
          variant: "destructive",
        });
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchBookmarkedStories();

    return () => {
      isCancelled = true;
    };
  }, [user, toast]);

  const genres = useMemo(() => {
    const rawGenres = bookmarkedStories
      .map((story) => getGenreName(story.genre))
      .filter((g) => g !== "General");
    return ["all", ...Array.from(new Set(rawGenres))];
  }, [bookmarkedStories]);

  const handleBookmark = useCallback((id: string | number) => {
    setBookmarkedStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s))
    );
  }, []);

  const filteredStories = useMemo(() => {
    let result = [...bookmarkedStories];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          getAuthorName(story.author).toLowerCase().includes(query) ||
          getGenreName(story.genre).toLowerCase().includes(query)
      );
    }

    if (filterGenre !== "all") {
      result = result.filter((story) => getGenreName(story.genre) === filterGenre);
    }

    switch (sortBy) {
      case "recent":
        return result.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
      case "oldest":
        return result.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      case "title":
        return result.sort((a, b) => a.title.localeCompare(b.title));
      case "author":
        return result.sort((a, b) => getAuthorName(a.author).localeCompare(getAuthorName(b.author)));
      case "mostRead":
        return result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      default:
        return result;
    }
  }, [bookmarkedStories, searchQuery, filterGenre, sortBy]);

  return {
    bookmarkedStories,
    filteredStories,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    filterGenre,
    setFilterGenre,
    genres,
    handleBookmark,
  };
}
