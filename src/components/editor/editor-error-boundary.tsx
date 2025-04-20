"use client"

import React, { ErrorInfo } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { logError } from "@/lib/error-logger"

interface EditorErrorBoundaryProps {
  children: React.ReactNode
  storyId?: string
  chapterId?: string
  onReset?: () => void
}

/**
 * Specialized error boundary for the editor with editor-specific recovery options
 */
export function EditorErrorBoundary({
  children,
  storyId,
  chapterId,
  onReset
}: EditorErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Log the error with editor-specific context
    logError(error, {
      component: 'EditorErrorBoundary',
      errorInfo: errorInfo.componentStack,
      storyId,
      chapterId,
      action: 'handleError'
    })
  }

  const handleReset = () => {
    // Call the onReset callback if provided
    if (onReset) {
      onReset()
    }
  }

  // Custom fallback UI for editor errors
  const fallbackUI = (
    <div className="p-8 rounded-lg border border-destructive/50 bg-destructive/10 flex flex-col items-center justify-center min-h-[400px]">
      <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Editor Error</h2>
      <p className="text-center text-muted-foreground mb-6 max-w-md">
        We encountered a problem with the editor. Your work may not be saved.
      </p>
      <div className="flex gap-4">
        <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reload Editor
        </Button>
        <Button
          onClick={() => window.location.href = `/write/story-info?id=${storyId}`}
          variant="default"
        >
          Return to Story
        </Button>
      </div>
    </div>
  )

  return (
    <ErrorBoundary
      fallback={fallbackUI}
      onError={handleError}
      resetKeys={[storyId, chapterId]}
    >
      {children}
    </ErrorBoundary>
  )
}
