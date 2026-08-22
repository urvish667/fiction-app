"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookMarked, Bell, Settings, LogOut, Home, LayoutDashboard, Moon, Sun, Monitor, Sparkles, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { logError, logInfo } from "@/lib/error-logger"
import { ImageService } from "@/lib/api/images"
import { getStudioUrl } from "@/lib/utils"

interface MenuItem {
  icon: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  badge?: number | null
}

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
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isPulsing, setIsPulsing] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
      onLogout() // Notify parent component
      router.push("/")
      router.refresh()
    } catch (error) {
      logError(error, { context: "Logout error" })
      setIsLoggingOut(false)
      // Fallback manual navigation if logout fails
      router.push("/")
      router.refresh()
    }
  }

  const menuItems: MenuItem[] = [
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
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      icon: <Bell className="mr-2 h-4 w-4" />,
      label: "Notifications",
      href: "/notifications",
      badge: user.unreadNotifications > 0 ? user.unreadNotifications : null,
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
        <Button variant="ghost" className="relative h-8 w-8 md:h-9 md:w-9 rounded-full p-0">
          <div className="relative flex items-center justify-center h-full w-full">
            <Avatar className="h-8 w-8 md:h-9 md:w-9">
              <AvatarImage src={ImageService.getImageUrl(user.avatar) || "/placeholder-user.jpg"} alt={user.name} />
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
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end" alignOffset={-5} forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.name && user.name.trim() !== '' && user.name !== 'User' ? user.name : 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">@{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuItem
          className="mt-2 mb-1 bg-[#125ba5] hover:bg-[#0e4a8a] focus:bg-[#0e4a8a] text-white hover:text-white focus:text-white data-[highlighted]:bg-[#0e4a8a] data-[highlighted]:text-white cursor-pointer rounded-md p-2.5 shadow-sm transition-colors"
          onSelect={() => {
            window.location.href = getStudioUrl();
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-white/20 text-white">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold text-xs leading-none text-white">FableSpace Studio</span>
                <span className="text-[10px] text-white/80 leading-tight mt-0.5">Author Workspace</span>
              </div>
            </div>
            <ExternalLink className="h-3.5 w-3.5 text-white/80" />
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {menuItems.map((item) => (
            <DropdownMenuItem
              key={item.label}
              onSelect={() => {
                if (item.onClick) {
                  item.onClick()
                } else if (item.href) {
                  router.push(item.href);
                }
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="cursor-pointer">
            {theme === "dark" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : theme === "light" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isLoggingOut} onSelect={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

