"use client"

import Link from "next/link"
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
import { useAuth } from "@/lib/auth-context"

export default function Navbar() {
  const { user, isLoading, isAuthenticated, logout } = useAuth()

  // Create a component logger
  const navLogger = clientLogger.child("navbar")

  // Log session status in development only
  navLogger.debug("Auth status", { isAuthenticated, hasUser: !!user })

  const userWithAvatar = user
    ? {
        id: user.id,
        name:
          user.name && user.name.trim() !== ""
            ? user.name
            : "User",
        username:
          user.username ||
          user.name?.split(" ")[0].toLowerCase() ||
          "user",
        avatar: user.image || "/placeholder-user.jpg",
        unreadNotifications: 0,
      }
    : null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      navLogger.error("Logout failed", { error })
    }
  }

  if (isLoading) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-8 flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <motion.h1
              className="text-3xl font-bold font-serif"
              style={{ color: '#125ba5' }}
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
      <div className="max-w-7xl mx-auto px-4 py-8 flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <motion.h1
            className="text-3xl font-bold font-serif"
            style={{ color: '#125ba5' }}
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
