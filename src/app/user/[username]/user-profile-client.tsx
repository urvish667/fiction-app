"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import StoryCard from "@/components/story-card"
import { StoryService } from "@/services/story-service"
import { logError } from "@/lib/error-logger"

// Define user profile type
type UserProfile = {
  id: string
  name: string | null
  username: string
  bio: string | null
  location: string | null
  website: string | null
  socialLinks: {
    twitter?: string | null
    facebook?: string | null
    instagram?: string | null
  } | null
  image: string | null
  bannerImage: string | null
  joinedDate: string | null
  storyCount: number
  isCurrentUser: boolean
  followers?: number
  following?: number
  donationsEnabled?: boolean | null;
  donationMethod?: string | null;
  donationLink?: string | null;
  preferences?: {
    privacySettings?: {
      showLocation?: boolean
      showEmail?: boolean
    }
  }
  isPublic: boolean
  email: string | null
}

interface UserProfileClientProps {
  user: UserProfile
}

export default function UserProfileClient({ user }: UserProfileClientProps) {
  const [activeTab, setActiveTab] = useState("stories")

  // State for user's published stories and library
  const [userStories, setUserStories] = useState<any[]>([])
  const [savedStories, setLibraryStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)

  // State for followers and following
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)

  // Fetch user's published stories and bookmarked stories
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) return

      try {
        setStoriesLoading(true)

        // Fetch stories with status 'ongoing' or 'completed' by this author
        const [storiesResponse, bookmarksResponse] = await Promise.all([
          // Fetch published stories
          fetch(`/api/stories?authorId=${user.id}&status=ongoing,completed`),
          // Fetch bookmarked stories
          fetch(`/api/user/bookmarks?userId=${user.id}`),
        ])

        if (!storiesResponse.ok) {
          throw new Error("Failed to fetch user stories")
        }

        const storiesData = await storiesResponse.json()

        // Format the stories to ensure they have all required fields
        const formattedStories = storiesData.stories.map((story: any) => {
          // Convert date strings to Date objects if they exist
          const createdAt = story.createdAt
            ? new Date(story.createdAt)
            : undefined
          const updatedAt = story.updatedAt
            ? new Date(story.updatedAt)
            : undefined

          return {
            ...story,
            // Ensure these fields exist for StoryCard component
            author: story.author || user.name || user.username,
            excerpt: story.description,
            coverImage: story.coverImage,
            likeCount: story.likeCount || 0,
            commentCount: story.commentCount || 0,
            viewCount: story.viewCount || 0,
            isMature: story.isMature || false,
            createdAt,
            updatedAt,
          }
        })

        setUserStories(formattedStories || [])

        // Process bookmarked stories if the request was successful
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json()

          // Format the bookmarked stories
          const formattedBookmarks = bookmarksData.stories.map((story: any) => {
            // Convert date strings to Date objects if they exist
            const createdAt = story.createdAt
              ? new Date(story.createdAt)
              : undefined
            const updatedAt = story.updatedAt
              ? new Date(story.updatedAt)
              : undefined

            return {
              ...story,
              // Ensure these fields exist for StoryCard component
              excerpt: story.description,
              coverImage: story.coverImage,
              likeCount: story.likeCount || 0,
              commentCount: story.commentCount || 0,
              viewCount: story.viewCount || 0,
              isMature: story.isMature || false,
              createdAt,
              updatedAt,
            }
          })

          setLibraryStories(formattedBookmarks || [])
        } else {
          logError(bookmarksResponse, {
            context: "Failed to fetch bookmarked stories",
            userId: user.id,
          })
          setLibraryStories([])
        }
      } catch (err) {
        logError(err, {
          context: "Error fetching user stories",
          userId: user.id,
        })
      } finally {
        setStoriesLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  // Fetch followers and following when the tab is selected
  useEffect(() => {
    const fetchFollowData = async () => {
      if (!user?.username || activeTab !== "followers") return

      try {
        setFollowersLoading(true)
        setFollowingLoading(true)

        // Fetch followers
        const followersData = await StoryService.getFollowers(user.username)
        setFollowers(followersData.followers || [])

        // Fetch following
        const followingData = await StoryService.getFollowing(user.username)
        setFollowing(followingData.following || [])
      } catch (err) {
        logError(err, { context: "Error fetching follow data", userId: user.id })
      } finally {
        setFollowersLoading(false)
        setFollowingLoading(false)
      }
    }

    fetchFollowData()
  }, [user?.username, activeTab])

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
          Followers & Following
        </TabsTrigger>
      </TabsList>

      <TabsContent value="stories">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {storiesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : userStories.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {userStories.map((story) => (
                <StoryCard key={story.id} story={story} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No stories published yet</h3>
              <p className="text-muted-foreground">This user hasn't published any stories yet.</p>
            </div>
          )}
        </motion.div>
      </TabsContent>

      <TabsContent value="library">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {storiesLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : savedStories.length > 0 ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {savedStories.map(story => (
                <StoryCard key={story.id} story={story} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">No saved stories</h3>
              <p className="text-muted-foreground">
                This user hasn't saved any stories to their library.
              </p>
            </div>
          )}
        </motion.div>
      </TabsContent>

      <TabsContent value="followers" id="followers">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="grid grid-cols-1 gap-8">
            {/* Followers Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Followers</h3>
              {followersLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : followers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {followers.map((follower) => (
                    <Card key={follower.id}>
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={follower.image || "/placeholder-user.jpg"} alt={follower.name || follower.username} />
                          <AvatarFallback>{(follower.name || follower.username || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/user/${follower.username}`} className="font-medium hover:text-primary">
                          {follower.name || follower.username}
                        </Link>
                        <p className="text-xs text-muted-foreground">@{follower.username}</p>
                        {follower.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{follower.bio}</p>
                        )}
                        <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                          <Link href={`/user/${follower.username}`}>View Profile</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
                  <p className="text-muted-foreground">This user doesn't have any followers yet.</p>
                </div>
              )}
            </div>

            {/* Following Section */}
            <div id="following">
              <h3 className="text-xl font-semibold mb-4">Following</h3>
              {followingLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : following.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {following.map((follow) => (
                    <Card key={follow.id}>
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <Avatar className="h-16 w-16 mb-2">
                          <AvatarImage src={follow.image || "/placeholder-user.jpg"} alt={follow.name || follow.username} />
                          <AvatarFallback>{(follow.name || follow.username || "U").charAt(0)}</AvatarFallback>
                        </Avatar>
                        <Link href={`/user/${follow.username}`} className="font-medium hover:text-primary">
                          {follow.name || follow.username}
                        </Link>
                        <p className="text-xs text-muted-foreground">@{follow.username}</p>
                        {follow.bio && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{follow.bio}</p>
                        )}
                        <Button size="sm" variant="outline" className="mt-2 w-full" asChild>
                          <Link href={`/user/${follow.username}`}>View Profile</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Not following anyone</h3>
                  <p className="text-muted-foreground">This user isn't following anyone yet.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </TabsContent>
    </Tabs>
  )
}
