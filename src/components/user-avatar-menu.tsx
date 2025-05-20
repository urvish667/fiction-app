"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookMarked, PenSquare, Bell, Settings, LogOut, Home, LayoutDashboard, FileEdit } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { logError } from "@/lib/error-logger"

interface UserAvatarMenuProps {
  user: {
    id: string
    name: string
    username: string
    avatar: string
    unreadNotifications: number
  }
  onLogout: () => void
}

export default function UserAvatarMenu({ user, onLogout }: UserAvatarMenuProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  // Log notification count for debugging
  useEffect(() => {
    console.log("Unread notifications count:", user.unreadNotifications);
  }, [user.unreadNotifications]);

  // Add pulsing animation effect for notification badge
  useEffect(() => {
    if (user.unreadNotifications > 0) {
      // Start pulsing animation
      const pulseInterval = setInterval(() => {
        setIsPulsing(prev => !prev)
      }, 2000) // Toggle every 2 seconds

      return () => clearInterval(pulseInterval)
    }
  }, [user.unreadNotifications])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      // Use callbackUrl to ensure proper redirection after logout
      await signOut({
        redirect: true,
        callbackUrl: "/"
      })
      // The following code won't execute due to the redirect: true above
      // It's kept as a fallback in case the redirect fails
      onLogout() // Notify parent component
    } catch (error) {
      logError(error, { context: "Logout error" })
      setIsLoggingOut(false)
      // Fallback manual navigation if signOut fails
      router.push("/")
      router.refresh()
    }
  }

  const menuItems = [
    {
      icon: <Home className="mr-2 h-4 w-4" />,
      label: "Profile",
      href: `/user/${user.username}`,
    },
    {
      icon: <BookMarked className="mr-2 h-4 w-4" />,
      label: "Library",
      href: "/library",
    },
    {
      icon: <PenSquare className="mr-2 h-4 w-4" />,
      label: "My Works",
      href: "/works",
    },
    {
      icon: <Bell className="mr-2 h-4 w-4" />,
      label: "Notifications",
      href: "/notifications",
      badge: user.unreadNotifications > 0 ? user.unreadNotifications : null,
    },
    {
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Settings className="mr-2 h-4 w-4" />,
      label: "Settings",
      href: "/settings",
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {user.unreadNotifications > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: isPulsing ? 1.1 : 1,
                }}
                exit={{
                  scale: 0,
                  opacity: 0
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
                className="absolute -right-2 -top-2"
              >
                <Badge
                  variant="destructive"
                  className={`flex items-center justify-center min-w-6 h-6 rounded-full px-2 text-xs font-bold shadow-lg border-2 border-background ${user.unreadNotifications > 99 ? 'px-1' : ''}`}
                >
                  {user.unreadNotifications > 99 ? '99+' : user.unreadNotifications}
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" alignOffset={-5} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="mt-2 mb-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground cursor-pointer"
          onSelect={() => {
            router.push("/write/story-info");
          }}
        >
          <div className="flex items-center justify-center py-1 w-full">
            <FileEdit className="mr-2 h-5 w-5" />
            <span className="font-medium">Start Writing</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              onSelect={() => {
                router.push(item.href);
              }}
              className="cursor-pointer"
            >
              <span className="flex items-center justify-between w-full">
                <span className="flex items-center">
                  {item.icon}
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="ml-2 px-1 py-0 h-5 min-w-[20px] flex items-center justify-center"
                  >
                    {item.badge}
                  </Badge>
                )}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

