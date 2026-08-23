import type { Metadata } from "next"
import { CompleteProfileForm } from "@/features/auth"
import "@/app/auth-background.css"

export const metadata: Metadata = {
  title: "Complete Your Profile - FableSpace",
  description: "Complete your profile information to finish setting up your account.",
}

export default function CompleteProfilePage() {
  return <CompleteProfileForm />
}
