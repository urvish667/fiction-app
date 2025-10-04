import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface InstructionForumProps {
  className?: string
  asDialog?: boolean
}

const InstructionForumContent: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-semibold text-lg mb-3">Forum Instructions</h3>

      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-sm text-foreground mb-1">How to Create a Post</h4>
          <p className="text-sm text-muted-foreground">
            Click the "Create Post" button in the top right corner. Fill in the title and content, then submit.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-foreground mb-1">How to Edit a Post</h4>
          <p className="text-sm text-muted-foreground">
            Under your post, click the "Edit" option (pencil icon). Modify the content and save your changes.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-foreground mb-1">How to Delete a Post</h4>
          <p className="text-sm text-muted-foreground">
            Locate the three-dot menu next to your post or any post (if you're the forum owner). Select "Delete" and confirm.
          </p>
        </div>

        <div>
          <h4 className="font-medium text-sm text-foreground mb-1">How to Report a User</h4>
          <p className="text-sm text-muted-foreground">
            Click on the dropdown menu next to a user's name and select "Report User". Provide details and submit.
          </p>
        </div>
      </div>
    </div>
  )
}

const InstructionForum: React.FC<InstructionForumProps> = ({ className = '', asDialog = false }) => {
  if (asDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Instructions
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forum Instructions</DialogTitle>
          </DialogHeader>
          <InstructionForumContent />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className={`bg-card border rounded-lg p-4 space-y-4 ${className}`}>
      <InstructionForumContent />
    </div>
  )
}

export default InstructionForum
