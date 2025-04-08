"use client"

import { useState } from "react"
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
import { Search, Menu } from "lucide-react"
import { motion } from "framer-motion"
import LoginModal from "./login-modal"
import UserAvatarMenu from "./user-avatar-menu"
import { Skeleton } from "@/components/ui/skeleton"

export default function Navbar() {
  const { data: session, status } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

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
      <header className="px-8 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
        <div className="container flex h-16 items-center justify-between">
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
    <header className="px-8 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md">
      <div className="container flex h-16 items-center justify-between">
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
            <Button onClick={() => setShowLoginModal(true)}>Login / Signup</Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
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

                {isAuthenticated && session.user ? (
                  <>
                    <Link href={`/user/${session.user.name}`} className="text-lg font-medium">
                      Profile
                    </Link>
                    <Link href="/library" className="text-lg font-medium">
                      Library
                    </Link>
                    <Link href="/works" className="text-lg font-medium">
                      My Works
                    </Link>
                    <Link href="/notifications" className="text-lg font-medium flex items-center">
                      Notifications
                      {session.user.unreadNotifications > 0 && (
                        <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                          {session.user.unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <Link href="/settings" className="text-lg font-medium">
                      Settings
                    </Link>
                    <Link href="/dashboard" className="text-lg font-medium">
                      Dashboard
                    </Link>
                    <Button variant="ghost" onClick={handleLogout}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowLoginModal(true)}>Login / Signup</Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={() => setShowLoginModal(false)} />
    </header>
  )
}

