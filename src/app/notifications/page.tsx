import type { Metadata } from "next"
import { NotificationsPageClient } from "@/features/notifications"

export const metadata: Metadata = {
  title: "Notifications - FableSpace",
  description: "View updates, comments, and interactions on your FableSpace stories.",
}

export default function NotificationsPage() {
  return <NotificationsPageClient />
}
