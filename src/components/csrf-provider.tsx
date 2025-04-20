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

  useEffect(() => {
    // Function to set up CSRF token
    const setupCsrfToken = async () => {
      try {
        // Ensure we have a CSRF token
        const token = await ensureCsrfToken()
        console.log('CSRF token set up successfully:', token.substring(0, 10) + '...')
      } catch (error) {
        console.error('Error setting up CSRF token:', error)
      }
    }

    // Set up CSRF token when the component mounts or pathname changes
    setupCsrfToken()

    // Also set up a listener for the storage event to sync tokens across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'fablespace_csrf' && event.newValue) {
        setCsrfToken(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [pathname])

  return <>{children}</>
}
