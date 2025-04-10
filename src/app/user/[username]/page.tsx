"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
// import Image from "next/image" - not needed
import Link from "next/link"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  MapPin,
  LinkIcon,
  Loader2,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react"
import Navbar from "@/components/navbar"
import StoryCard from "@/components/story-card"
import { SiteFooter } from "@/components/site-footer"
// import { sampleStories } from "@/lib/sample-data" - not needed
import { StoryService } from "@/services/story-service"

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
    set?: {
      twitter?: string | null
      facebook?: string | null
      instagram?: string | null
    }
  } | null
  image: string | null
  bannerImage: string | null
  joinedDate: string | null
  storyCount: number
  isCurrentUser: boolean
  followers?: number
  following?: number
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params?.username as string
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("stories")

  // Fetch user data and stories
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/user/${username}`)

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("User not found")
          }
          throw new Error("Failed to fetch user data")
        }

        const userData = await response.json()
        console.log('User data from API:', userData) // Log the user data
        setUser(userData)
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    if (username) {
      fetchUserData()
    }
  }, [username])

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
          fetch(`/api/user/bookmarks?userId=${user.id}`)
        ])

        if (!storiesResponse.ok) {
          throw new Error("Failed to fetch user stories")
        }

        const storiesData = await storiesResponse.json()
        console.log('User stories from API:', storiesData)

        // Format the stories to ensure they have all required fields
        const formattedStories = storiesData.stories.map((story: any) => {
          // Convert date strings to Date objects if they exist
          const createdAt = story.createdAt ? new Date(story.createdAt) : undefined;
          const updatedAt = story.updatedAt ? new Date(story.updatedAt) : undefined;

          return {
            ...story,
            // Ensure these fields exist for StoryCard component
            author: story.author || user.name || user.username,
            excerpt: story.description,
            likes: story.likeCount,
            comments: story.commentCount,
            reads: story.readCount,
            createdAt,
            updatedAt
          };
        })

        setUserStories(formattedStories || [])

        // Process bookmarked stories if the request was successful
        if (bookmarksResponse.ok) {
          const bookmarksData = await bookmarksResponse.json()
          console.log('User bookmarks from API:', bookmarksData)

          // Format the bookmarked stories
          const formattedBookmarks = bookmarksData.stories.map((story: any) => {
            // Convert date strings to Date objects if they exist
            const createdAt = story.createdAt ? new Date(story.createdAt) : undefined;
            const updatedAt = story.updatedAt ? new Date(story.updatedAt) : undefined;

            return {
              ...story,
              // Ensure these fields exist for StoryCard component
              excerpt: story.description,
              likes: story.likeCount,
              comments: story.commentCount,
              reads: story.readCount,
              createdAt,
              updatedAt
            };
          })

          setLibraryStories(formattedBookmarks || [])
        } else {
          console.error("Failed to fetch bookmarked stories")
          setLibraryStories([])
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setStoriesLoading(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  // State for user's published stories and library
  const [userStories, setUserStories] = useState<any[]>([])
  const [savedStories, setLibraryStories] = useState<any[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)

  // State for followers and following
  const [followers, setFollowers] = useState<any[]>([])
  const [following, setFollowing] = useState<any[]>([])
  const [followersLoading, setFollowersLoading] = useState(false)
  const [followingLoading, setFollowingLoading] = useState(false)

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
        console.error("Error fetching follow data:", err)
      } finally {
        setFollowersLoading(false)
        setFollowingLoading(false)
      }
    }

    fetchFollowData()
  }, [user?.username, activeTab])

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-destructive">{error}</h3>
            <p className="text-muted-foreground">Unable to load user profile.</p>
          </div>
        ) : user ? (
          <div className="mb-8">
            <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden mb-16">
              {user.bannerImage ? (
                <>
                  <img
                    src={user.bannerImage}
                    alt="Profile banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error('Error loading banner image:', e);
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </>
              ) : (
                <img
                  src="/placeholder.svg"
                  alt="Profile banner"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Avatar positioned to overlap the banner */}
            <div className="relative -mt-36 ml-4 md:ml-8">
              <Avatar className="h-40 w-40 border-4 border-background">
                <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name || user.username} />
                <AvatarFallback>{(user.name || user.username).charAt(0)}</AvatarFallback>
              </Avatar>
            </div>

            {/* Profile Info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end pl-4 md:pl-40">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
                <p className="text-muted-foreground">@{user.username}</p>

                <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  {user.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a href={user.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {user.website.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}

                  {user.joinedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {user.joinedDate}</span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex gap-2 mt-4">
                  {user.socialLinks && (
                    <>
                      {/* Check for Twitter link */}
                      {(() => {
                        // Get the Twitter link from the appropriate location
                        const twitterLink =
                          typeof user.socialLinks === 'object' && user.socialLinks.twitter ?
                            user.socialLinks.twitter :
                          typeof user.socialLinks === 'object' && user.socialLinks.set && user.socialLinks.set.twitter ?
                            user.socialLinks.set.twitter :
                            null;

                        return twitterLink ? (
                          <a href={twitterLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <Twitter className="h-4 w-4" />
                              <span className="sr-only">Twitter</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}

                      {/* Check for Facebook link */}
                      {(() => {
                        // Get the Facebook link from the appropriate location
                        const facebookLink =
                          typeof user.socialLinks === 'object' && user.socialLinks.facebook ?
                            user.socialLinks.facebook :
                          typeof user.socialLinks === 'object' && user.socialLinks.set && user.socialLinks.set.facebook ?
                            user.socialLinks.set.facebook :
                            null;

                        return facebookLink ? (
                          <a href={facebookLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <Facebook className="h-4 w-4" />
                              <span className="sr-only">Facebook</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}

                      {/* Check for Instagram link */}
                      {(() => {
                        // Get the Instagram link from the appropriate location
                        const instagramLink =
                          typeof user.socialLinks === 'object' && user.socialLinks.instagram ?
                            user.socialLinks.instagram :
                          typeof user.socialLinks === 'object' && user.socialLinks.set && user.socialLinks.set.instagram ?
                            user.socialLinks.set.instagram :
                            null;

                        return instagramLink ? (
                          <a href={instagramLink} target="_blank" rel="noopener noreferrer">
                            <Button size="icon" variant="ghost">
                              <Instagram className="h-4 w-4" />
                              <span className="sr-only">Instagram</span>
                            </Button>
                          </a>
                        ) : null;
                      })()}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mt-6 pl-4 md:pl-40">
                <p className="text-sm md:text-base max-w-2xl">{user.bio}</p>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 pl-4 md:pl-40 flex flex-wrap gap-6 text-sm">
              <div>
                <span className="font-bold">{user.storyCount}</span> Stories
              </div>
              <Link href="#followers" className="hover:text-primary">
                <span className="font-bold">{user.followers || 0}</span> Followers
              </Link>
              <Link href="#following" className="hover:text-primary">
                <span className="font-bold">{user.following || 0}</span> Following
              </Link>
            </div>
          </div>
        ) : null}

        {/* Tabs */}
        {!loading && !error && user && (
          <Tabs defaultValue="stories" value={activeTab} onValueChange={setActiveTab} className="mt-12">
            <TabsList className="mb-8">
              <TabsTrigger value="stories">Published Stories</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
              <TabsTrigger value="followers">Followers & Following</TabsTrigger>
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
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {storiesLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : savedStories.length > 0 ? (
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {savedStories.map((story) => (
                      <StoryCard key={story.id} story={story} viewMode="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg">
                    <h3 className="text-xl font-semibold mb-2">No saved stories</h3>
                    <p className="text-muted-foreground">This user hasn't saved any stories to their library.</p>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
        )}
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

