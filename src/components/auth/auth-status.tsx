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
import { useState } from 'react'
import LoginModal from '@/components/login-modal'

export default function AuthStatus() {
  const { data: session } = useSession()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  if (session?.user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative w-8 h-8 rounded-full">
            <Avatar>
              <AvatarImage src={session.user.image || ''} alt={session.user.name || 'User avatar'} />
              <AvatarFallback>
                {session.user.name?.[0] || session.user.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {session.user.name && <p className="font-medium">{session.user.name}</p>}
              {session.user.email && (
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {session.user.email}
                </p>
              )}
              {session.user.username && (
                <p className="text-sm text-muted-foreground">
                  @{session.user.username}
                </p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/dashboard">Dashboard</a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings">Settings</a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-600 cursor-pointer"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Button onClick={() => setIsLoginModalOpen(true)}>
        Sign In
      </Button>
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={() => setIsLoginModalOpen(false)}
      />
    </>
  )
} 