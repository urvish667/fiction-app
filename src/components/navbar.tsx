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
  const navLogger = clientLogger.child('navbar');

  // Log session status in development only
  navLogger.debug('Session status', { status, hasUser: !!session?.user });

  const userWithAvatar = session?.user ? {
    id: session.user.id,
    name: session.user.name || 'User',
    username: session.user.username || session.user.name?.split(' ')[0].toLowerCase() || 'user',
    avatar: session.user.image || '/placeholder-user.jpg',
    unreadNotifications: session.user.unreadNotifications || 0
  } : null

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
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/browse" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Browse</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <Button asChild>
              <Link href="/login">Login / Signup</Link>
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center space-x-1 ml-auto">
          {/* Show user avatar on mobile if authenticated, otherwise show login button */}
          {isAuthenticated && userWithAvatar ? (
            <UserAvatarMenu user={userWithAvatar} onLogout={handleLogout} />
          ) : (
            <Button size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
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
                <Link href="/" className="text-lg font-medium">
                  Home
                </Link>
                <Link href="/browse" className="text-lg font-medium">
                  Browse
                </Link>

                {/* No need to duplicate user menu items here since we have the avatar menu on mobile */}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

