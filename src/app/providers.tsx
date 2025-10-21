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
      refetchInterval={0} // Disable automatic polling to prevent unnecessary callback calls
      refetchOnWindowFocus={true} // Enable refetch on window focus to ensure session is synced after login
    >
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  )
}
