"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export type BrandLogoSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
export type BrandLogoVariant =
  | "default"
  | "primary"
  | "hero"
  | "footer"
  | "auth"
  | "white"
  | "muted"

export interface BrandLogoProps {
  /**
   * Size preset for the logo text.
   * @default "xl"
   */
  size?: BrandLogoSize

  /**
   * Visual preset variant controlling colors and interactions.
   * @default "default"
   */
  variant?: BrandLogoVariant

  /**
   * Explicit color string override (e.g. hex, rgb, or hsl).
   */
  color?: string

  /**
   * Whether the logo should be wrapped in an accessible Next.js Link.
   * @default true
   */
  asLink?: boolean

  /**
   * Target destination when rendered as a link.
   * @default "/"
   */
  href?: string

  /**
   * Whether to apply the smooth entrance slide animation.
   * @default false
   */
  animated?: boolean

  /**
   * Optional text or badge displayed next to the brand name (e.g. "Studio", "Beta").
   */
  suffix?: React.ReactNode

  /**
   * Optional custom text override for the brand name.
   * @default "FableSpace"
   */
  text?: string

  /**
   * Additional custom CSS classes.
   */
  className?: string

  /**
   * Additional inline styles.
   */
  style?: React.CSSProperties

  /**
   * Optional accessible label.
   */
  ariaLabel?: string
}

const sizeClasses: Record<BrandLogoSize, string> = {
  xs: "text-xs tracking-tight",
  sm: "text-sm tracking-tight",
  md: "text-base tracking-tight",
  lg: "text-lg md:text-xl tracking-tight",
  xl: "text-xl md:text-2xl tracking-tight",
  "2xl": "text-2xl md:text-3xl tracking-tight",
  "3xl": "text-3xl md:text-4xl tracking-tight",
}

const variantClasses: Record<BrandLogoVariant, string> = {
  default: "text-[#125ba5] dark:text-[#388ae0]",
  primary: "text-[#125ba5] dark:text-[#388ae0]",
  hero: "text-white drop-shadow-sm",
  footer: "text-foreground hover:text-[#125ba5] dark:hover:text-[#388ae0] transition-colors duration-150",
  auth: "text-[#125ba5] dark:text-[#388ae0]",
  white: "text-white",
  muted: "text-muted-foreground hover:text-foreground transition-colors duration-150",
}

/**
 * Standardized modular Brand Logo for FableSpace.
 * Enforces consistent `Georgia, serif` typography, letter-spacing, and branding styling.
 */
export function BrandLogo({
  size = "xl",
  variant = "default",
  color,
  asLink = true,
  href = "/",
  animated = false,
  suffix,
  text = "FableSpace",
  className,
  style,
  ariaLabel,
}: BrandLogoProps) {
  const content = (
    <span
      suppressHydrationWarning
      className={cn(
        "font-bold font-brand select-none inline-flex items-center gap-1.5",
        sizeClasses[size],
        !color && variantClasses[variant],
        animated && "logo-slide-in",
        className
      )}
      style={{
        fontFamily: "Georgia, serif",
        letterSpacing: "-0.01em",
        color: color,
        ...style,
      }}
    >
      <span>{text}</span>
      {suffix && (
        <span className="font-sans text-xs font-medium tracking-normal opacity-90">
          {suffix}
        </span>
      )}
    </span>
  )

  if (asLink) {
    return (
      <Link
        href={href}
        className="flex-shrink-0 inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
        aria-label={ariaLabel || `${text} home`}
      >
        {content}
      </Link>
    )
  }

  return content
}

export default BrandLogo
