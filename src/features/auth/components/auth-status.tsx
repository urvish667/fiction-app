'use client'

import { useAuth } from '@/contexts/auth-context'
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
import { useRouter } from 'next/navigation'
import { clientLogger } from '@/lib/logger/client-logger'
import { ImageService } from '@/lib/api/images'

export function AuthStatus() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const getInitials = (currentUser: any): string => {
    if (!currentUser) return 'U'

    if (currentUser.username) {
      const usernameInitial = currentUser.username.charAt(0).toUpperCase()
      const parts = currentUser.username.split(/[-_.]/)
      if (parts.length > 1 && parts[1]) {
        return usernameInitial + parts[1].charAt(0).toUpperCase()
      }
      return usernameInitial
    }

    if (currentUser.name) {
      const nameParts = currentUser.name.split(' ')
      if (nameParts.length > 1) {
        return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
      }
      return nameParts[0].charAt(0).toUpperCase()
    }

    if (currentUser.email) {
      return currentUser.email.charAt(0).toUpperCase()
    }

    return 'U'
  }

  // Guard: Hydration gate
  if (!mounted) {
    return null
  }

  // Guard: Loading state
  if (isLoading) {
    return (
      <Button variant="ghost" className="relative w-8 h-8 rounded-full" disabled>
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
      </Button>
    )
  }

  // Guard: Anonymous state
  if (!user) {
    return (
      <Button asChild>
        <Link href="/login">
          Sign In
        </Link>
      </Button>
    )
  }

  const initials = getInitials(user)
  const authLogger = clientLogger.child('auth-status')
  authLogger.debug('User session loaded', {
    hasName: Boolean(user.name),
    hasUsername: Boolean(user.username),
    hasImage: Boolean(user.image),
    initials
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative w-8 h-8 rounded-full">
          <Avatar>
            {user.image ? (
              <AvatarImage
                src={ImageService.getImageUrl(user.image) || ''}
                alt={user.name || user.username || 'User avatar'}
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
            {user.image ? (
              <AvatarImage
                src={ImageService.getImageUrl(user.image) || ''}
                alt={user.name || user.username || 'User avatar'}
              />
            ) : null}
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {user.name && <p className="font-medium">{user.name}</p>}
            {user.username && (
              <p className="text-sm text-muted-foreground">
                @{user.username}
              </p>
            )}
            {user.email && (
              <p className="w-[200px] truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/dashboard')}
          className="cursor-pointer"
        >
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push('/settings')}
          className="cursor-pointer"
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await logout()
            router.push('/')
            router.refresh()
          }}
          className="text-destructive cursor-pointer focus:text-destructive"
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default AuthStatus
