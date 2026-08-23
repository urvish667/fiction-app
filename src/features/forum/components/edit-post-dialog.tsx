"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ForumTextEditor } from "./forum-text-editor"
import { sanitizeText, sanitizeForumPost } from "@/utils/sanitization"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { ForumService } from "@/lib/api/forum"
import type { ForumPost } from "../types/forum.types"

export interface EditPostDialogProps {
  post: ForumPost | null
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (postId: string | undefined, title: string, content: string) => Promise<void>
  username: string
}

export function EditPostDialog({
  post,
  mode,
  open,
  onOpenChange,
  onSave,
  username,
}: EditPostDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  // Reset form state cleanly on open/post/mode change
  useEffect(() => {
    if (mode === "edit" && post && open) {
      setTitle(post.title)
      setContent(post.content)
      return
    }

    if (mode === "create" && open) {
      setTitle("")
      setContent("")
      return
    }

    if (!open) {
      setTitle("")
      setContent("")
      setSaving(false)
    }
  }, [post, mode, open])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    // Guard: Validate title requirement
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your post",
        variant: "destructive",
      })
      return
    }

    // Guard: Validate content requirement
    if (!trimmedContent) {
      toast({
        title: "Content Required",
        description: "Please enter content for your post",
        variant: "destructive",
      })
      return
    }

    // Guard: Validate minimum title length
    if (trimmedTitle.length < 3) {
      toast({
        title: "Title Too Short",
        description: "Title must be at least 3 characters long",
        variant: "destructive",
      })
      return
    }

    // Guard: Validate minimum content length
    if (trimmedContent.length < 10) {
      toast({
        title: "Content Too Short",
        description: "Content must be at least 10 characters long",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      if (mode === "create") {
        const response = await ForumService.createPost(username, {
          title: sanitizeText(trimmedTitle),
          content: sanitizeForumPost(trimmedContent),
        })

        if (!response.success || !response.data) {
          toast({
            title: "Error",
            description: response.message || "Failed to create post",
            variant: "destructive",
          })
          return
        }

        await onSave(undefined, response.data.title, response.data.content)
        onOpenChange(false)
        toast({
          title: "Success",
          description: "Post created successfully!",
        })
        return
      }

      // Edit mode
      const response = await ForumService.updatePost(username, post!.id, {
        title: sanitizeText(trimmedTitle),
        content: sanitizeForumPost(trimmedContent),
      })

      if (!response.success || !response.data) {
        toast({
          title: "Error",
          description: response.message || "Failed to update post",
          variant: "destructive",
        })
        return
      }

      await onSave(post?.id, response.data.title, response.data.content)
      onOpenChange(false)
      toast({
        title: "Success",
        description: "Post updated successfully!",
      })
    } catch (error) {
      console.error(`Error ${mode === "create" ? "creating" : "updating"} post:`, error)
      toast({
        title: "Error",
        description: `Failed to ${mode === "create" ? "create" : "update"} post`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create Post" : "Edit Post"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Share your thoughts with the community. Click create when you're done."
              : "Make changes to your post below. Click save when you're done."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="edit-post-title" className="block text-sm font-medium mb-2">
              Title
            </label>
            <Input
              id="edit-post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your post..."
              maxLength={250}
              disabled={saving}
            />
            <div
              className={`mt-1 text-xs text-right ${
                title.length > 240
                  ? "text-destructive"
                  : title.length > 220
                    ? "text-yellow-600"
                    : "text-muted-foreground"
              }`}
            >
              {title.length}/250
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content</label>
            <ForumTextEditor
              content={content}
              onChange={setContent}
              placeholder="Share your thoughts with the community..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </>
            ) : mode === "create" ? (
              "Create Post"
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditPostDialog
