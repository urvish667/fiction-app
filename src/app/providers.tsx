'use client'

import { ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import CsrfProvider from '@/components/csrf-provider'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  )
}
