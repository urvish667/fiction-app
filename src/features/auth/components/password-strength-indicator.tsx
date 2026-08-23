"use client"

import { Check, X } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function evaluatePasswordStrength(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  let score = 0
  if (hasMinLength) score += 1
  if (hasUppercase && hasLowercase) score += 1
  if (hasNumber) score += 1
  if (hasSpecial) score += 1

  return {
    score, // 0 to 4
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
  }
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const { score, hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial } = evaluatePasswordStrength(password)

  const getBarColor = (index: number) => {
    if (score === 0) return "bg-muted"
    if (score === 1 && index <= 1) return "bg-red-500"
    if (score === 2 && index <= 2) return "bg-orange-500"
    if (score === 3 && index <= 3) return "bg-amber-500"
    if (score === 4) return "bg-emerald-500"
    return "bg-muted"
  }

  const getLabel = () => {
    if (score <= 1) return "Weak"
    if (score === 2) return "Fair"
    if (score === 3) return "Good"
    return "Strong"
  }

  return (
    <div className="space-y-2 mt-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Password strength:</span>
        <span className="font-medium">{getLabel()}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div className={`rounded-full ${getBarColor(1)}`} />
        <div className={`rounded-full ${getBarColor(2)}`} />
        <div className={`rounded-full ${getBarColor(3)}`} />
        <div className={`rounded-full ${getBarColor(4)}`} />
      </div>
      <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground pt-1">
        <div className="flex items-center gap-1">
          {hasMinLength ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
          <span>8+ characters</span>
        </div>
        <div className="flex items-center gap-1">
          {hasNumber ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
          <span>1+ number</span>
        </div>
        <div className="flex items-center gap-1">
          {hasUppercase && hasLowercase ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
          <span>Upper & lowercase</span>
        </div>
        <div className="flex items-center gap-1">
          {hasSpecial ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
          <span>1+ special char</span>
        </div>
      </div>
    </div>
  )
}

export default PasswordStrengthIndicator
