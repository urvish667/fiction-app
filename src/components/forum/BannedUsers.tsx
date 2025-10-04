import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Ban, Loader2, Trash2 } from "lucide-react"
import ConfirmationDialog from "./ConfirmationDialog"

interface BannedUser {
  id: string
  name: string
  username: string
  image: string | null
}

interface BannedUsersProps {
  bannedUsers: BannedUser[]
  loadingBannedUsers?: boolean
  asDialog?: boolean
  isOwner?: boolean
  onUnban?: (userId: string) => void
}

const BannedUsersContent = ({
  bannedUsers,
  loadingBannedUsers = false,
  isOwner = false,
  onUnban
}: {
  bannedUsers: BannedUser[]
  loadingBannedUsers?: boolean
  isOwner?: boolean
  onUnban?: (userId: string) => void
}) => {
  const [displayedUsers, setDisplayedUsers] = useState(3)
  const [pendingUnbanUser, setPendingUnbanUser] = useState<BannedUser | null>(null)
  const [isUnbanning, setIsUnbanning] = useState(false)

  const loadMoreUsers = () => {
    setDisplayedUsers(prev => Math.min(prev + 3, bannedUsers.length))
  }

  const visibleUsers = bannedUsers.slice(0, displayedUsers)
  const hasMoreUsers = displayedUsers < bannedUsers.length

  return (
    <div className="space-y-4">
      {loadingBannedUsers ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : bannedUsers.length > 0 ? (
        <div className="space-y-3">
          {visibleUsers.map((bannedUser) => (
            <div key={bannedUser.id} className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={bannedUser.image || undefined} />
                <AvatarFallback>{bannedUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{bannedUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">@{bannedUser.username}</p>
              </div>
              {isOwner && onUnban && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPendingUnbanUser(bannedUser)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {hasMoreUsers && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={loadMoreUsers}
            >
              Load More Users ({bannedUsers.length - displayedUsers} remaining)
            </Button>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No banned users.</p>
      )}

      <ConfirmationDialog
        open={!!pendingUnbanUser}
        onOpenChange={(open) => !open && setPendingUnbanUser(null)}
        title="Unban User"
        message={`Are you sure you want to unban ${pendingUnbanUser?.username}?`}
        confirmText={isUnbanning ? undefined : "Unban"}
        onConfirm={async () => {
          setIsUnbanning(true)
          try {
            if (pendingUnbanUser) {
              await onUnban?.(pendingUnbanUser.id)
            }
          } finally {
            setIsUnbanning(false)
            setPendingUnbanUser(null)
          }
        }}
        variant="default"
        loading={isUnbanning}
      />
    </div>
  )
}

export default function BannedUsers({
  bannedUsers,
  loadingBannedUsers = false,
  asDialog = false,
  isOwner = false,
  onUnban
}: BannedUsersProps) {
  if (asDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            {loadingBannedUsers && <Loader2 className="h-3 w-3 animate-spin" />}
            Banned Users
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Banned Users</DialogTitle>
          </DialogHeader>
          <BannedUsersContent
            bannedUsers={bannedUsers}
            loadingBannedUsers={loadingBannedUsers}
            isOwner={isOwner}
            onUnban={onUnban}
          />
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ban className="h-5 w-5" />
          Banned Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <BannedUsersContent
          bannedUsers={bannedUsers}
          isOwner={isOwner}
          onUnban={onUnban}
        />
      </CardContent>
    </Card>
  )
}
