import type { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProfileFormValuesSubset } from "../ProfileSettings";

interface SocialLinksFormProps {
  form: UseFormReturn<ProfileFormValuesSubset>;
  isUpdating: boolean;
  saveSocialLinks: (data: Pick<ProfileFormValuesSubset, 'username' | 'socialLinks'>) => Promise<void>;
}

// Helper component to reduce repetition in social media fields
const SocialLinkField = ({ 
  id, 
  label,
  placeholder,
  register, 
  error
}: { 
  id: 'twitter' | 'instagram' | 'facebook', 
  label: string,
  placeholder: string,
  register: UseFormReturn<ProfileFormValuesSubset>['register'],
  error?: { message?: string }
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
  
  // Destructure for easier access
  const { register, formState: { errors, dirtyFields }, trigger, getValues } = form;

  // Handler for the Social Links button's onClick
  const handleSaveSocialLinks = async () => {
    try {
      // Get current values
      const currentSocialLinks = getValues('socialLinks') || {};
      
      // Convert empty strings to null to satisfy schema
      const cleanedSocialLinks = {
        twitter: currentSocialLinks.twitter?.trim() || null,
        instagram: currentSocialLinks.instagram?.trim() || null,
        facebook: currentSocialLinks.facebook?.trim() || null,
      };
      
      // Define fields that need validation (only non-null values)
      const fieldsToValidate: ('username' | 'socialLinks.twitter' | 'socialLinks.instagram' | 'socialLinks.facebook')[] = ['username'];
      
      if (cleanedSocialLinks.twitter) fieldsToValidate.push('socialLinks.twitter');
      if (cleanedSocialLinks.instagram) fieldsToValidate.push('socialLinks.instagram');
      if (cleanedSocialLinks.facebook) fieldsToValidate.push('socialLinks.facebook');
      
      // Validate only the relevant social fields
      const isValid = await trigger(fieldsToValidate);
      
      if (isValid) {
        // Prepare data with username and cleaned social links
        const socialData = {
          username: getValues('username'),
          socialLinks: cleanedSocialLinks
        };
        
        // Save social links data
        await saveSocialLinks(socialData);
      } else {
        console.log("Social links validation failed for fields:", fieldsToValidate);
        toast({
          title: "Validation Error",
          description: "Please check your social links for errors.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving social links:", error);
      toast({
        title: "Error",
        description: "Failed to save social links. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Determine if social links are dirty for button state
  const isSocialLinksDirty = 
    !!dirtyFields.socialLinks && 
    typeof dirtyFields.socialLinks === 'object' && 
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