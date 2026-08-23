import { Suspense } from "react"
import type { Metadata } from "next"
import { VerifyEmailCard, AuthLogo } from "@/features/auth"
import "@/app/auth-background.css"

export const metadata: Metadata = {
  title: "Verify Your Email - FableSpace",
  description: "Verify your email address to activate your FableSpace account.",
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="bg-card rounded-lg shadow-xl border border-border p-6 space-y-6 w-full backdrop-blur-sm bg-opacity-95">
              <div className="flex justify-center mb-4">
                <AuthLogo />
              </div>
              <h2 className="text-2xl font-bold text-center">Loading...</h2>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailCard />
    </Suspense>
  )
}
