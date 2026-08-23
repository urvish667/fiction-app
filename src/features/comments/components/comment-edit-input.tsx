"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { CommentEditInputProps } from "../types/comment.types"

export function CommentEditInput({
  content,
  onChange,
  onCancel,
  onSave,
  isSubmitting,
  size = "default",
}: CommentEditInputProps) {
  const isSmall = size === "sm"

  return (
    <div className="space-y-2">
      <Textarea
        value={content}
        onChange={e => onChange(e.target.value)}
        className={`resize-none ${isSmall ? "text-sm" : "text-sm"}`}
        disabled={isSubmitting}
      />
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className={isSmall ? "h-7 text-xs" : ""}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className={isSmall ? "h-7 text-xs" : ""}
          onClick={onSave}
          disabled={!content.trim() || isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  )
}
