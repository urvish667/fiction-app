"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Flag, Trash, Reply, Edit } from "lucide-react"
import type { CommentActionsMenuProps } from "../types/comment.types"

interface CommentActionsMenuExtendedProps extends CommentActionsMenuProps {
  iconSize?: number
  buttonSize?: "sm" | "icon"
  buttonClassName?: string
}

export function CommentActionsMenu({
  itemUserId,
  currentUserId,
  onReply,
  onReport,
  onEdit,
  onDelete,
  iconSize = 16,
  buttonClassName = "h-8 w-8",
}: CommentActionsMenuExtendedProps) {
  const isOwner = Boolean(currentUserId && itemUserId === currentUserId)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={buttonClassName}>
          <MoreVertical size={iconSize} />
          <span className="sr-only">More</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {onReply && (
          <DropdownMenuItem onClick={onReply}>
            <Reply size={iconSize} className="mr-2" />
            Reply
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onReport}>
          <Flag size={iconSize} className="mr-2" />
          Report
        </DropdownMenuItem>
        {isOwner && (
          <>
            <DropdownMenuItem onClick={onEdit}>
              <Edit size={iconSize} className="mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash size={iconSize} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
