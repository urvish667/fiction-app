import { z } from "zod";
import { useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, AtSign, Link, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormValuesSubset } from "../ProfileSettings";
import { logError } from "@/lib/error-logger";
import { LocationSelector } from "./LocationSelector";

interface ProfileInfoFormProps {
  form: UseFormReturn<ProfileFormValuesSubset>;
  isUpdating: boolean;
  saveProfileInfo: (data: Partial<Pick<ProfileFormValuesSubset, 'name' | 'username' | 'bio' | 'location' | 'website'>>) => Promise<void>;
}

export const ProfileInfoForm = ({ form, isUpdating, saveProfileInfo }: ProfileInfoFormProps) => {
  const { toast } = useToast();

  // Destructure for easier access
  const { register, formState: { errors, dirtyFields }, getValues } = form;

  // Handler for the Profile Info form's onSubmit
  const onProfileInfoSubmit = async (event: React.FormEvent) => {
    // Prevent default form submission
    event.preventDefault();

    try {
      // Get current values directly for only profile fields
      const profileData = {
        name: getValues('name'),
        username: getValues('username'),
        bio: getValues('bio'),
        location: getValues('location'),
        website: getValues('website'),
      };

      // Create a subset schema for just profile fields
      const profileFieldsSchema = z.object({
        name: z.string().max(50, "Name is too long").optional(),
        username: z.string()
          .min(3, "Username must be at least 3 characters")
          .max(30, "Username must be less than 30 characters")
          .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
        location: z.string().max(100, "Location must be less than 100 characters").optional().nullable(),
        website: z.union([z.literal(''), z.string().url("Please enter a valid URL")]).optional().nullable(),
      });

      // Manually validate just the profile fields
      try {
        profileFieldsSchema.parse(profileData);

        // Check if any profile fields are dirty
        const isProfileDataDirty = dirtyFields.name || dirtyFields.username ||
          dirtyFields.bio || dirtyFields.location || dirtyFields.website;

        if (isProfileDataDirty) {
          // Save profile data
          await saveProfileInfo(profileData);
        } else {
          toast({
            title: "No Changes",
            description: "You haven't modified any profile information fields.",
            duration: 3000,
          });
        }
      } catch (error) {
        logError(error, { context: "Profile info validation failed" })
        // Update the form's error state with the validation errors
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            const path = err.path[0] as keyof typeof profileData;
            form.setError(path, { message: err.message });
          });
        }

        toast({
          title: "Validation Error",
          description: "Please check your profile information fields for errors.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logError(error, { context: "Error saving profile info" })
      toast({
        title: "Error",
        description: "Failed to save profile information. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine if profile fields are dirty for button state
  const isProfileDirty = dirtyFields.name || dirtyFields.username ||
    dirtyFields.bio || dirtyFields.location || dirtyFields.website;

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
            value={getValues('location') || ""}
            onChange={(location) => {
              form.setValue('location', location, { shouldDirty: true });
            }}
            error={errors.location?.message?.toString()}
            disabled={isUpdating}
          />

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <div className="relative">
              <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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