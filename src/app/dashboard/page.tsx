"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"
import { useRequireAuth } from "@/hooks/use-require-auth"

// Import dashboard components
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth()
  const [timeRange, setTimeRange] = useState("30days")
  const [activeTab, setActiveTab] = useState("overview")

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />

          <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} timeRange={timeRange} />
        </div>
      </main>
    </div>
  )
}
