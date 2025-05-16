import type React from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { AlertCircle, Loader2 } from "lucide-react"

interface AccountSettingsProps {
  session: Session | null
  passwordForm: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  changePassword: () => Promise<void>
  isChangingPassword: boolean
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  deletePassword: string
  setDeletePassword: React.Dispatch<React.SetStateAction<string>>
  deleteAccount: () => Promise<void>
  isDeletingAccount: boolean
}

const AccountSettings: React.FC<AccountSettingsProps> = ({
  session,
  passwordForm,
  handlePasswordChange,
  changePassword,
  isChangingPassword,
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  deletePassword,
  setDeletePassword,
  deleteAccount,
  isDeletingAccount,
}) => {
  // Determine if the user provider is 'credentials'
  const isCredentialsProvider = (session?.user as any)?.provider === "credentials"

  return (
    <>
      {/* Email Settings */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Email Address</CardTitle>
          <CardDescription>Update your email address</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={session?.user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">To change your email, please contact support.</p>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings - Only show for credentials users */}
      {isCredentialsProvider && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              onClick={() => {
                changePassword();
              }}
              disabled={
                isChangingPassword ||
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Message for OAuth users */}
      {!isCredentialsProvider && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Password Management</CardTitle>
            <CardDescription>Password options for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Password management is only available for accounts that signed up with email and password.
                You signed in with {(session?.user as any)?.provider || "an OAuth provider"}, so you don't need to manage a password.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-medium">Delete Account</h3>
            <p className="text-sm text-muted-foreground">
              Once you delete your account, there is no going back. This action is permanent.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            Delete Account
          </Button>
        </CardFooter>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Show password field for credentials users */}
            {isCredentialsProvider && (
              <div className="py-4">
                <Label htmlFor="delete-password" className="mb-2 block">Enter your password to confirm</Label>
                <PasswordInput
                  id="delete-password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your current password"
                  className="mb-2"
                />
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  await deleteAccount();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingAccount || (isCredentialsProvider && !deletePassword)}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </>
  )
}

export default AccountSettings