"use client"

import { motion } from "framer-motion"
import { BrandLogo, type BrandLogoSize } from "@/components/common/brand-logo"

export interface AuthLogoProps {
  /**
   * Size preset for the logo text.
   * @default "3xl"
   */
  size?: BrandLogoSize

  /**
   * Additional CSS classes.
   */
  className?: string
}

/**
 * Standardized Auth Logo component for all authentication forms and pages.
 * Reuses the primary BrandLogo component with Georgia serif typography and entrance motion.
 */
export function AuthLogo({ size = "3xl", className }: AuthLogoProps) {
  return (
    <motion.div
      className="flex justify-center items-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <BrandLogo
        size={size}
        variant="auth"
        animated
        className={className}
      />
    </motion.div>
  )
}

export default AuthLogo
