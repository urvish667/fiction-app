"use client"

import React from "react"

export function NotificationSkeleton() {
  return (
    <div className="flex justify-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading notifications...</p>
      </div>
    </div>
  )
}

export default NotificationSkeleton
