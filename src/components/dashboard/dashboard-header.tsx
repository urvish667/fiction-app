"use client"

import Link from "next/link"
import { PenSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DashboardHeaderProps {
  timeRange: string
  setTimeRange: (value: string) => void
}

export function DashboardHeader({ timeRange, setTimeRange }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Dashboard</h1>
        <p className="text-sm md:text-base text-muted-foreground">Manage your stories and track performance</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild className="border-2 border-primary w-full sm:w-auto">
          <Link href="/write/story-info">
            <PenSquare className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Story</span>
            <span className="sm:hidden">New</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}
