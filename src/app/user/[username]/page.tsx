"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Edit,
  MessageSquare,
  UserPlus,
  UserCheck,
  Calendar,
  MapPin,
  LinkIcon,
  Twitter,
  Facebook,
  Instagram,
} from "lucide-react"
import Navbar from "@/components/navbar"
import StoryCard from "@/components/story-card"
import { SiteFooter } from "@/components/site-footer"
import { sampleStories } from "@/lib/sample-data"

// Mock user data
const mockUser = {
  id: "user_1",
  name: "James Watson",
  username: "jwatson213",
  avatar: "/placeholder-user.jpg",
  banner: "/placeholder.svg?height=300&width=1200",
  bio: "Fiction writer with a passion for fantasy and sci-fi. Creating worlds one story at a time.",
  location: "San Francisco, CA",
  website: "https://jameswatson.com",
  joinDate: "January 2022",
  isCurrentUser: true,
  isFollowing: false,
  stats: {
    stories: 12,
    followers: 1243,
    following: 356,
    totalReads: 45600,
    totalLikes: 8900,
  },
  socialLinks: {
    twitter: "https://twitter.com/jwatson",
    facebook: "https://facebook.com/jwatson",
    instagram: "https://instagram.com/jwatson",
  },
}

export default function UserProfilePage() {
  const params = useParams()
  const username = params?.username as string
  const [user, setUser] = useState(mockUser)
  const [activeTab, setActiveTab] = useState("stories")
  const [isFollowing, setIsFollowing] = useState(user.isFollowing)

  // In a real app, we would fetch user data based on the username
  // For now, we'll use mock data

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    // In a real app, we would make an API call to follow/unfollow
  }

  // Filter stories for this user
  const userStories = sampleStories.slice(0, 6) // Just use first 6 stories for demo

  // Mock saved stories
  const savedStories = sampleStories.slice(6, 12) // Use next 6 stories for demo

  // Mock followers/following
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
        {/* Profile Header */}
        <div className="mb-8">
          {/* Banner */}
          <div className="relative h-48 md:h-64 w-full rounded-lg overflow-hidden mb-16">
            <Image src={user.banner || "/placeholder.svg"} alt="Profile banner" fill className="object-cover" />

            {/* Avatar - positioned to overlap the banner */}
            <div className="absolute -bottom-16 left-4 md:left-8">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>

                {user.isCurrentUser && (
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full" asChild>
                    <Link href="/settings">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit Profile</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {/* Edit banner button (only visible to profile owner) */}
            {user.isCurrentUser && (
              <Button size="sm" variant="secondary" className="absolute top-4 right-4" asChild>
                <Link href="/settings">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Banner
                </Link>
              </Button>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end pl-4 md:pl-40">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold">{user.name}</h1>
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

                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {user.joinDate}</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-2 mt-4">
                {user.socialLinks.twitter && (
                  <a href={user.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost">
                      <Twitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </a>
                )}

                {user.socialLinks.facebook && (
                  <a href={user.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost">
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </a>
                )}

                {user.socialLinks.instagram && (
                  <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </a>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {!user.isCurrentUser && (
                <>
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollow}
                    className="flex items-center gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>

                  <Button variant="outline" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                </>
              )}

              {user.isCurrentUser && (
                <Button asChild className="border-2 border-primary">
                  <Link href="/write/story-info">Write New Story</Link>
                </Button>
              )}
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
              <span className="font-bold">{user.stats.stories}</span> Stories
            </div>
            <Link href="#followers" className="hover:text-primary">
              <span className="font-bold">{user.stats.followers.toLocaleString()}</span> Followers
            </Link>
            <Link href="#following" className="hover:text-primary">
              <span className="font-bold">{user.stats.following.toLocaleString()}</span> Following
            </Link>
            <div>
              <span className="font-bold">{user.stats.totalReads.toLocaleString()}</span> Total Reads
            </div>
            <div>
              <span className="font-bold">{user.stats.totalLikes.toLocaleString()}</span> Total Likes
            </div>
          </div>
        </div>

        {/* Tabs */}
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
                  {user.isCurrentUser ? (
                    <>
                      <p className="text-muted-foreground mb-6">Start writing your first story today!</p>
                      <Button asChild className="border-2 border-primary">
                        <Link href="/write/story-info">Write New Story</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">This user hasn't published any stories yet.</p>
                  )}
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
                  {user.isCurrentUser ? (
                    <>
                      <p className="text-muted-foreground mb-6">Browse stories and save them to your library!</p>
                      <Button asChild>
                        <Link href="/browse">Browse Stories</Link>
                      </Button>
                    </>
                  ) : (
                    <p className="text-muted-foreground">This user hasn't saved any stories to their library.</p>
                  )}
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
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

