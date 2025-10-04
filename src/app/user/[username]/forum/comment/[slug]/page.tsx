import { notFound, redirect } from "next/navigation"
import PostPageClient from "./post-page-client"
import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { getForumPostData } from "@/lib/forum-data"

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

const mockBannedUsers = [
  { id: "1", name: "John Doe", username: "johndoe", image: null, bannedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: "2", name: "Jane Smith", username: "janesmith", image: null, bannedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
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

  return {
    title: `${data.post.title} - ${data.user.name}'s Forum`,
    description: data.post.content.slice(0, 160) + "..."
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { username, slug } = await params
  const data = await getForumPostData(username, slug)

  if (!data) {
    notFound()
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <PostPageClient
          post={data.post}
          user={data.user}
          forumRules={forumRules}
          bannedUsers={mockBannedUsers}
        />
      </main>

      <SiteFooter />
    </div>
  )
}
