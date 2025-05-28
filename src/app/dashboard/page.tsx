"use client"

import { useState } from "react"
import Navbar from "@/components/navbar"

// Import dashboard components
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 md:px-8 py-4 md:py-8">
        <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />

        <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} timeRange={timeRange} />
      </main>
    </div>
  )
}
