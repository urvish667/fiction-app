'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ensureCsrfToken, setCsrfToken } from '@/lib/client/csrf'

/**
 * CSRF Provider Component
 *
 * This component ensures that a CSRF token is set in the cookies
 * by making a request to the CSRF setup endpoint.
 */
export default function CsrfProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Set up CSRF token when the component mounts or pathname changes
  useEffect(() => {
    const setupCsrfToken = async () => {
      try {
        // Ensure we have a CSRF token
        const token = await ensureCsrfToken()
        console.log('CSRF token set up successfully:', token.substring(0, 10) + '...')
      } catch (error) {
        console.error('Error setting up CSRF token:', error)
      }
    }

    setupCsrfToken()
  }, [pathname])

  // Set up storage event listener only once when component mounts
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'fablespace_csrf' && event.newValue) {
        setCsrfToken(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return <>{children}</>
}
