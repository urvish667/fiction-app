/**
 * Time utility functions for scheduling and time management
 */

import { format } from "date-fns"

/**
 * Generate 15-minute time intervals for the entire day
 * @returns Array of time intervals with value (HH:mm) and label (h:mm a)
 */
export function generateTimeIntervals() {
  const intervals = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const displayTime = format(new Date(2000, 0, 1, hour, minute), 'h:mm a')
      intervals.push({ value: timeString, label: displayTime })
    }
  }
  return intervals
}

/**
 * Get the current time rounded to the next 15-minute interval
 * @returns Date object rounded to next quarter hour
 */
export function getNextQuarterHour() {
  const now = new Date()
  const minutes = now.getMinutes()
  const roundedMinutes = Math.ceil(minutes / 15) * 15

  if (roundedMinutes >= 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0)
  } else {
    now.setMinutes(roundedMinutes, 0, 0)
  }

  return now
}

/**
 * Round a given time to the nearest 15-minute interval
 * @param date The date to round
 * @returns Date object rounded to nearest quarter hour
 */
export function roundToNearestQuarterHour(date: Date) {
  const newDate = new Date(date)
  const minutes = newDate.getMinutes()
  const roundedMinutes = Math.round(minutes / 15) * 15

  if (roundedMinutes >= 60) {
    newDate.setHours(newDate.getHours() + 1, 0, 0, 0)
  } else {
    newDate.setMinutes(roundedMinutes, 0, 0)
  }

  return newDate
}

/**
 * Check if a time is on a 15-minute interval
 * @param date The date to check
 * @returns True if the time is on a 15-minute interval
 */
export function isOnQuarterHour(date: Date) {
  return date.getMinutes() % 15 === 0 && date.getSeconds() === 0
}

/**
 * Get common scheduling presets
 * @returns Array of preset scheduling options
 */
export function getSchedulingPresets() {
  const nextQuarter = getNextQuarterHour()

  const tomorrow9am = new Date()
  tomorrow9am.setDate(tomorrow9am.getDate() + 1)
  tomorrow9am.setHours(9, 0, 0, 0)

  const nextWeek9am = new Date()
  nextWeek9am.setDate(nextWeek9am.getDate() + 7)
  nextWeek9am.setHours(9, 0, 0, 0)

  return [
    {
      label: "Next 15 minutes",
      value: nextQuarter,
      description: format(nextQuarter, 'h:mm a')
    },
    {
      label: "Tomorrow 9 AM",
      value: tomorrow9am,
      description: format(tomorrow9am, 'MMM d, h:mm a')
    },
    {
      label: "Next week 9 AM",
      value: nextWeek9am,
      description: format(nextWeek9am, 'MMM d, h:mm a')
    }
  ]
}

/**
 * Validate that a scheduled time is valid for publishing
 * @param date The date to validate
 * @returns Object with isValid boolean and error message if invalid
 */
export function validateScheduledTime(date: Date) {
  const now = new Date()

  // Check if the date is in the future
  if (date <= now) {
    return {
      isValid: false,
      error: "Publication time must be in the future"
    }
  }

  // Check if the date is too far in the future (more than 1 year)
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  if (date > oneYearFromNow) {
    return {
      isValid: false,
      error: "Publication date cannot be more than 1 year in the future"
    }
  }

  // Check if the time is on a 15-minute interval
  if (!isOnQuarterHour(date)) {
    return {
      isValid: false,
      error: "Publication time must be on a 15-minute interval"
    }
  }

  return {
    isValid: true,
    error: null
  }
}

/**
 * Format a scheduled time for display
 * @param date The date to format
 * @param includeTimezone Whether to include timezone information
 * @returns Formatted string
 */
export function formatScheduledTime(date: Date, includeTimezone = false) {
  const baseFormat = format(date, 'MMM d, yyyy \'at\' h:mm a')

  if (includeTimezone) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    return `${baseFormat} (${timezone})`
  }

  return baseFormat
}
