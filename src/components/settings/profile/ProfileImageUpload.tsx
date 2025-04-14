import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/lib/image-upload";
import type { ExtendedSession } from "../ProfileSettings";

interface ProfileImageUploadProps {
  session: ExtendedSession | null;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  updateProfileImage?: (imageUrl: string) => Promise<void>;
}

export const ProfileImageUpload = ({
  session,
  isUploading,
  setIsUploading,
  updateProfileImage,
}: ProfileImageUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user?.id) return;

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Process the image (resize, compress)
      const processedFile = await ImageUpload.processImage(file, 400, 400);

      // Upload the image
      const imageUrl = await ImageUpload.uploadProfileImage(session.user.id, processedFile);

      // Update the user's profile image
      if (updateProfileImage) {
        await updateProfileImage(imageUrl);
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error uploading profile image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveProfileImage = async () => {
    if (!session?.user?.id || !updateProfileImage) return;

    try {
      setIsUploading(true);
      await updateProfileImage("");
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed",
      });
    } catch (error) {
      console.error("Error removing profile image:", error);
      toast({
        title: "Error",
        description: "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Picture</CardTitle>
        <CardDescription>Upload a new profile picture</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <Avatar className="h-32 w-32 mb-4">
          <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
          <AvatarFallback>{session?.user?.name?.[0] || "?"}</AvatarFallback>
        </Avatar>

        <div className="flex gap-2 mt-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload
              </>
            )}
          </Button>
          {session?.user?.image && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRemoveProfileImage}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleProfileImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Recommended: Square image, at least 400x400 pixels.
        </p>
      </CardContent>
    </Card>
  );
}; 