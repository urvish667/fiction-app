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
import ForumTextEditor from "@/components/forum-text-editor"
import { sanitizeText, sanitizeForumPost } from "@/utils/sanitization"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  content: string
  author: {
    id: string
    name: string
    username: string
    image: string | null
  }
  pinned: boolean
  createdAt: Date
  commentCount: number
  comments: any[]
}

interface EditPostDialogProps {
  post: Post | null
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (postId: string | undefined, title: string, content: string) => Promise<void>
  csrfToken: string
  username: string
}

export default function EditPostDialog({
  post,
  mode,
  open,
  onOpenChange,
  onSave,
  csrfToken,
  username
}: EditPostDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  // Reset form when post or mode changes or dialog opens/closes
  useEffect(() => {
    if (mode === 'edit' && post && open) {
      setTitle(post.title)
      setContent(post.content)
    } else if (mode === 'create' && open) {
      setTitle("")
      setContent("")
    } else if (!open) {
      setTitle("")
      setContent("")
      setSaving(false)
    }
  }, [post, mode, open])

  const handleSave = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    // Client-side validation
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your post",
        variant: "destructive"
      })
      return
    }

    if (!trimmedContent) {
      toast({
        title: "Content Required",
        description: "Please enter content for your post",
        variant: "destructive"
      })
      return
    }

    if (trimmedTitle.length < 3) {
      toast({
        title: "Title Too Short",
        description: "Title must be at least 3 characters long",
        variant: "destructive"
      })
      return
    }

    if (trimmedContent.length < 10) {
      toast({
        title: "Content Too Short",
        description: "Content must be at least 10 characters long",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      if (mode === 'create') {
        // Create new post
        const response = await fetch(`/api/forum/${username}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            title: sanitizeText(trimmedTitle),
            content: sanitizeForumPost(trimmedContent)
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          await onSave(undefined, data.post.title, data.post.content)
          onOpenChange(false)
          toast({
            title: "Success",
            description: "Post created successfully!"
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to create post",
            variant: "destructive"
          })
        }
      } else {
        // Edit existing post
        const response = await fetch(`/api/forum/${username}/posts/${post?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken,
          },
          body: JSON.stringify({
            title: sanitizeText(trimmedTitle),
            content: sanitizeForumPost(trimmedContent)
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          await onSave(post?.id, data.post.title, data.post.content)
          onOpenChange(false)
          toast({
            title: "Success",
            description: "Post updated successfully!"
          })
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update post",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} post:`, error)
      toast({
        title: "Error",
        description: `Failed to ${mode === 'create' ? 'create' : 'update'} post`,
        variant: "destructive"
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
            {mode === 'create' ? 'Create Post' : 'Edit Post'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Share your thoughts with the community. Click create when you\'re done.'
              : 'Make changes to your post below. Click save when you\'re done.'
            }
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
            <div className={`mt-1 text-xs text-right ${
              title.length > 240 ? 'text-destructive' :
              title.length > 220 ? 'text-yellow-600' :
              'text-muted-foreground'
            }`}>
              {title.length}/250
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Content
            </label>
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
                {mode === 'create' ? 'Creating...' : 'Saving...'}
              </>
            ) : (
              mode === 'create' ? 'Create Post' : 'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
