"use client";

import type React from "react";
import { z } from "zod";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, AtSign, Link as LinkIcon, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProfileFormValuesSubset } from "../../types/settings.types";
import { logError } from "@/lib/error-logger";
import { LocationSelector } from "./location-selector";
import { profileUpdateSchema } from "@/lib/validation/profile";

interface ProfileInfoFormProps {
  form: UseFormReturn<ProfileFormValuesSubset>;
  isUpdating: boolean;
  saveProfileInfo: (
    data: Partial<Pick<ProfileFormValuesSubset, "name" | "username" | "bio" | "location" | "website">>
  ) => Promise<void>;
}

export const ProfileInfoForm = ({ form, isUpdating, saveProfileInfo }: ProfileInfoFormProps) => {
  const { toast } = useToast();
  const { register, formState: { errors, dirtyFields }, getValues } = form;

  const onProfileInfoSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const profileData = {
      name: getValues("name"),
      username: getValues("username"),
      bio: getValues("bio"),
      location: getValues("location"),
      website: getValues("website"),
    };

    try {
      profileUpdateSchema.parse(profileData);
    } catch (validationErr) {
      logError(validationErr, { context: "Profile info validation failed" });
      if (validationErr instanceof z.ZodError) {
        validationErr.issues.forEach((err) => {
          const path = err.path[0] as keyof typeof profileData;
          form.setError(path, { message: err.message });
        });
      }

      toast({
        title: "Validation Error",
        description: "Please check your profile information fields for errors.",
        variant: "destructive",
      });
      return;
    }

    const isProfileDataDirty =
      dirtyFields.name ||
      dirtyFields.username ||
      dirtyFields.bio ||
      dirtyFields.location ||
      dirtyFields.website;

    if (!isProfileDataDirty) {
      toast({
        title: "No Changes",
        description: "You haven't modified any profile information fields.",
        duration: 3000,
      });
      return;
    }

    try {
      await saveProfileInfo(profileData);
    } catch (error) {
      logError(error, { context: "Error saving profile info" });
      toast({
        title: "Error",
        description: "Failed to save profile information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isProfileDirty =
    dirtyFields.name ||
    dirtyFields.username ||
    dirtyFields.bio ||
    dirtyFields.location ||
    dirtyFields.website;

  return (
    <form onSubmit={onProfileInfoSubmit} className="space-y-0">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.name.message?.toString()}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <AtSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  className="pl-8"
                  {...register("username")}
                  aria-invalid={!!errors.username}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.username.message?.toString()}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <div className="relative">
              <MessageSquare className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="bio"
                className="pl-8"
                placeholder="Tell us a little about yourself"
                {...register("bio")}
                aria-invalid={!!errors.bio}
              />
            </div>
            {errors.bio && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.bio.message?.toString()}
              </p>
            )}
          </div>

          <LocationSelector
            value={getValues("location") || ""}
            onChange={(location) => {
              form.setValue("location", location, { shouldDirty: true });
            }}
            error={errors.location?.message?.toString()}
            disabled={isUpdating}
          />

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                className="pl-8"
                placeholder="https://example.com"
                {...register("website")}
                aria-invalid={!!errors.website}
              />
            </div>
            {errors.website && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.website.message?.toString()}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isUpdating || !isProfileDirty} className="ml-auto">
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Profile
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
