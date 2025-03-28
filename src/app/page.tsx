"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Navbar from "@/components/navbar"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function Home() {
  const router = useRouter()

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-36 px-8 overflow-hidden bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Unleash Your Stories, One Page at a Time
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join our community of writers and readers to discover, create, and share captivating stories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base">
                Start Reading
              </Button>
              <Link href="/write/story-info">
                <Button size="lg" variant="outline" className="text-base">
                  Start Writing
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-secondary/10 blur-3xl"></div>
        </div>
      </section>

      {/* Featured Stories Section */}
      <section className="py-16 px-8 bg-background">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-bold">Featured Stories</h2>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Categories Section */}
      <section className="py-16 px-8 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-10">Explore Categories</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <Button key={category} variant="secondary" className="rounded-full">
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Join Community Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Community</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with thousands of writers and readers, get feedback on your work, and discover new stories every
            day.
          </p>
          <Button size="lg" className="text-base">
            Sign Up Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-8 bg-muted">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold font-serif">FableSpace</h2>
              <p className="text-muted-foreground">Unleash your stories, one page at a time.</p>
            </div>
            <div className="flex gap-8">
              <div>
                <h3 className="font-medium mb-2">Platform</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Browse
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Write
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Challenges
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Company</h3>
                <ul className="space-y-1">
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="text-muted-foreground hover:text-foreground">
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FableSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  )
}

// Update the StoryCard component in the homepage to make it clickable
function StoryCard({ story }: { story: Story }) {
  const router = useRouter()

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/story/${story.id}`)}
      className="cursor-pointer"
    >
      <Card className="h-full overflow-hidden flex flex-col">
        <div className="relative aspect-[3/2] overflow-hidden">
          <Image
            src={story.thumbnail || "/placeholder.svg"}
            alt={story.title}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          <Badge className="absolute top-2 right-2">{story.genre}</Badge>
        </div>
        <CardHeader className="pb-2">
          <h3 className="font-bold text-lg line-clamp-1">{story.title}</h3>
          <p className="text-sm text-muted-foreground">by {story.author}</p>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2">{story.excerpt}</p>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Heart size={16} className="text-muted-foreground" />
            <span>{story.likes}</span>
          </div>
          <span className="text-sm text-muted-foreground">{story.readTime} min read</span>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// Types
interface Story {
  id: number
  title: string
  author: string
  genre: string
  thumbnail: string
  excerpt: string
  likes: number
  readTime: number
}

// Sample Data
const featuredStories: Story[] = [
  {
    id: 1,
    title: "The Last Lighthouse",
    author: "Emma Rivers",
    genre: "Fantasy",
    thumbnail: "/placeholder.svg?height=300&width=450",
    excerpt: "In a world where darkness consumes everything, one lighthouse stands as humanity's last hope.",
    likes: 342,
    readTime: 8,
  },
  {
    id: 2,
    title: "Echoes of Tomorrow",
    author: "James Chen",
    genre: "Sci-Fi",
    thumbnail: "/placeholder.svg?height=300&width=450",
    excerpt: "When the future sends messages to the past, one woman must decide whether to listen.",
    likes: 289,
    readTime: 12,
  },
  {
    id: 3,
    title: "Whispers in the Hallway",
    author: "Sarah Blake",
    genre: "Mystery",
    thumbnail: "/placeholder.svg?height=300&width=450",
    excerpt: "The old school holds secrets that have been buried for generations, until now.",
    likes: 176,
    readTime: 10,
  },
  {
    id: 4,
    title: "Beyond the Horizon",
    author: "Michael Torres",
    genre: "Adventure",
    thumbnail: "/placeholder.svg?height=300&width=450",
    excerpt: "A journey across uncharted waters leads to discoveries that will change the world.",
    likes: 421,
    readTime: 15,
  },
]

const categories = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Adventure",
  "Historical Fiction",
  "Young Adult",
  "Thriller",
  "Poetry",
]
