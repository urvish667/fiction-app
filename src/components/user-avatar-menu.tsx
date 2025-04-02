"use client"

import { useState } from "react"
import Link from "next/link"
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
import { BookMarked, PenSquare, Bell, Settings, LogOut, Home, LayoutDashboard } from "lucide-react"
import { motion } from "framer-motion"

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut({ redirect: false })
      onLogout() // Notify parent component
      router.push("/") // Redirect to home page
      router.refresh() // Refresh the page to update auth state
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      setIsLoggingOut(false)
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
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {user.unreadNotifications > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1"
            >
              <Badge variant="destructive" className="h-4 w-4 rounded-full p-0 text-[10px]">
                {user.unreadNotifications}
              </Badge>
            </motion.div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item) => (
            <DropdownMenuItem key={item.href} asChild>
              <Link href={item.href} className="flex items-center justify-between cursor-pointer">
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
              </Link>
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

