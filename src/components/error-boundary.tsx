"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { logError } from "@/lib/error-logger"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetKeys?: any[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch and handle errors in the component tree
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error logging service
    logError(error, {
      component: 'ErrorBoundary',
      errorInfo: errorInfo.componentStack,
      action: 'componentDidCatch'
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // If any of the resetKeys changed, reset the error state
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.reset()
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render the fallback UI if provided, otherwise render a default error message
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/10 text-center">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button onClick={this.reset} variant="outline">
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
