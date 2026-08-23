export interface LoginFormValues {
  email: string
  password: string
  remember?: boolean
}

export interface SignupFormValues {
  email: string
  username: string
  password: string
  birthdate: Date | null
  pronoun: string
  termsAccepted: boolean
  marketingOptIn: boolean
}

export interface CompleteProfileFormValues {
  username: string
  birthdate: Date | null
  pronoun: string
  termsAccepted: boolean
}

export interface UsernameAvailabilityState {
  available: boolean
  error: string | null
  isChecking: boolean
}

export interface PasswordStrengthResult {
  score: number // 0-4
  feedback: string[]
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasNumber: boolean
  hasSpecialChar: boolean
}
