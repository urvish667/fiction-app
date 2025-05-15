import type React from "react"
import { useState, useEffect } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { UserPreferences, defaultPreferences } from "@/types/user"
import Link from "next/link"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
    return localPreferences[key] ??
      session?.user?.preferences?.privacySettings?.[key] ??
      defaultPreferences.privacySettings[key];
  }

  const renderPrivacyToggle = (
    key: keyof UserPreferences['privacySettings'],
    label: string,
    description: string,
    tooltip: string
  ) => (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <Label htmlFor={key}>{label}</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        {key === 'allowMessages' && (
          <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          {savingPreferences === `privacy-${key}` && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          <Switch
            id={key}
            checked={getPreference(key)}
            onCheckedChange={() => {
              setLocalPreferences(prev => ({
                ...prev,
                [key]: !prev[key]
              }));
              handlePrivacyToggle(key);
            }}
            disabled={savingPreferences !== null || key === 'allowMessages'}
          />
        </div>
        <span className="text-sm font-medium">
          {getPreference(key) ?
            <span className="text-green-500">On</span> :
            <span className="text-muted-foreground">Off</span>}
        </span>
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Settings</CardTitle>
          <CardDescription>Manage your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderPrivacyToggle(
            "showEmail",
            "Show Email",
            "Display your email address on your public profile",
            "When on, your email will be visible to anyone who views your profile. When off, only you can see your email."
          )}

          <Separator />

          {renderPrivacyToggle(
            "showLocation",
            "Show Location",
            "Display your location on your public profile",
            "When on, your location will be visible to anyone who views your profile. When off, only you can see your location."
          )}

          <Separator />

          {renderPrivacyToggle(
            "allowMessages",
            "Allow Messages",
            "Allow other users to send you direct messages",
            "When on, other users can send you direct messages. When off, only you can initiate conversations."
          )}
        </CardContent>
      </Card>

      {/* Privacy Policy Link */}
      <div className="mt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <h3 className="font-medium">Privacy Policy</h3>
            <p className="text-sm text-muted-foreground mt-1">
              By using FableSpace, you agree to our Privacy Policy. We respect your privacy and are committed to
              protecting your personal information.
            </p>
            <Button variant="link" className="px-0 h-auto text-sm" asChild>
              <Link href="/privacy" target="_blank">Read our Privacy Policy</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrivacySettings