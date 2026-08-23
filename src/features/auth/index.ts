// Components
export { AuthLogo, default as AuthLogoDefault } from "./components/auth-logo"
export { AuthStatus, default as AuthStatusDefault } from "./components/auth-status"
export {
  GoogleLoginButton,
  DiscordLoginButton,
  SocialAuthButtons,
  type SocialButtonProps,
} from "./components/social-auth-buttons"
export {
  PasswordStrengthIndicator,
  evaluatePasswordStrength,
  default as PasswordStrengthIndicatorDefault,
} from "./components/password-strength-indicator"
export { LoginForm, default as LoginFormDefault } from "./components/login-form"
export { SignupForm, default as SignupFormDefault } from "./components/signup-form"
export { CompleteProfileForm, default as CompleteProfileFormDefault } from "./components/complete-profile-form"
export { VerifyEmailCard, default as VerifyEmailCardDefault } from "./components/verify-email-card"
export { ResetPasswordRequestForm, default as ResetPasswordRequestFormDefault } from "./components/reset-password-request-form"
export { ResetPasswordConfirmForm, default as ResetPasswordConfirmFormDefault } from "./components/reset-password-confirm-form"

// Hooks
export { useOptimizedAuth, default as useOptimizedAuthDefault } from "./hooks/use-optimized-auth"
export { useRequireAuth, default as useRequireAuthDefault } from "./hooks/use-require-auth"

// Types
export * from "./types/auth.types"
