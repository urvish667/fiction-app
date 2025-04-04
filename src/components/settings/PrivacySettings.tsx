import type React from "react"
import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle } from "lucide-react"
import { UserPreferences, defaultPreferences } from "@/types/user"

interface PrivacySettingsProps {
  session: Session | null
  handlePrivacyToggle: (key: keyof UserPreferences['privacySettings']) => Promise<void>
  savingPreferences: string | null
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  session,
  handlePrivacyToggle,
  savingPreferences,
}) => {
  // Local state for immediate UI feedback
  const [localPreferences, setLocalPreferences] = useState<{
    [K in keyof UserPreferences['privacySettings']]: boolean
  }>({ ...defaultPreferences.privacySettings });

  // Update local state when session changes
  useEffect(() => {
    if (session?.user?.preferences?.privacySettings) {
      setLocalPreferences({
        ...defaultPreferences.privacySettings,
        ...session.user.preferences.privacySettings
      });
    }
  }, [session?.user?.preferences]);

  // Helper function to get preference value safely
  const getPreference = <K extends keyof UserPreferences['privacySettings']>(key: K): boolean => {
    // Use local state for UI, fallback to session data
    return localPreferences[key] ??
      session?.user?.preferences?.privacySettings?.[key] ??
      defaultPreferences.privacySettings[key];
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Manage your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public Profile Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publicProfile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">Make your profile visible to everyone</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                {savingPreferences === 'privacy-publicProfile' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <Switch
                  id="publicProfile"
                  checked={getPreference("publicProfile")}
                  onCheckedChange={() => {
                    // Update local state immediately for UI feedback
                    setLocalPreferences(prev => ({
                      ...prev,
                      publicProfile: !prev.publicProfile
                    }));
                    // Then call the actual handler
                    handlePrivacyToggle("publicProfile");
                  }}
                  disabled={savingPreferences !== null}
                />
              </div>
              <span className="text-sm font-medium">
                {getPreference("publicProfile") ?
                  <span className="text-green-500">On</span> :
                  <span className="text-muted-foreground">Off</span>}
              </span>
            </div>
          </div>

          <Separator />

          {/* Show Email Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showEmail">Show Email</Label>
              <p className="text-sm text-muted-foreground">Display your email address on your public profile</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                {savingPreferences === 'privacy-showEmail' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <Switch
                  id="showEmail"
                  checked={getPreference("showEmail")}
                  onCheckedChange={() => {
                    // Update local state immediately for UI feedback
                    setLocalPreferences(prev => ({
                      ...prev,
                      showEmail: !prev.showEmail
                    }));
                    // Then call the actual handler
                    handlePrivacyToggle("showEmail");
                  }}
                  disabled={savingPreferences !== null}
                />
              </div>
              <span className="text-sm font-medium">
                {getPreference("showEmail") ?
                  <span className="text-green-500">On</span> :
                  <span className="text-muted-foreground">Off</span>}
              </span>
            </div>
          </div>

          <Separator />

          {/* Show Location Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showLocation">Show Location</Label>
              <p className="text-sm text-muted-foreground">Display your location on your public profile</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                {savingPreferences === 'privacy-showLocation' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <Switch
                  id="showLocation"
                  checked={getPreference("showLocation")}
                  onCheckedChange={() => {
                    // Update local state immediately for UI feedback
                    setLocalPreferences(prev => ({
                      ...prev,
                      showLocation: !prev.showLocation
                    }));
                    // Then call the actual handler
                    handlePrivacyToggle("showLocation");
                  }}
                  disabled={savingPreferences !== null}
                />
              </div>
              <span className="text-sm font-medium">
                {getPreference("showLocation") ?
                  <span className="text-green-500">On</span> :
                  <span className="text-muted-foreground">Off</span>}
              </span>
            </div>
          </div>

          <Separator />

          {/* Allow Messages Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowMessages">Allow Messages</Label>
              <p className="text-sm text-muted-foreground">Allow other users to send you direct messages</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                {savingPreferences === 'privacy-allowMessages' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                )}
                <Switch
                  id="allowMessages"
                  checked={getPreference("allowMessages")}
                  onCheckedChange={() => {
                    // Update local state immediately for UI feedback
                    setLocalPreferences(prev => ({
                      ...prev,
                      allowMessages: !prev.allowMessages
                    }));
                    // Then call the actual handler
                    handlePrivacyToggle("allowMessages");
                  }}
                  disabled={savingPreferences !== null}
                />
              </div>
              <span className="text-sm font-medium">
                {getPreference("allowMessages") ?
                  <span className="text-green-500">On</span> :
                  <span className="text-muted-foreground">Off</span>}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Policy Link */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium">Privacy Policy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              By using FableSpace, you agree to our Privacy Policy. We respect your privacy and are committed to
              protecting your personal information.
            </p>
            {/* TODO: Link to actual privacy policy page */}
            <Button variant="link" className="px-0 h-auto text-sm">
              Read our Privacy Policy
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrivacySettings