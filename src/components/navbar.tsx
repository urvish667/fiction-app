"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import UserAvatarMenu from "./user-avatar-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { clientLogger } from "@/lib/logger/client-logger"
import { useAuth } from "@/lib/auth-context"
import { useNotificationContext } from "@/contexts/notification-context"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Browse", href: "/browse" },
  { label: "Community", href: "/community" },
]

/** Returns true when the navbar is overlaid on top of the hero (home page). */
function useIsHero() {
  const pathname = usePathname()
  return pathname === "/"
}

export default function Navbar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const { unreadCount } = useNotificationContext()
  const isHero = useIsHero()

  const navLogger = clientLogger.child("navbar")
  navLogger.debug("Auth status", { isAuthenticated, hasUser: !!user })

  const userWithAvatar = user
    ? {
      id: user.id,
      name: user.name?.trim() || "User",
      username:
        user.username ||
        user.name?.split(" ")[0].toLowerCase() ||
        "user",
      avatar: user.image || "/placeholder-user.jpg",
      unreadNotifications: unreadCount,
    }
    : null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      navLogger.error("Logout failed", { error })
    }
  }

  // ── Shared styles ──────────────────────────────────────────────────────────
  // On the hero page the navbar sits absolutely on top of the video.
  // Everywhere else it's a normal sticky header.
  const headerClass = isHero
    ? "absolute top-0 left-0 w-full z-50 bg-transparent"
    : "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm"

  const linkClass = isHero
    ? "text-white/90 hover:text-white hover:bg-white/10"
    : "text-foreground/80 hover:text-foreground hover:bg-muted"

  const logoColor = isHero ? "#ffffff" : "#125ba5"

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <header className={headerClass}>
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex h-16 items-center justify-between">
          <LogoMark color={logoColor} />
          <Skeleton className="h-8 w-48 opacity-40" />
        </div>
      </header>
    )
  }

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex h-16 items-center justify-between gap-4 relative">

        {/* ── Logo ── */}
        <LogoMark color={logoColor} />

        {/* ── Desktop centre nav ── */}
        <nav
          className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "'Inter', sans-serif" }}
          aria-label="Primary navigation"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${linkClass}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* ── Desktop right: auth ── */}
        <div
          className="hidden md:flex items-center gap-2"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <>
              <Link
                href="/login"
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${linkClass}`}
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-150
                  bg-[#125ba5] hover:bg-[#0e4a8a] active:scale-95 text-white shadow-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile: avatar + hamburger ── */}
        <div
          className="md:hidden flex items-center gap-2 ml-auto"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <Link
              href="/login"
              className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${linkClass}`}
            >
              Login
            </Link>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`rounded-full ${isHero ? "text-white hover:bg-white/10" : ""}`}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-64">
              <div
                className="flex flex-col gap-1 pt-8"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {NAV_LINKS.map(({ label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="px-4 py-2.5 rounded-lg text-base font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link
                    href="/signup"
                    className="mt-4 mx-4 py-2.5 rounded-full text-center text-sm font-semibold
                      bg-[#125ba5] text-white hover:bg-[#0e4a8a] transition-colors"
                  >
                    Sign Up
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>
    </header>
  )
}

// ── Sub-component: logo ────────────────────────────────────────────────────
function LogoMark({ color }: { color: string }) {
  return (
    <Link href="/" className="flex-shrink-0">
      <span
        className="text-xl md:text-2xl font-bold select-none logo-slide-in"
        style={{
          color,
          fontFamily: "Georgia, serif",
          letterSpacing: "-0.01em",
          display: "inline-block",
        }}
      >
        FableSpace
      </span>
    </Link>
  )
}

