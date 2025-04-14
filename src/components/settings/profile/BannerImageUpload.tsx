import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/lib/image-upload";
import type { ExtendedSession } from "../ProfileSettings";

interface BannerImageUploadProps {
  session: ExtendedSession | null;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  updateBannerImage?: (imageUrl: string) => Promise<void>;
  className?: string;
}

export const BannerImageUpload = ({
  session,
  isUploading,
  setIsUploading,
  updateBannerImage,
  className = "",
}: BannerImageUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const processedFile = await ImageUpload.processImage(file, 1200, 300);

      // Upload the image
      const imageUrl = await ImageUpload.uploadBannerImage(session.user.id, processedFile);

      // Update the user's banner image
      if (updateBannerImage) {
        await updateBannerImage(imageUrl);
        toast({
          title: "Banner updated",
          description: "Your profile banner has been updated successfully",
        });
      }
    } catch (error) {
      console.error("Error uploading banner image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload banner image. Please try again.",
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

  const handleRemoveBannerImage = async () => {
    if (!session?.user?.id || !updateBannerImage) return;

    try {
      setIsUploading(true);
      await updateBannerImage("");
      toast({
        title: "Banner removed",
        description: "Your profile banner has been removed",
      });
    } catch (error) {
      console.error("Error removing banner image:", error);
      toast({
        title: "Error",
        description: "Failed to remove banner image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Profile Banner</CardTitle>
        <CardDescription>Upload a new profile banner</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-full h-32 rounded-md overflow-hidden mb-4">
          {session?.user?.bannerImage ? (
            <img
              src={session.user.bannerImage}
              alt="Profile banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full bg-gray-100">
              <ImageIcon className="h-12 w-12 text-gray-300" />
            </div>
          )}
        </div>

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
          {session?.user?.bannerImage && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleRemoveBannerImage}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleBannerImageUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Recommended: 1200x300 pixels.
        </p>
      </CardContent>
    </Card>
  );
}; 