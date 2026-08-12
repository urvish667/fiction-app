"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { MessageSquare, BookOpen, Users, ArrowRight, Clock, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { ForumService, ForumDirectoryItem, ActivityPost } from "@/lib/api/forum"
import { ImageService } from "@/lib/api/images"
import { Avatar as UiAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import AdBanner from "@/components/ad-banner"

const FORUMS_PER_PAGE = 12

const PLATFORMS = [
  {
    id: "reddit",
    label: "Reddit",
    href: "https://www.reddit.com/r/FableSpaceCommunity/",
    description: "r/FableSpaceCommunity",
    bg: "bg-orange-500/10 hover:bg-orange-500/15 border-orange-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-orange-500">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
      </svg>
    ),
  },
  {
    id: "discord",
    label: "Discord",
    href: "https://discord.gg/JVMr2TRXY7",
    description: "Join the server",
    bg: "bg-indigo-500/10 hover:bg-indigo-500/15 border-indigo-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-indigo-500">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.134 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
  },
  {
    id: "lemmy",
    label: "Lemmy",
    href: "https://lemmy.world/c/fablespace",
    description: "c/fablespace",
    bg: "bg-green-500/10 hover:bg-green-500/15 border-green-500/20",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-green-500">
        <path d="M11.979 0C5.362 0 0 5.362 0 11.979s5.362 11.979 11.979 11.979 11.979-5.362 11.979-11.979S18.596 0 11.979 0zm-.012 3.76c.895 0 1.61.726 1.61 1.622 0 .895-.715 1.621-1.61 1.621-.896 0-1.622-.726-1.622-1.621 0-.896.726-1.622 1.622-1.622zm-4.23 3.484c.896 0 1.622.726 1.622 1.622 0 .895-.726 1.621-1.622 1.621-.895 0-1.621-.726-1.621-1.621 0-.896.726-1.622 1.621-1.622zm8.46 0c.895 0 1.621.726 1.621 1.622 0 .895-.726 1.621-1.621 1.621-.896 0-1.622-.726-1.622-1.621 0-.896.726-1.622 1.622-1.622zm-4.23 3.484c.895 0 1.621.726 1.621 1.622 0 .895-.726 1.621-1.621 1.621-.896 0-1.622-.726-1.622-1.621 0-.896.726-1.622 1.622-1.622zm-4.23 0c.896 0 1.622.726 1.622 1.622 0 .895-.726 1.621-1.622 1.621-.895 0-1.621-.726-1.621-1.621 0-.896.726-1.622 1.621-1.622zm8.46 0c.895 0 1.621.726 1.621 1.622 0 .895-.726 1.621-1.621 1.621-.896 0-1.622-.726-1.622-1.621 0-.896.726-1.622 1.622-1.622z"/>
      </svg>
    ),
  },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function Avatar({ src, name, size = 40 }: { src: string | null; name: string | null; size?: number }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase()
  const imageUrl = ImageService.getImageUrl(src)
  return (
    <UiAvatar style={{ width: size, height: size }} className="flex-shrink-0">
      <AvatarImage src={imageUrl || "/placeholder-user.jpg"} alt={name ?? "Author"} className="object-cover" />
      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">{initials}</AvatarFallback>
    </UiAvatar>
  )
}

export default function CommunityClient() {
  const [directory, setDirectory] = useState<ForumDirectoryItem[]>([])
  const [activity, setActivity] = useState<ActivityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const [dirRes, actRes] = await Promise.all([
        ForumService.getForumDirectory({ limit: 200 }),
        ForumService.getRecentActivity(8),
      ])
      if (dirRes.success && dirRes.data) setDirectory(dirRes.data.items)
      if (actRes.success && actRes.data) setActivity(actRes.data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return directory
    return directory.filter(a =>
      (a.name ?? "").toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q)
    )
  }, [directory, search])

  useEffect(() => { setPage(1) }, [search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / FORUMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * FORUMS_PER_PAGE, page * FORUMS_PER_PAGE)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">

      <section className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
          Community
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Where FableSpace writers and readers connect, discuss, and grow together.
        </p>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Find us on
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PLATFORMS.map(p => (
            <Link
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-200 group ${p.bg}`}
            >
              {p.icon}
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{p.label}</p>
                <p className="text-sm text-muted-foreground truncate">{p.description}</p>
              </div>
              <ExternalLink className="ml-auto w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      <div className="w-full">
        <AdBanner type="banner" className="w-full max-w-[728px] h-[90px] mx-auto" slot="6596765108" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

        <section className="lg:col-span-3 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-xl font-semibold flex items-center gap-2 flex-shrink-0">
              <Users className="w-5 h-5 text-primary" />
              Author Forums
            </h2>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name or username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
              />
            </div>
            <span className="text-sm text-muted-foreground flex-shrink-0">
              {loading ? "Loading..." : `${filtered.length} found`}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/20 py-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">
                {search ? "No forums match your search" : "No author forums yet"}
              </p>
              {!search && (
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Enable yours in Settings to appear here.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginated.map(author => (
                  <Link
                    key={author.id}
                    href={`/user/${author.username}/forum`}
                    className="group flex items-start gap-3 px-4 py-4 rounded-xl border bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200"
                  >
                    <Avatar src={author.image} name={author.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                        {author.name ?? author.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">@{author.username}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {author.storyCount} {author.storyCount === 1 ? "story" : "stories"}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {author.postCount} {author.postCount === 1 ? "post" : "posts"}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => {
                      const p = i + 1
                      const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1
                      if (!show) {
                        if (p === 2 || p === totalPages - 1) {
                          return <span key={p} className="px-1 text-muted-foreground text-sm">...</span>
                        }
                        return null
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="lg:col-span-2 space-y-5">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h2>

          <AdBanner type="sidebar" className="w-full" slot="6596765108" />

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/20 py-10 text-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent posts yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map(post => (
                <Link
                  key={post.id}
                  href={`/user/${post.forum.author.username}/forum/comment/${post.slug}`}
                  className="group flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors duration-150"
                >
                  <Avatar src={post.author.image} name={post.author.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                      {post.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      in{" "}
                      <span className="font-medium text-foreground/70">
                        @{post.forum.author.username}
                      </span>{" "}
                      · {timeAgo(post.createdAt)}{" "}
                      {post._count.comments > 0 && (
                        <> · <MessageSquare className="inline w-3 h-3 -mt-0.5" /> {post._count.comments}</>
                      )}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="w-full pt-4">
        <AdBanner type="banner" className="w-full max-w-[728px] h-[90px] mx-auto" slot="6596765108" />
      </div>

    </div>
  )
}
