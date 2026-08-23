"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout";
import { useRequireAuth } from "@/features/auth";
import { DashboardHeader, DashboardTabs } from "@/features/dashboard";

export default function DashboardPage() {
  const { isLoading } = useRequireAuth();
  const [timeRange, setTimeRange] = useState("30days");
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <DashboardHeader timeRange={timeRange} setTimeRange={setTimeRange} />
          <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} timeRange={timeRange} />
        </div>
      </main>
    </div>
  );
}
