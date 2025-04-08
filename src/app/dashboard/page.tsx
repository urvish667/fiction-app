"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  LineChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  TrendingUp,
  Users,
  BookOpen,
  Heart,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PenSquare,
  BarChart3,
  BookText,
  UserPlus,
} from "lucide-react"
import Navbar from "@/components/navbar"
import { sampleStories } from "@/lib/sample-data"

// Mock data for dashboard
const dashboardData = {
  totalReads: 45678,
  totalLikes: 8943,
  totalComments: 2156,
  totalFollowers: 1243,
  totalEarnings: 1289.65,
  readsChange: 12.4,
  likesChange: 8.7,
  commentsChange: -3.2,
  followersChange: 5.6,
  earningsChange: 15.3,
  stories: sampleStories.slice(0, 5).map((story) => ({
    ...story,
    earnings: Math.floor(Math.random() * 300) + 50,
  })),
}

// Mock data for charts
const readsData = [
  { name: "Jan", reads: 4000 },
  { name: "Feb", reads: 3000 },
  { name: "Mar", reads: 5000 },
  { name: "Apr", reads: 4500 },
  { name: "May", reads: 6000 },
  { name: "Jun", reads: 5500 },
  { name: "Jul", reads: 7000 },
]

const engagementData = [
  { name: "Jan", likes: 2400, comments: 400 },
  { name: "Feb", likes: 1800, comments: 300 },
  { name: "Mar", likes: 3000, comments: 500 },
  { name: "Apr", likes: 2700, comments: 450 },
  { name: "May", likes: 3600, comments: 600 },
  { name: "Jun", likes: 3300, comments: 550 },
  { name: "Jul", likes: 4200, comments: 700 },
]

const earningsData = [
  { name: "Jan", earnings: 250 },
  { name: "Feb", earnings: 180 },
  { name: "Mar", earnings: 300 },
  { name: "Apr", earnings: 270 },
  { name: "May", earnings: 360 },
  { name: "Jun", earnings: 330 },
  { name: "Jul", earnings: 420 },
]

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("30days")
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your stories and track performance</p>
          </div>

          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
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

            <Button asChild className="border-2 border-primary">
              <Link href="/write/story-info">
                <PenSquare className="h-4 w-4 mr-2" />
                New Story
              </Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stories">Stories</TabsTrigger>
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatsCard
                  title="Total Reads"
                  value={dashboardData.totalReads.toLocaleString()}
                  change={dashboardData.readsChange}
                  icon={<BookOpen className="h-4 w-4" />}
                />
                <StatsCard
                  title="Total Likes"
                  value={dashboardData.totalLikes.toLocaleString()}
                  change={dashboardData.likesChange}
                  icon={<Heart className="h-4 w-4" />}
                />
                <StatsCard
                  title="Comments"
                  value={dashboardData.totalComments.toLocaleString()}
                  change={dashboardData.commentsChange}
                  icon={<MessageSquare className="h-4 w-4" />}
                />
                <StatsCard
                  title="Followers"
                  value={dashboardData.totalFollowers.toLocaleString()}
                  change={dashboardData.followersChange}
                  icon={<Users className="h-4 w-4" />}
                />
                <StatsCard
                  title="Earnings"
                  value={`$${dashboardData.totalEarnings.toLocaleString()}`}
                  change={dashboardData.earningsChange}
                  icon={<DollarSign className="h-4 w-4" />}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Reads Over Time</CardTitle>
                    <CardDescription>Total story views for the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={readsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="reads" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement</CardTitle>
                    <CardDescription>Likes and comments on your stories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="likes" fill="hsl(var(--primary))" />
                          <Bar dataKey="comments" fill="hsl(var(--secondary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performing Stories */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Stories</CardTitle>
                  <CardDescription>Your most popular stories based on reads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Story</th>
                          <th className="text-right py-3 px-2">Reads</th>
                          <th className="text-right py-3 px-2">Likes</th>
                          <th className="text-right py-3 px-2">Comments</th>
                          <th className="text-right py-3 px-2">Earnings</th>
                          <th className="text-right py-3 px-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.stories.map((story) => (
                          <tr key={story.id} className="border-b">
                            <td className="py-3 px-2">
                              <Link href={`/story/${story.id}`} className="font-medium hover:text-primary">
                                {story.title}
                              </Link>
                              <div className="text-xs text-muted-foreground">{story.genre}</div>
                            </td>
                            <td className="text-right py-3 px-2">{story.reads.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">{story.likes.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">{story.comments.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">${story.earnings.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/story/${story.id}`}>
                                    <BookOpen className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/dashboard/analytics/${story.id}`}>
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="sr-only">Analytics</span>
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="stories">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Stories</h2>
                <Button asChild>
                  <Link href="/works">
                    <BookText className="h-4 w-4 mr-2" />
                    Manage All Stories
                  </Link>
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-4 px-6">Story</th>
                          <th className="text-center py-4 px-4">Status</th>
                          <th className="text-right py-4 px-4">Reads</th>
                          <th className="text-right py-4 px-4">Likes</th>
                          <th className="text-right py-4 px-4">Comments</th>
                          <th className="text-right py-4 px-4">Last Updated</th>
                          <th className="text-right py-4 px-6">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.stories.map((story, index) => (
                          <tr key={story.id} className="border-b hover:bg-muted/50">
                            <td className="py-4 px-6">
                              <Link href={`/story/${story.id}`} className="font-medium hover:text-primary">
                                {story.title}
                              </Link>
                              <div className="text-xs text-muted-foreground">{story.genre}</div>
                            </td>
                            <td className="text-center py-4 px-4">
                              <Badge variant={index < 4 ? "default" : "outline"}>
                                {index < 4 ? "Published" : "Draft"}
                              </Badge>
                            </td>
                            <td className="text-right py-4 px-4">{story.reads.toLocaleString()}</td>
                            <td className="text-right py-4 px-4">{story.likes.toLocaleString()}</td>
                            <td className="text-right py-4 px-4">{story.comments.toLocaleString()}</td>
                            <td className="text-right py-4 px-4">{story.date.toLocaleDateString()}</td>
                            <td className="text-right py-4 px-6">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/story/${story.id}`}>
                                    <BookOpen className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/write/editor/${story.id}`}>
                                    <PenSquare className="h-4 w-4" />
                                    <span className="sr-only">Edit</span>
                                  </Link>
                                </Button>
                                <Button variant="ghost" size="icon" asChild>
                                  <Link href={`/dashboard/analytics/${story.id}`}>
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="sr-only">Analytics</span>
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="earnings">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${dashboardData.totalEarnings.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Lifetime earnings from all stories</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available for Withdrawal</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$842.50</div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">Next payout: 15th of the month</p>
                      <Button size="sm">Withdraw</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$215.75</div>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">+12.5%</span>
                      <span className="text-xs text-muted-foreground ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Earnings Over Time</CardTitle>
                  <CardDescription>Your earnings for the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={earningsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                        <Legend />
                        <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnings by Story</CardTitle>
                  <CardDescription>How much each story has earned</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Story</th>
                          <th className="text-right py-3 px-2">Reads</th>
                          <th className="text-right py-3 px-2">Earnings</th>
                          <th className="text-right py-3 px-2">Earnings per 1k Reads</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dashboardData.stories.map((story) => (
                          <tr key={story.id} className="border-b">
                            <td className="py-3 px-2">
                              <Link href={`/story/${story.id}`} className="font-medium hover:text-primary">
                                {story.title}
                              </Link>
                              <div className="text-xs text-muted-foreground">{story.genre}</div>
                            </td>
                            <td className="text-right py-3 px-2">{story.reads.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">${story.earnings.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">
                              ${((story.earnings / story.reads) * 1000).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="audience">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboardData.totalFollowers.toLocaleString()}</div>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">+{dashboardData.followersChange}%</span>
                      <span className="text-xs text-muted-foreground ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">New Followers</CardTitle>
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">124</div>
                    <p className="text-xs text-muted-foreground">New followers this month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8.7%</div>
                    <div className="flex items-center mt-1">
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">+1.2%</span>
                      <span className="text-xs text-muted-foreground ml-1">from last month</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Audience Demographics</CardTitle>
                    <CardDescription>Age and gender distribution of your readers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { age: "13-17", male: 200, female: 300, other: 50 },
                            { age: "18-24", male: 800, female: 1200, other: 200 },
                            { age: "25-34", male: 1200, female: 1500, other: 300 },
                            { age: "35-44", male: 700, female: 900, other: 150 },
                            { age: "45-54", male: 400, female: 500, other: 100 },
                            { age: "55+", male: 200, female: 300, other: 50 },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="age" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="male" fill="#3b82f6" />
                          <Bar dataKey="female" fill="#ec4899" />
                          <Bar dataKey="other" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Geographic Distribution</CardTitle>
                    <CardDescription>Where your readers are located</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2">Country</th>
                            <th className="text-right py-3 px-2">Readers</th>
                            <th className="text-right py-3 px-2">Percentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { country: "United States", readers: 15420, percentage: 33.8 },
                            { country: "United Kingdom", readers: 6540, percentage: 14.3 },
                            { country: "Canada", readers: 4320, percentage: 9.5 },
                            { country: "Australia", readers: 3650, percentage: 8.0 },
                            { country: "Germany", readers: 2840, percentage: 6.2 },
                            { country: "France", readers: 2150, percentage: 4.7 },
                            { country: "India", readers: 1980, percentage: 4.3 },
                            { country: "Other", readers: 8778, percentage: 19.2 },
                          ].map((item) => (
                            <tr key={item.country} className="border-b">
                              <td className="py-3 px-2 font-medium">{item.country}</td>
                              <td className="text-right py-3 px-2">{item.readers.toLocaleString()}</td>
                              <td className="text-right py-3 px-2">{item.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

function StatsCard({ title, value, change, icon }: StatsCardProps) {
  const isPositive = change >= 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center mt-1">
          {isPositive ? (
            <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-xs ${isPositive ? "text-green-500" : "text-red-500"} font-medium`}>
            {isPositive ? "+" : ""}
            {change}%
          </span>
          <span className="text-xs text-muted-foreground ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  )
}

