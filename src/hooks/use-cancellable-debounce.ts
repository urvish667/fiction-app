"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * A debounce hook that allows cancellation of pending debounce operations
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns [debouncedValue, cancelDebounce] - The debounced value and a function to cancel the debounce
 */
export function useCancellableDebounce<T>(value: T, delay: number): [T, () => void] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const valueRef = useRef<T>(value) // Store the latest value
  const mountedRef = useRef<boolean>(true) // Track if component is mounted

  // Update the ref whenever value changes
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Set mounted ref to false on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Function to cancel the current debounce timer
  const cancelDebounce = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    // Cancel any existing timer
    cancelDebounce()

    // Set a new timer
    timerRef.current = setTimeout(() => {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        // Use the latest value from the ref
        setDebouncedValue(valueRef.current)
      }
      timerRef.current = null
    }, delay)

    // Clean up on unmount or when dependencies change
    return cancelDebounce
  }, [value, delay, cancelDebounce])

  return [debouncedValue, cancelDebounce]
}
