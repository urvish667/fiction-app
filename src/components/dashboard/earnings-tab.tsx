"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

import { useEarningsData } from "@/hooks/use-earnings-data"
import { formatStatNumber } from "@/utils/number-utils"

export function EarningsTab({ timeRange = '30days' }: { timeRange?: string }) {
  const { data, isLoading, isLoadingMore, error, loadMoreTransactions } = useEarningsData(timeRange);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button variant="link" className="p-0 h-auto font-normal" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mb-2" />
            ) : (
              <div className="text-2xl font-bold">${formatStatNumber(data?.totalEarnings || 0)}</div>
            )}
            <p className="text-xs text-muted-foreground">Lifetime earnings from all stories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">${formatStatNumber(data?.thisMonthEarnings || 0)}</div>
                <div className="flex items-center mt-1">
                  {(data?.monthlyChange || 0) >= 0 ? (
                    <>
                      <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-500 font-medium">+{data?.monthlyChange || 0}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      <span className="text-xs text-red-500 font-medium">{data?.monthlyChange || 0}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">from last month</span>
                </div>
              </>
            )}
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
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "Earnings"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="earnings"
                    stroke="hsl(var(--primary))"
                    dot={{ fill: "black", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ fill: "black", stroke: "hsl(var(--primary))", strokeWidth: 2, r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions by Story</CardTitle>
          <CardDescription>Individual donations received for your stories</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !data?.transactions || data.transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>You don't have any donations yet.</p>
              <Button asChild className="mt-4">
                <Link href="/write/story-info">
                  Create a new story
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Donor</th>
                    <th className="text-left py-3 px-2">Story</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-right py-3 px-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.map((transaction: any) => (
                    <tr key={transaction.id} className="border-b">
                      <td className="py-3 px-2">
                        {transaction.donorUsername ? (
                          <Link href={`/user/${transaction.donorUsername}`} className="font-medium hover:text-primary">
                            {transaction.donorUsername}
                          </Link>
                        ) : (
                          <span className="font-medium">{transaction.donorName}</span>
                        )}
                        {transaction.message && (
                          <div className="text-xs text-muted-foreground mt-1 italic">"{transaction.message}"</div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        {transaction.storyTitle ? (
                          <Link href={`/story/${transaction.storySlug || transaction.storyId}`} className="hover:text-primary">
                            {transaction.storyTitle}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">General donation</span>
                        )}
                      </td>
                      <td className="text-right py-3 px-2 font-medium">${transaction.amount.toFixed(2)}</td>
                      <td className="text-right py-3 px-2 text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                        <div className="text-xs">
                          {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {data.pagination && data.pagination.hasMore && (
                <div className="mt-6 text-center">
                  <Button
                    onClick={loadMoreTransactions}
                    disabled={isLoadingMore}
                    variant="outline"
                  >
                    {isLoadingMore ? (
                      <>
                        <span className="mr-2">Loading...</span>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </>
                    ) : (
                      <>Load More Transactions</>
                    )}
                  </Button>
                </div>
              )}

              <div className="mt-4 text-xs text-center text-muted-foreground">
                Showing {data.transactions.length} of {data.pagination?.totalItems || 0} transactions
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}