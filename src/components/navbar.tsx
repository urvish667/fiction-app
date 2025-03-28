"use client"

import { useState } from "react"
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
import { Search, Menu } from "lucide-react"
import { motion } from "framer-motion"
import LoginModal from "./login-modal"
import UserAvatarMenu from "./user-avatar-menu"

// Mock user data for demonstration
const mockUser = {
  id: "user_1",
  name: "James Watson",
  username: "jwatson213",
  avatar: "/placeholder-user.jpg",
  isWriter: true,
  unreadNotifications: 3,
}

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [user, setUser] = useState(mockUser)

  // Toggle login state (for demo purposes)
  const handleLogin = () => {
    setIsLoggedIn(true)
    setShowLoginModal(false)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
  }

  return (
    <header className="px-8 sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
              <NavigationMenuItem>
                <Link href="/search" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Search className="h-4 w-4 mr-1" />
                    Search
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {isLoggedIn ? (
            <UserAvatarMenu user={user} onLogout={handleLogout} />
          ) : (
            <Button onClick={() => setShowLoginModal(true)}>Login</Button>
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
                <Link href="/search" className="text-lg font-medium">
                  Search
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link href={`/user/${user.username}`} className="text-lg font-medium">
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
                      {user.unreadNotifications > 0 && (
                        <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                          {user.unreadNotifications}
                        </span>
                      )}
                    </Link>
                    <Link href="/settings" className="text-lg font-medium">
                      Settings
                    </Link>
                    {user.isWriter && (
                      <Link href="/dashboard" className="text-lg font-medium">
                        Dashboard
                      </Link>
                    )}
                    <Button variant="ghost" onClick={handleLogout}>
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setShowLoginModal(true)}>Login</Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
    </header>
  )
}

