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
      // Configure session behavior for better performance and reliability
      refetchWhenOffline={false}
      refetchInterval={5 * 60} // Reduce polling frequency to 5 minutes (in seconds)
      refetchOnWindowFocus={false} // Don't refetch on window focus to reduce unnecessary requests
    >
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  )
}
