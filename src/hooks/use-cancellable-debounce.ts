"use client"

import { useState, useEffect, useRef } from 'react'

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

  // Update the ref whenever value changes
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Function to cancel the current debounce timer
  const cancelDebounce = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    // Cancel any existing timer
    cancelDebounce()

    // Set a new timer
    timerRef.current = setTimeout(() => {
      // Use the latest value from the ref
      setDebouncedValue(valueRef.current)
      timerRef.current = null
      console.log('Debounce timer completed, updating debounced value')
    }, delay)

    // Clean up on unmount or when dependencies change
    return cancelDebounce
  }, [value, delay])

  return [debouncedValue, cancelDebounce]
}
