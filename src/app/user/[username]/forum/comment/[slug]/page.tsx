"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import PostPageClient from "./post-page-client"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { getForumPostData } from "@/lib/forum-data"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

// Mock data for forum rules and banned users
const forumRules = [
  "Be respectful to all members",
  "No spam or self-promotion",
  "Use appropriate language",
  "Stay on topic",
  "No harassment or bullying",
  "Respect author's creative choices"
]

type PostPageParams = { username: string; slug: string };

export default function PostPage() {
  const params = useParams() as PostPageParams;
  const router = useRouter();
  const { user } = useAuth();
  const [postData, setPostData] = useState<{
    post: any;
    user: any;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadPostData() {
      if (!params.username || !params.slug) return;

      try {
        const data = await getForumPostData(params.username, params.slug);

        if (!data) {
          router.replace('/404');
          return;
        }

        setPostData(data);
      } catch (error) {
        console.error('Error loading post data:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (params.username && params.slug) {
      loadPostData();
    }
  }, [params.username, params.slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading post...</span>
        </div>
      </div>
    );
  }

  if (error || !postData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[400px]">
          <p>Post not found or unavailable</p>
        </div>
      </div>
    );
  }

  // Use auth context user for current user determination
  const currentUserId = user?.id || null;
  const isOwner = currentUserId !== null && postData.user.id === currentUserId;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <PostPageClient
          post={postData.post}
          user={{
            id: postData.user.id,
            name: postData.user.name || postData.user.username,
            username: postData.user.username,
            image: postData.user.image ?? null,
          }}
          forumRules={forumRules}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
