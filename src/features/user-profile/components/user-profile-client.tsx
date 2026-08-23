"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PublishedStoriesTab } from "./tabs/published-stories-tab";
import { SavedLibraryTab } from "./tabs/saved-library-tab";
import { FollowersTab } from "./tabs/followers-tab";
import { useUserProfileData } from "../hooks/use-user-profile-data";
import type { UserProfile } from "../types/user-profile.types";

interface UserProfileClientProps {
  user: UserProfile;
}

export function UserProfileClient({ user }: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState("stories");

  const {
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
  } = useUserProfileData(user, activeTab);

  return (
    <Tabs
      defaultValue="stories"
      value={activeTab}
      onValueChange={setActiveTab}
      className="mt-8 md:mt-12"
    >
      <TabsList className="mb-6 md:mb-8">
        <TabsTrigger value="stories" className="text-xs sm:text-sm">
          Published Stories
        </TabsTrigger>
        <TabsTrigger value="library" className="text-xs sm:text-sm">
          Library
        </TabsTrigger>
        <TabsTrigger value="followers" className="text-xs sm:text-sm">
          Followers &amp; Following
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stories">
        <PublishedStoriesTab
          stories={userStories}
          isLoading={storiesLoading}
          isLoadingMore={loadingMoreStories}
          hasMore={hasMoreStories}
          totalCount={user.storyCount}
          onLoadMore={loadMoreStories}
        />
      </TabsContent>

      <TabsContent value="library">
        <SavedLibraryTab
          savedStories={savedStories}
          isLoading={storiesLoading}
        />
      </TabsContent>

      <TabsContent value="followers" id="followers">
        <FollowersTab
          followers={followers}
          following={following}
          followersLoading={followersLoading}
          followingLoading={followingLoading}
        />
      </TabsContent>
    </Tabs>
  );
}

export default UserProfileClient;
