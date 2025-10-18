"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { motion } from "framer-motion"
import UserAvatarMenu from "./user-avatar-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { clientLogger } from "@/lib/logger/client-logger"

export default function Navbar() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  // Create a component logger
  const navLogger = clientLogger.child("navbar")

  // Log session status in development only
  navLogger.debug("Session status", { status, hasUser: !!session?.user })

  const userWithAvatar = session?.user
    ? {
        id: session.user.id,
        name:
          session.user.name && session.user.name.trim() !== ""
            ? session.user.name
            : "User",
        username:
          session.user.username ||
          session.user.name?.split(" ")[0].toLowerCase() ||
          "user",
        avatar: session.user.image || "/placeholder-user.jpg",
        unreadNotifications: session.user.unreadNotifications || 0,
      }
    : null

  const handleLogout = () => {
    // NextAuth signOut will be handled by UserAvatarMenu
  }

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
        <div className="w-full max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center">
            <motion.h1
              className="text-2xl font-bold font-serif"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              FableSpace
            </motion.h1>
          </Link>
          <div className="hidden md:flex md:gap-6 items-center">
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="w-full max-w-screen-2xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <motion.h1
            className="text-2xl font-bold font-serif"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            FableSpace
          </motion.h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:gap-6 items-center">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                  <Link href="/browse">Browse</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>


          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 ml-auto">
          {/* Show user avatar on mobile if authenticated, otherwise show login/signup buttons */}
          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-0">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-6 py-6">
                <Link href="/" className="text-lg font-medium hover:text-primary transition-colors">
                  Home
                </Link>
                <Link href="/browse" className="text-lg font-medium hover:text-primary transition-colors">
                  Browse
                </Link>
                {!isAuthenticated && (
                  <>
                    <Link href="/login" className="text-lg font-medium hover:text-primary transition-colors">
                      Login
                    </Link>
                    <Link href="/signup" className="text-lg font-medium hover:text-primary transition-colors">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
