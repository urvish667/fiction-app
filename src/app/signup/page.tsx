import { Suspense } from "react"
import type { Metadata } from "next"
import { SignupForm, AuthLogo } from "@/features/auth"
import "@/app/auth-background.css"

export const metadata: Metadata = {
  title: "Create an Account - FableSpace",
  description: "Join FableSpace to read original stories, follow your favorite authors, and publish your own writing.",
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen auth-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-card rounded-lg shadow-xl border border-border p-6 space-y-6 w-full max-w-md backdrop-blur-sm bg-opacity-95">
            <div className="flex justify-center">
              <AuthLogo />
            </div>
            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-bold">Loading...</h2>
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  )
}
