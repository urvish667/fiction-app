import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/lib/image-upload";
import { logError } from "@/lib/error-logger";

export function useImageUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndUploadImage = async ({
    file,
    userId,
    width,
    height,
    uploadFn,
    updateFn,
    successTitle,
    successMessage,
    setUploading,
  }: {
    file: File;
    userId: string;
    width: number;
    height: number;
    uploadFn: (userId: string, file: File) => Promise<string>;
    updateFn?: (imageUrl: string) => Promise<void>;
    successTitle: string;
    successMessage: string;
    setUploading: (isUploading: boolean) => void;
  }) => {
    if (!file) return;

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
      setUploading(true);

      // Process the image (resize, compress)
      const processedFile = await ImageUpload.processImage(file, width, height);

      // Upload the image
      const imageUrl = await uploadFn(userId, processedFile);

      // Update if update function provided
      if (updateFn) {
        await updateFn(imageUrl);
        toast({
          title: successTitle,
          description: successMessage,
        });
      }
    } catch (error) {
      logError(error, { context: "Error uploading image" })
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async ({
    userId,
    updateFn,
    successTitle,
    successMessage,
    setUploading,
  }: {
    userId: string;
    updateFn?: (imageUrl: string) => Promise<void>;
    successTitle: string;
    successMessage: string;
    setUploading: (isUploading: boolean) => void;
  }) => {
    if (!updateFn) return;

    try {
      setUploading(true);
      await updateFn("");
      toast({
        title: successTitle,
        description: successMessage,
      });
    } catch (error) {
      logError(error, { context: "Error removing image" })
      toast({
        title: "Error",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return {
    fileInputRef,
    processAndUploadImage,
    handleRemoveImage,
  };
} 