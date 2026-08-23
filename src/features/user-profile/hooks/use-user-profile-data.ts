"use client";

import { useState, useEffect, useCallback } from "react";
import { StoryService } from "@/lib/api/story";
import { ImageService } from "@/lib/api/images";
import { UserService } from "@/lib/api/user";
import { logError } from "@/lib/error-logger";
import type { UserProfile, FollowUserItem } from "../types/user-profile.types";

const STORIES_PER_PAGE = 8;

const formatStories = (stories: any[], user: UserProfile) => {
  return (stories || []).map((story: any) => {
    const createdAt = story.createdAt ? new Date(story.createdAt) : undefined;
    const updatedAt = story.updatedAt ? new Date(story.updatedAt) : undefined;

    return {
      ...story,
      author: story.author || user.name || user.username,
      excerpt: story.description,
      coverImage: story.coverImage ? ImageService.getImageUrl(story.coverImage) || "/placeholder.svg" : "/placeholder.svg",
      likeCount: story.likeCount || 0,
      commentCount: story.commentCount || 0,
      viewCount: story.readCount || story.viewCount || 0,
      isMature: story.isMature || false,
      createdAt,
      updatedAt,
    };
  });
};

export function useUserProfileData(user: UserProfile, activeTab: string) {
  const [userStories, setUserStories] = useState<any[]>([]);
  const [savedStories, setSavedStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [loadingMoreStories, setLoadingMoreStories] = useState(false);
  const [hasMoreStories, setHasMoreStories] = useState(true);
  const [storiesPage, setStoriesPage] = useState(1);

  const [followers, setFollowers] = useState<FollowUserItem[]>([]);
  const [following, setFollowing] = useState<FollowUserItem[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);

  const fetchStories = useCallback(
    async (page: number, append: boolean = false) => {
      if (!user?.id) return;

      try {
        if (!append) {
          setStoriesLoading(true);
        }

        let storiesForUser: any[] = [];
        let totalCount = 0;

        const storiesResponse = await StoryService.getStories({
          authorId: user.id,
          status: ["ongoing", "completed"],
          page,
          limit: STORIES_PER_PAGE,
        });

        if (!storiesResponse.success || !storiesResponse.data) {
          const fallbackResponse = await StoryService.getStories({
            limit: page * STORIES_PER_PAGE + 50,
            page: 1,
          });

          if (fallbackResponse.success && fallbackResponse.data) {
            const allStories = fallbackResponse.data.stories || [];
            const filtered = allStories.filter(
              (story: any) =>
                story.author?.id === user.id &&
                ["ongoing", "completed"].includes(story.status)
            );
            storiesForUser = filtered.slice((page - 1) * STORIES_PER_PAGE, page * STORIES_PER_PAGE);
            totalCount = filtered.length;
          }
        } else {
          const storiesData = storiesResponse.data;
          storiesForUser = storiesData.stories || [];

          const pagination = storiesResponse.data.pagination;
          if (pagination) {
            totalCount = pagination.total || 0;
          } else {
            totalCount =
              storiesForUser.length === STORIES_PER_PAGE
                ? page * STORIES_PER_PAGE + 1
                : page * STORIES_PER_PAGE;
          }
        }

        const formattedStories = formatStories(storiesForUser, user);

        if (append) {
          setUserStories((prev) => [...prev, ...formattedStories]);
        } else {
          setUserStories(formattedStories);
          setStoriesPage(1);
        }

        setHasMoreStories(page * STORIES_PER_PAGE < totalCount);
      } catch (err) {
        logError(err, {
          context: "Error fetching user stories",
          userId: user.id,
        });
      } finally {
        setStoriesLoading(false);
        if (append) {
          setLoadingMoreStories(false);
        }
      }
    },
    [user]
  );

  const loadMoreStories = useCallback(async () => {
    if (loadingMoreStories || !hasMoreStories) return;

    setLoadingMoreStories(true);
    const nextPage = storiesPage + 1;
    setStoriesPage(nextPage);

    await fetchStories(nextPage, true);
  }, [loadingMoreStories, hasMoreStories, storiesPage, fetchStories]);

  // Initial fetch for stories and bookmarks
  useEffect(() => {
    if (!user?.id) return;

    let isCancelled = false;

    const fetchInitialData = async () => {
      await fetchStories(1, false);

      if (isCancelled) return;

      try {
        const bookmarksResponse = await UserService.getUserBookmarksByUserId(user.id);
        if (isCancelled) return;

        if (bookmarksResponse.success && bookmarksResponse.data) {
          const bookmarksData = bookmarksResponse.data;
          const formattedBookmarks = formatStories(bookmarksData.stories || [], user);
          setSavedStories(formattedBookmarks);
        } else {
          setSavedStories([]);
        }
      } catch (err) {
        if (isCancelled) return;
        logError(err, {
          context: "Error fetching user bookmarks",
          userId: user.id,
        });
        setSavedStories([]);
      }
    };

    fetchInitialData();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, fetchStories]);

  // Fetch followers and following when tab is active
  useEffect(() => {
    if (!user?.username || activeTab !== "followers") return;

    let isCancelled = false;

    const fetchFollowData = async () => {
      try {
        setFollowersLoading(true);
        setFollowingLoading(true);

        const followersData = await StoryService.getFollowers(user.username);
        if (isCancelled) return;

        if (followersData.success && followersData.data) {
          setFollowers(followersData.data.followers || []);
        } else {
          setFollowers([]);
        }

        const followingData = await StoryService.getFollowing(user.username);
        if (isCancelled) return;

        if (followingData.success && followingData.data) {
          setFollowing(followingData.data.following || []);
        } else {
          setFollowing([]);
        }
      } catch (err) {
        if (isCancelled) return;
        logError(err, { context: "Error fetching follow data", userId: user.id });
      } finally {
        if (!isCancelled) {
          setFollowersLoading(false);
          setFollowingLoading(false);
        }
      }
    };

    fetchFollowData();

    return () => {
      isCancelled = true;
    };
  }, [user?.username, user?.id, activeTab]);

  return {
    userStories,
    savedStories,
    storiesLoading,
    loadingMoreStories,
    hasMoreStories,
    loadMoreStories,
    followers,
    following,
    followersLoading,
    followingLoading,
  };
}
