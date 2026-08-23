"use client";

import { motion } from "framer-motion";
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatStatNumber } from "@/utils/number-utils";

import { EarningsChart } from "../charts/earnings-chart";
import { TransactionsTable } from "../earnings/transactions-table";
import { useEarningsData } from "../../hooks/use-earnings-data";

export function EarningsTab({ timeRange = "30days" }: { timeRange?: string }) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
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

      <EarningsChart data={data?.chartData || null} isLoading={isLoading} />

      <TransactionsTable
        transactions={data?.transactions}
        pagination={data?.pagination}
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        loadMoreTransactions={loadMoreTransactions}
      />
    </motion.div>
  );
}
