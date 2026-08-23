"use client";

import Link from "next/link";
import { Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getStudioUrl } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import type { DonationTransaction, PaginationInfo } from "../../types/dashboard.types";

interface TransactionsTableProps {
  transactions: DonationTransaction[] | undefined;
  pagination: PaginationInfo | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  loadMoreTransactions: () => Promise<void>;
}

export function TransactionsTable({
  transactions,
  pagination,
  isLoading,
  isLoadingMore,
  loadMoreTransactions,
}: TransactionsTableProps) {
  const isMobile = useIsMobile();

  return (
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
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-3">
            <p>You don&apos;t have any donations yet.</p>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700">
              <a href={getStudioUrl()} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Create in Studio</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-70" />
              </a>
            </Button>
          </div>
        ) : isMobile ? (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {transaction.donorUsername ? (
                        <Link href={`/user/${transaction.donorUsername}`} className="hover:text-primary">
                          {transaction.donorUsername}
                        </Link>
                      ) : (
                        <span>{transaction.donorName}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {transaction.storyTitle ? (
                        <Link href={`/story/${transaction.storySlug || transaction.storyId}`} className="hover:text-primary">
                          {transaction.storyTitle}
                        </Link>
                      ) : (
                        <span>General donation</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">${transaction.amount.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {transaction.message && (
                  <div className="text-xs text-muted-foreground italic border-t pt-2">
                    &ldquo;{transaction.message}&rdquo;
                  </div>
                )}
              </div>
            ))}
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
                {transactions.map((transaction) => (
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
                        <div className="text-xs text-muted-foreground mt-1 italic">&ldquo;{transaction.message}&rdquo;</div>
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
                        {new Date(transaction.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transactions && transactions.length > 0 && (
          <>
            {pagination && pagination.hasMore && (
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
              Showing {transactions.length} of {pagination?.totalItems || 0} transactions
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
