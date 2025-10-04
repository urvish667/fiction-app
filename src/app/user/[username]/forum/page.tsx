import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/auth/db-adapter"
import { ForumType } from "@prisma/client"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import ForumClient from "./forum-client"

// Force dynamic rendering for proper caching behavior
export const dynamic = 'force-dynamic'

type ForumPageParams = { params: Promise<{ username: string }> };

// Get forum data
async function getForumData(username: string) {
  try {
    const session = await getServerSession(authOptions);

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        preferences: true,
        forums: {
          where: { type: ForumType.AUTHOR },
          select: {
            id: true,
            createdAt: true,
          }
        }
      }
    });

    if (!user || !user.username) {
      return null;
    }

    // Parse preferences
    let preferences = {
      privacySettings: {
        forum: false
      }
    };

    if (user.preferences) {
      try {
        preferences = typeof user.preferences === 'string'
          ? JSON.parse(user.preferences)
          : user.preferences;
      } catch (error) {
        // Fall back to default
      }
    }

    // Check if forum is enabled
    if (!preferences.privacySettings?.forum) {
      return null;
    }

    // Check if user is the forum owner
    const isOwner = session?.user?.id === user.id;

    return {
      user: {
        id: user.id,
        name: user.name || user.username,
        username: user.username,
        image: user.image,
      },
      forum: user.forums[0] || null,
      isOwner,
      currentUserId: session?.user?.id || null,
    };
  } catch (error) {
    console.error('Error fetching forum data:', error);
    return null;
  }
}

// Generate metadata
export async function generateMetadata({ params }: ForumPageParams): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getForumData(resolvedParams.username);

  if (!data) {
    return {
      title: 'Forum Not Found - FableSpace',
      description: 'The requested forum could not be found.',
    };
  }

  return {
    title: `${data.user.username}'s Forum - FableSpace`,
    description: `Join the discussion in ${data.user.username}'s author forum.`,
  };
}

export default async function ForumPage({ params }: ForumPageParams) {
  const resolvedParams = await params;
  const data = await getForumData(resolvedParams.username);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <ForumClient 
          user={data.user}
          forumId={data.forum?.id || null}
          isOwner={data.isOwner}
          currentUserId={data.currentUserId}
        />
      </main>

      <SiteFooter />
    </div>
  );
}
