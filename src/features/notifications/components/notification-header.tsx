"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { ConnectionStatusIndicator } from "./connection-status"
import type { NotificationHeaderProps } from "../types/notification.types"

export function NotificationHeader({ onMarkAllAsRead, hasUnread }: NotificationHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-semibold">Notifications</h1>
        <ConnectionStatusIndicator />
      </div>

      <Button
        variant="outline"
        onClick={onMarkAllAsRead}
        disabled={!hasUnread}
      >
        <Check className="h-4 w-4 mr-2" />
        Mark all as read and dismiss
      </Button>
    </div>
  )
}

export default NotificationHeader
