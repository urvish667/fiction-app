'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import CsrfProvider from '@/components/csrf-provider'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // Use default NextAuth polling behavior for better compatibility
      // This is more reliable in production environments
      // Don't refetch when offline
      refetchWhenOffline={false}
    >
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  )
}
