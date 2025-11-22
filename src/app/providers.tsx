'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth-context'

type ProvidersProps = {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
