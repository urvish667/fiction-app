'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'
import CsrfProvider from '@/components/csrf-provider'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </AuthProvider>
  )
}
