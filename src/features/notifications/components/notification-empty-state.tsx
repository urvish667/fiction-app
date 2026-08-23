"use client"

import React from "react"
import { Bell } from "lucide-react"

export function NotificationEmptyState() {
  return (
    <div className="text-center py-12 bg-muted/30 rounded-lg">
      <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">No notifications</h3>
      <p className="text-muted-foreground">
        You don&apos;t have any notifications yet.
      </p>
    </div>
  )
}

export default NotificationEmptyState
