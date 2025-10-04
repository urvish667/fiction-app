import { notFound, redirect } from "next/navigation"
import PostPageClient from "./post-page-client"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { getForumPostData } from "@/lib/forum-data"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/auth/db-adapter"
import { generateForumPostMetadata, generateForumPostStructuredData } from "@/lib/seo/metadata"

interface PostPageProps {
  params: {
    username: string
    slug: string
  }
}

// Force dynamic rendering to prevent static generation caching issues
export const dynamic = 'force-dynamic'

// Mock data for forum rules and banned users
const forumRules = [
  "Be respectful to all members",
  "No spam or self-promotion",
  "Use appropriate language",
  "Stay on topic",
  "No harassment or bullying",
  "Respect author's creative choices"
]

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { username, slug } = await params
  const data = await getForumPostData(username, slug)

  if (!data) {
    return {
      title: 'Post Not Found - FableSpace',
      description: 'The requested forum post could not be found.'
    }
  }

  return generateForumPostMetadata(data.post, data.user)
}

export default async function PostPage({ params }: PostPageProps) {
  const { username, slug } = await params
  const data = await getForumPostData(username, slug)

  if (!data) {
    notFound()
  }

  // Check if current user is the owner
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || null

  // Get forum owner from database
  const forumUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true }
  })

  // Determine if current user is the forum owner
  const isOwner = currentUserId !== null && forumUser?.id === currentUserId

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <PostPageClient
          post={data.post}
          user={data.user}
          forumRules={forumRules}
          isOwner={isOwner}
          currentUserId={currentUserId}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
