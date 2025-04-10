"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
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
import { sampleStories } from "@/lib/sample-data"

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

  // Fetch user data
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

  // Use sample stories for demo
  const userStories = sampleStories.slice(0, 6)

  // Mock saved stories
  const savedStories = sampleStories.slice(6, 12) // Use next 6 stories for demo

  // For now, we'll still use mock data for the followers/following lists
  // In a real implementation, we would fetch this data from an API
  const followers = Array(8)
    .fill(null)
    .map((_, i) => ({
      id: `follower_${i}`,
      name: `Follower ${i + 1}`,
      username: `follower${i + 1}`,
      avatar: "/placeholder-user.jpg",
    }))

  const following = Array(8)
    .fill(null)
    .map((_, i) => ({
      id: `following_${i}`,
      name: `Following ${i + 1}`,
      username: `following${i + 1}`,
      avatar: "/placeholder-user.jpg",
    }))

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

              {/* Avatar - positioned to overlap the banner */}
              {/* <div className="absolute -bottom-16 left-4 md:left-8">
                <div className="relative">
                  <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name || user.username} />
                    <AvatarFallback>{(user.name || user.username).charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
              </div> */}
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
                {userStories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userStories.map((story) => (
                      <StoryCard key={story.id} story={story} />
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
                {savedStories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedStories.map((story) => (
                      <StoryCard key={story.id} story={story} />
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
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Followers</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {followers.map((follower) => (
                        <Card key={follower.id}>
                          <CardContent className="p-4 flex flex-col items-center text-center">
                            <Avatar className="h-16 w-16 mb-2">
                              <AvatarImage src={follower.avatar} alt={follower.name} />
                              <AvatarFallback>{follower.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/user/${follower.username}`} className="font-medium hover:text-primary">
                              {follower.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">@{follower.username}</p>
                            <Button size="sm" variant="outline" className="mt-2 w-full">
                              View Profile
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div id="following">
                    <h3 className="text-xl font-semibold mb-4">Following</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {following.map((follow) => (
                        <Card key={follow.id}>
                          <CardContent className="p-4 flex flex-col items-center text-center">
                            <Avatar className="h-16 w-16 mb-2">
                              <AvatarImage src={follow.avatar} alt={follow.name} />
                              <AvatarFallback>{follow.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/user/${follow.username}`} className="font-medium hover:text-primary">
                              {follow.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">@{follow.username}</p>
                            <Button size="sm" variant="outline" className="mt-2 w-full">
                              View Profile
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
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

