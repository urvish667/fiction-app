import type { Metadata } from "next"
import { ResetPasswordRequestForm } from "@/features/auth"
import "@/app/auth-background.css"

export const metadata: Metadata = {
  title: "Reset Password - FableSpace",
  description: "Request a password reset link for your FableSpace account.",
}

export default function RequestPasswordResetPage() {
  return <ResetPasswordRequestForm />
}
