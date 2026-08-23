import type { Metadata } from "next"
import { ResetPasswordConfirmForm } from "@/features/auth"
import "@/app/auth-background.css"

export const metadata: Metadata = {
  title: "Set New Password - FableSpace",
  description: "Set a new password for your FableSpace account.",
}

export default function ResetPasswordPage() {
  return <ResetPasswordConfirmForm />
}
