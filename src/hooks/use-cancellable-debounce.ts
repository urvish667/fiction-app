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
      setDebouncedValue(value)
      timerRef.current = null
    }, delay)
    
    // Clean up on unmount or when dependencies change
    return cancelDebounce
  }, [value, delay])
  
  return [debouncedValue, cancelDebounce]
}
