"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import ForumClient from "./forum-client"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { UserService } from "@/lib/api/user"

type ForumPageParams = { username: string };

export default function ForumPage() {
  const params = useParams() as ForumPageParams;
  const router = useRouter();
  const { user } = useAuth();
  const [forumData, setForumData] = useState<{
    user: any;
    forum: any;
    isOwner: boolean;
    currentUserId: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadForumData() {
      if (!params.username) return;

      try {
        // Get user profile
        const userProfileResponse = await UserService.getUserProfile(params.username);

        if (!userProfileResponse.success || !userProfileResponse.data) {
          setError(true);
          return;
        }

        const userProfile = userProfileResponse.data;

        // Check if forum is enabled
        if (!userProfile.preferences?.privacySettings?.forum) {
          router.replace('/404');
          return;
        }

        // Use auth context for current user
        const currentUserId = user?.id || null;
        const isOwner = currentUserId !== null && currentUserId === userProfile.id;

        setForumData({
          user: {
            id: userProfile.id,
            name: userProfile.name ?? null,
            username: userProfile.username ?? '',
            image: userProfile.image ?? null,
          },
          forum: null, // No forum metadata fetched yet
          isOwner,
          currentUserId,
        });

      } catch (error) {
        console.error('Error loading forum data:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (params.username) {
      loadForumData();
    }
  }, [params.username, user?.id, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading forum...</span>
        </div>
      </div>
    );
  }

  if (error || !forumData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Forum not found or unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <ForumClient
          user={forumData.user}
          forumId={forumData.forum?.id || null}
          isOwner={forumData.isOwner}
          currentUserId={forumData.currentUserId}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
