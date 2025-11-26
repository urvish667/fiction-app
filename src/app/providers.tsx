'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import { NotificationProvider } from '@/contexts/notification-context'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        {children}
      </NotificationProvider>
    </AuthProvider>
  )
}
