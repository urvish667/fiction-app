import type React from "react"
import { useState, useEffect, useCallback, memo } from "react"
import type { Session } from "next-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { UserPreferences, defaultPreferences } from "@/types/user"

interface NotificationSettingsProps {
  session: Session | null
  handleNotificationToggle: (key: keyof UserPreferences['emailNotifications']) => Promise<void>
  savingPreferences: string | null
  update: () => Promise<any> // Type for session update function
  toast: (options: any) => void // Type for toast function
}

// Memoized toggle switch component to prevent unnecessary re-renders
const ToggleSwitch = memo(({
  id,
  label,
  checked,
  loading,
  onToggle
}: {
  id: string;
  label: string;
  checked: boolean;
  loading: boolean;
  onToggle: () => void
}) => {
  return (
    <div className="flex items-center justify-between space-x-2 relative">
      <Label htmlFor={id} className="flex flex-col space-y-1">
        <span>{label}</span>
      </Label>
      <div className="relative">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onToggle}
          disabled={loading}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
});

ToggleSwitch.displayName = 'ToggleSwitch';

// Main component with performance optimizations
const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  session,
  handleNotificationToggle,
  savingPreferences,
  update,
  toast,
}) => {
  // Local state for immediate UI feedback
  const [localPreferences, setLocalPreferences] = useState<{
    [K in keyof UserPreferences['emailNotifications']]: boolean
  }>({ ...defaultPreferences.emailNotifications });

  // Update local state when session changes - with debounce
  useEffect(() => {
    // Skip unnecessary updates if session is null
    if (!session?.user) return;

    // Use a timeout to debounce frequent session changes
    const timeoutId = setTimeout(() => {
      if (session?.user?.preferences?.emailNotifications) {
        setLocalPreferences({
          ...defaultPreferences.emailNotifications,
          ...session.user.preferences.emailNotifications
        });
      }
    }, 50); // Small delay to batch updates

    return () => clearTimeout(timeoutId);
  }, [session?.user?.preferences]);

  // Helper function to get preference value safely - memoized
  const getPreference = useCallback(<K extends keyof UserPreferences['emailNotifications']>(key: K): boolean => {
    // First check local state (for immediate UI feedback)
    if (typeof localPreferences[key] === 'boolean') {
      return localPreferences[key];
    }

    // Then check session data
    if (session?.user?.preferences?.emailNotifications &&
        typeof session.user.preferences.emailNotifications[key] === 'boolean') {
      return session.user.preferences.emailNotifications[key];
    }

    // Finally fall back to defaults
    return defaultPreferences.emailNotifications[key];
  }, [localPreferences, session?.user?.preferences?.emailNotifications]);

  // Local state for marketing opt-in
  const [localMarketingOptIn, setLocalMarketingOptIn] = useState(false);

  // Update local marketing state when session changes
  useEffect(() => {
    setLocalMarketingOptIn(!!(session?.user as any)?.marketingOptIn);
  }, [session?.user]);

  // Marketing opt-in toggle handler (moved here as it's a notification type)
  const handleMarketingToggle = async () => {
    if (!session?.user) return; // Guard clause

    // Update local state immediately for UI feedback
    setLocalMarketingOptIn(prev => !prev);

    // Use type assertion to handle potentially missing fields like username/marketingOptIn
    const userData = session.user as any;
    if (!userData.username) {
      console.error("Username is missing from session data");
      toast({
        title: "Error",
        description: "Cannot update preferences: User information incomplete.",
        variant: "destructive",
      });
      // Revert local state if there's an error
      setLocalMarketingOptIn(!!(session?.user as any)?.marketingOptIn);
      return;
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username,
          marketingOptIn: !userData.marketingOptIn, // Toggle the current value
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update marketing preferences');
      }

      toast({
        title: "Success",
        description: "Your marketing preferences have been updated.",
      });

      // Refresh the session to get updated preferences
      await update();
    } catch (error) {
      console.error('Error updating marketing preferences:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update marketing preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Manage your email notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Follower Toggle - Using memoized component */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newFollower">New Follower</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone follows you</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              id="newFollower"
              label=""
              checked={getPreference("newFollower")}
              loading={savingPreferences === 'notification-newFollower'}
              onToggle={() => {
                // Update local state immediately for UI feedback
                setLocalPreferences(prev => ({
                  ...prev,
                  newFollower: !getPreference("newFollower") // Use the getter to ensure we have the latest value
                }));
                // Then call the actual handler
                handleNotificationToggle("newFollower");
              }}
            />
            <span className="text-sm font-medium">
              {getPreference("newFollower") ?
                <span className="text-green-500">On</span> :
                <span className="text-muted-foreground">Off</span>}
            </span>
          </div>
        </div>

        <Separator />

        {/* New Comment Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newComment">New Comment</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone comments on your story</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === 'notification-newComment' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newComment"
                checked={getPreference("newComment")}
                onCheckedChange={() => {
                  // Update local state immediately for UI feedback
                  setLocalPreferences(prev => ({
                    ...prev,
                    newComment: !prev.newComment
                  }));
                  // Then call the actual handler
                  handleNotificationToggle("newComment");
                }}
                disabled={savingPreferences !== null}
              />
            </div>
            <span className="text-sm font-medium">
              {getPreference("newComment") ?
                <span className="text-green-500">On</span> :
                <span className="text-muted-foreground">Off</span>}
            </span>
          </div>
        </div>

        <Separator />

        {/* New Like Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newLike">New Like</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone likes your story</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === 'notification-newLike' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newLike"
                checked={getPreference("newLike")}
                onCheckedChange={() => {
                  // Update local state immediately for UI feedback
                  setLocalPreferences(prev => ({
                    ...prev,
                    newLike: !prev.newLike
                  }));
                  // Then call the actual handler
                  handleNotificationToggle("newLike");
                }}
                disabled={savingPreferences !== null}
              />
            </div>
            <span className="text-sm font-medium">
              {getPreference("newLike") ?
                <span className="text-green-500">On</span> :
                <span className="text-muted-foreground">Off</span>}
            </span>
          </div>
        </div>

        <Separator />

        {/* New Chapter Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newChapter">New Chapter</Label>
            <p className="text-sm text-muted-foreground">Receive an email when an author you follow publishes a new chapter</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === 'notification-newChapter' && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newChapter"
                checked={getPreference("newChapter")}
                onCheckedChange={() => {
                  // Update local state immediately for UI feedback
                  setLocalPreferences(prev => ({
                    ...prev,
                    newChapter: !prev.newChapter
                  }));
                  // Then call the actual handler
                  handleNotificationToggle("newChapter");
                }}
                disabled={savingPreferences !== null}
              />
            </div>
            <span className="text-sm font-medium">
              {getPreference("newChapter") ?
                <span className="text-green-500">On</span> :
                <span className="text-muted-foreground">Off</span>}
            </span>
          </div>
        </div>

        <Separator />

        {/* Marketing Emails Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing">Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">Receive emails about new features, tips, and promotions</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {/* Consider adding a loading indicator specific to marketing toggle if needed */}
              <Switch
                id="marketing"
                checked={localMarketingOptIn} // Use local state for immediate feedback
                onCheckedChange={handleMarketingToggle}
              // disabled={/* Add loading state if implementing */}
              />
            </div>
            <span className="text-sm font-medium">
              {localMarketingOptIn ?
                <span className="text-green-500">On</span> :
                <span className="text-muted-foreground">Off</span>}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default NotificationSettings