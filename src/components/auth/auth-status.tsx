'use client'

import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AuthStatus() {
  const { data: session, status } = useSession()
  const [mounted, setMounted] = useState(false)

  // Add useEffect to handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Function to get initials from username or name
  const getInitials = (user: any) => {
    // Always return at least one character
    if (!user) return 'U'

    // Try username first
    if (user.username) {
      const usernameInitial = user.username.charAt(0).toUpperCase()
      // If username has multiple parts (separated by special chars), get second initial
      const parts = user.username.split(/[-_.]/)
      if (parts.length > 1 && parts[1]) {
        return usernameInitial + parts[1].charAt(0).toUpperCase()
      }
      // Otherwise just return the first character
      return usernameInitial
    }

    // Try name second
    if (user.name) {
      const nameParts = user.name.split(' ')
      if (nameParts.length > 1) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
      }
      return nameParts[0].charAt(0).toUpperCase()
    }

    // Finally try email
    if (user.email) {
      return user.email.charAt(0).toUpperCase()
    }

    // Ultimate fallback
    return 'U'
  }

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  // Show loading state
  if (status === "loading") {
    return (
      <Button variant="ghost" className="relative w-8 h-8 rounded-full" disabled>
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  if (session?.user) {
    const initials = getInitials(session.user)
    console.log('User session:', session.user) // Debug log
    console.log('Generated initials:', initials) // Debug log

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative w-8 h-8 rounded-full">
            <Avatar>
              {session.user.image ? (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name || session.user.username || 'User avatar'}
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <Avatar className="h-8 w-8">
              {session.user.image ? (
                <AvatarImage
                  src={session.user.image}
                  alt={session.user.name || session.user.username || 'User avatar'}
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none">
              {session.user.name && <p className="font-medium">{session.user.name}</p>}
              {session.user.username && (
                <p className="text-sm text-muted-foreground">
                  @{session.user.username}
                </p>
              )}
              {session.user.email && (
                <p className="w-[200px] truncate text-xs text-muted-foreground">
                  {session.user.email}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/dashboard" className="w-full cursor-pointer">Dashboard</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings" className="w-full cursor-pointer">Settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-destructive cursor-pointer focus:text-destructive"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <Button asChild>
      <Link href="/login">
        Sign In
      </Link>
    </Button>
  )
}