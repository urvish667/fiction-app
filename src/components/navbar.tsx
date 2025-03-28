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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import LoginModal from "./login-modal"
import { motion } from "framer-motion"

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Toggle login state (for demo purposes)
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn)
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="User" />
                    <AvatarFallback>US</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/my-stories">My Stories</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/bookmarks">Bookmarks</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleLogin}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                    <Link href="/profile" className="text-lg font-medium">
                      Profile
                    </Link>
                    <Link href="/my-stories" className="text-lg font-medium">
                      My Stories
                    </Link>
                    <Button variant="ghost" onClick={toggleLogin}>
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
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setIsLoggedIn(true)
          setShowLoginModal(false)
        }}
      />
    </header>
  )
}

