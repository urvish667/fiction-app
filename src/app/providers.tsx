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
      // Disable automatic polling completely to prevent Redis connection cycling
      // Manual refreshes will be handled by useOptimizedSession hook
      refetchInterval={0}
      // Keep refetchOnWindowFocus disabled to prevent refreshes when window regains focus
      refetchOnWindowFocus={false}
      // Only refetch when the session is about to expire
      refetchWhenOffline={false}
    >
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  )
}
