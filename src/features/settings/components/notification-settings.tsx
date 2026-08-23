"use client";

import type React from "react";
import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { UserPreferences, defaultPreferences } from "@/types/user";
import type { ExtendedSession } from "../types/settings.types";

interface NotificationSettingsProps {
  session: ExtendedSession | null;
  handleNotificationToggle: (key: keyof UserPreferences["emailNotifications"]) => Promise<void>;
  savingPreferences: string | null;
  update: () => Promise<any>;
  toast: (options: any) => void;
}

const ToggleSwitch = memo(({
  id,
  label,
  checked,
  loading,
  onToggle,
}: {
  id: string;
  label: string;
  checked: boolean;
  loading: boolean;
  onToggle: () => void;
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

ToggleSwitch.displayName = "ToggleSwitch";

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  session,
  handleNotificationToggle: _handleNotificationToggle,
  savingPreferences,
  update: _update,
  toast: _toast,
}) => {
  const [, setLocalPreferences] = useState<{
    [K in keyof UserPreferences["emailNotifications"]]: boolean;
  }>({ ...defaultPreferences.emailNotifications });

  useEffect(() => {
    if (!session?.user) return;

    const timeoutId = setTimeout(() => {
      if (session.user.preferences?.emailNotifications) {
        setLocalPreferences({
          ...defaultPreferences.emailNotifications,
          ...session.user.preferences.emailNotifications,
        });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [session]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Manage your email notification preferences</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Follower Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newFollower">New Follower</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone follows you</p>
            <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              id="newFollower"
              label=""
              checked={false}
              loading={savingPreferences === "notification-newFollower"}
              onToggle={() => {}}
            />
            <span className="text-sm font-medium">
              <span className="text-muted-foreground">Off</span>
            </span>
          </div>
        </div>

        <Separator />

        {/* New Comment Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newComment">New Comment</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone comments on your story</p>
            <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === "notification-newComment" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newComment"
                checked={false}
                onCheckedChange={() => {}}
                disabled={true}
              />
            </div>
            <span className="text-sm font-medium">
              <span className="text-muted-foreground">Off</span>
            </span>
          </div>
        </div>

        <Separator />

        {/* New Like Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newLike">New Like</Label>
            <p className="text-sm text-muted-foreground">Receive an email when someone likes your story</p>
            <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === "notification-newLike" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newLike"
                checked={false}
                onCheckedChange={() => {}}
                disabled={true}
              />
            </div>
            <span className="text-sm font-medium">
              <span className="text-muted-foreground">Off</span>
            </span>
          </div>
        </div>

        <Separator />

        {/* New Chapter Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="newChapter">New Chapter</Label>
            <p className="text-sm text-muted-foreground">Receive an email when an author you follow publishes a new chapter</p>
            <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              {savingPreferences === "notification-newChapter" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}
              <Switch
                id="newChapter"
                checked={false}
                onCheckedChange={() => {}}
                disabled={true}
              />
            </div>
            <span className="text-sm font-medium">
              <span className="text-muted-foreground">Off</span>
            </span>
          </div>
        </div>

        <Separator />

        {/* Marketing Emails Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="marketing">Marketing Emails</Label>
            <p className="text-sm text-muted-foreground">Receive emails about new features, tips, and promotions</p>
            <p className="text-sm text-yellow-500 mt-1">This feature will be available in the next release</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Switch
                id="marketing"
                checked={false}
                onCheckedChange={() => {}}
                disabled={true}
              />
            </div>
            <span className="text-sm font-medium">
              <span className="text-muted-foreground">Off</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
