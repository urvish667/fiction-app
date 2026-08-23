"use client";

import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ProfileFormValuesSubset } from "../../types/settings.types";
import { logError } from "@/lib/error-logger";

interface SocialLinksFormProps {
  form: UseFormReturn<ProfileFormValuesSubset>;
  isUpdating: boolean;
  saveSocialLinks: (data: Pick<ProfileFormValuesSubset, "username" | "socialLinks">) => Promise<void>;
}

const SocialLinkField = ({
  id,
  label,
  placeholder,
  register,
  error,
}: {
  id: "twitter" | "instagram" | "facebook";
  label: string;
  placeholder: string;
  register: UseFormReturn<ProfileFormValuesSubset>["register"];
  error?: { message?: string };
}) => (
  <div className="space-y-2">
    <Label htmlFor={id}>{label}</Label>
    <div className="relative">
      <Input
        id={id}
        placeholder={placeholder}
        {...register(`socialLinks.${id}`)}
        aria-invalid={!!error}
      />
    </div>
    {error && (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error.message?.toString()}
      </p>
    )}
  </div>
);

export const SocialLinksForm = ({ form, isUpdating, saveSocialLinks }: SocialLinksFormProps) => {
  const { toast } = useToast();
  const { register, formState: { errors, dirtyFields }, trigger, getValues } = form;

  const handleSaveSocialLinks = async () => {
    try {
      const currentSocialLinks = getValues("socialLinks") || {};

      const cleanedSocialLinks = {
        twitter: currentSocialLinks.twitter?.trim() || null,
        instagram: currentSocialLinks.instagram?.trim() || null,
        facebook: currentSocialLinks.facebook?.trim() || null,
      };

      const fieldsToValidate: ("username" | "socialLinks.twitter" | "socialLinks.instagram" | "socialLinks.facebook")[] = ["username"];

      if (cleanedSocialLinks.twitter) fieldsToValidate.push("socialLinks.twitter");
      if (cleanedSocialLinks.instagram) fieldsToValidate.push("socialLinks.instagram");
      if (cleanedSocialLinks.facebook) fieldsToValidate.push("socialLinks.facebook");

      const isValid = await trigger(fieldsToValidate);

      if (!isValid) {
        toast({
          title: "Validation Error",
          description: "Please check your social links for errors.",
          variant: "destructive",
        });
        return;
      }

      const socialData = {
        username: getValues("username"),
        socialLinks: cleanedSocialLinks,
      };

      await saveSocialLinks(socialData);
    } catch (error) {
      logError(error, { context: "Error saving social links" });
      toast({
        title: "Error",
        description: "Failed to save social links. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSocialLinksDirty =
    !!dirtyFields.socialLinks &&
    typeof dirtyFields.socialLinks === "object" &&
    (!!dirtyFields.socialLinks.twitter || !!dirtyFields.socialLinks.instagram || !!dirtyFields.socialLinks.facebook);

  return (
    <form className="space-y-0">
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>Connect your social media profiles (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SocialLinkField
            id="twitter"
            label="Twitter / X"
            placeholder="https://twitter.com/username"
            register={register}
            error={errors.socialLinks?.twitter}
          />

          <SocialLinkField
            id="instagram"
            label="Instagram"
            placeholder="https://instagram.com/username"
            register={register}
            error={errors.socialLinks?.instagram}
          />

          <SocialLinkField
            id="facebook"
            label="Facebook"
            placeholder="https://facebook.com/username"
            register={register}
            error={errors.socialLinks?.facebook}
          />
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={handleSaveSocialLinks}
            disabled={isUpdating || !isSocialLinksDirty}
            className="ml-auto"
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Social Links
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};
