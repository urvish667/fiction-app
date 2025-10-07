'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { ensureCsrfToken, setCsrfToken } from '@/lib/client/csrf'
import { clientLogger } from '@/lib/logger/client-logger'

/**
 * CSRF Provider Component
 *
 * This component ensures that a CSRF token is set in the cookies
 * by making a request to the CSRF setup endpoint.
 * It also periodically refreshes the token to prevent expiration.
 */
export default function CsrfProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Create a component logger
  const csrfLogger = clientLogger.child('csrf-provider');

  // Set up CSRF token when the component mounts or pathname changes
  useEffect(() => {
    const setupCsrfToken = async () => {
      try {
        // Ensure we have a CSRF token
        const token = await ensureCsrfToken()
        csrfLogger.debug('CSRF token set up', { tokenLength: token.length })
      } catch (error) {
        csrfLogger.error('Error setting up CSRF token', { error })
      }
    }

    setupCsrfToken()
  }, [pathname])

  // Set up periodic token refresh (every 1 hour)
  useEffect(() => {
    const refreshToken = async () => {
      try {
        // This will automatically refresh if token is close to expiry
        await ensureCsrfToken()
        csrfLogger.debug('CSRF token refreshed')
      } catch (error) {
        csrfLogger.error('Error refreshing CSRF token', { error })
      }
    }

    // Refresh token every hour
    refreshIntervalRef.current = setInterval(refreshToken, 60 * 60 * 1000)

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [])

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

  // Set up visibility change listener to refresh token when tab becomes active
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          // Check and refresh token if needed when user returns to tab
          await ensureCsrfToken()
          csrfLogger.debug('CSRF token checked on tab focus')
        } catch (error) {
          csrfLogger.error('Error checking CSRF token on tab focus', { error })
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return <>{children}</>
}
