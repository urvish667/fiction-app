"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, Save, Trash2, AlertCircle, Eye, BookOpen, Plus, FileText, Clock, CheckCircle2, Edit } from "lucide-react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { useDebounce } from "@/hooks/use-debounce"
import { StoryService } from "@/services/story-service"
import { CreateStoryRequest, UpdateStoryRequest } from "@/types/story"

// Sample genres for the dropdown
const genres = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Adventure",
  "Historical Fiction",
  "Young Adult",
  "Thriller",
  "Poetry",
  "Drama",
  "Comedy",
]

// Sample languages for the dropdown
const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Korean",
  "Russian",
  "Arabic",
  "Portuguese",
  "Italian",
]

export default function StoryInfoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Story metadata state
  const [storyData, setStoryData] = useState({
    id: "", // Will be generated when first saved
    title: "",
    description: "",
    genre: "",
    language: "English",
    isMature: false,
    coverImage: "/placeholder.svg?height=1600&width=900",
    status: "draft", // "draft", "ongoing", or "completed"
    lastSaved: null as Date | null,
    slug: "", // For URL routing
  })

  // Form validation state
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    genre: "",
  })

  // Loading states
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isLoadingChapters, setIsLoadingChapters] = useState(false)

  // Track if story data has changed since last save
  const [hasChanges, setHasChanges] = useState(false);

  // Chapters state
  const [chapters, setChapters] = useState<Array<{
    id: string;
    title: string;
    status: "published" | "draft" | "scheduled" | "premium";
    wordCount: number;
    lastUpdated: Date;
    number: number;
  }>>([]);

  // Create debounced version of storyData for auto-save
  const debouncedStoryData = useDebounce(storyData, 3000);

  // Auto-save effect
  useEffect(() => {
    // Auto-save if we have a title and there are changes
    if (debouncedStoryData.title.trim() && hasChanges && !isSaving) {
      console.log('Auto-save triggered, current storyData:', debouncedStoryData);
      const autoSave = async () => {
        try {
          // Save the current state of the story data
          const currentData = { ...debouncedStoryData };
          console.log('Auto-saving with data:', currentData);
          await saveStoryData(false, currentData);
          console.log('Auto-save completed');
          // Don't set hasChanges to false here - we'll do it in saveStoryData
        } catch (error) {
          console.error("Auto-save failed:", error);
          // Keep hasChanges true if save failed
        }
      };
      autoSave();
    }
  }, [debouncedStoryData, hasChanges, isSaving])

  // Get the session for authentication
  const { data: session } = useSession();

  // Load existing story data if editing
  useEffect(() => {
    const storyId = new URLSearchParams(window.location.search).get("id");

    if (storyId) {
      const fetchStory = async () => {
        try {
          const story = await StoryService.getStory(storyId);

          // Convert to our local state format
          setStoryData({
            id: story.id,
            title: story.title,
            description: story.description || "",
            genre: story.genre || "",
            language: story.language || "English",
            isMature: story.isMature,
            coverImage: story.coverImage || "/placeholder.svg?height=1600&width=900",
            status: story.status || "draft", // Load the story status
            lastSaved: new Date(story.updatedAt),
            slug: story.slug,
          });

          // Fetch chapters for this story
          fetchChapters(story.id);
        } catch (error) {
          console.error("Failed to fetch story", error);
          toast({
            title: "Error loading story",
            description: "Failed to load story data. Please try again.",
            variant: "destructive",
          });
        }
      };

      fetchStory();
    }
  }, [toast])

  // Fetch chapters for a story
  const fetchChapters = async (storyId: string) => {
    if (!storyId) return;

    setIsLoadingChapters(true);

    try {
      const chaptersData = await StoryService.getChapters(storyId);

      // Debug: Log the raw chapter data to see what's coming from the API
      console.log('Raw chapter data:', chaptersData);

      // Convert to our local format
      const formattedChapters = chaptersData.map(chapter => {
        // Debug: Log each chapter's draft status
        console.log(`Chapter ${chapter.id} isDraft:`, chapter.isDraft);

        return {
          id: chapter.id,
          title: chapter.title,
          status: chapter.isDraft ? "draft" : (chapter.isPremium ? "premium" : "published"),
          wordCount: chapter.wordCount,
          lastUpdated: new Date(chapter.updatedAt),
          number: chapter.number
        };
      });

      // Debug: Log the formatted chapters
      console.log('Formatted chapters:', formattedChapters);

      setChapters(formattedChapters);
    } catch (error) {
      console.error("Failed to fetch chapters", error);
      toast({
        title: "Error loading chapters",
        description: "Failed to load chapter data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Update the story data
    setStoryData((prev) => ({
      ...prev,
      [name]: value,
      lastSaved: null, // Mark as unsaved
    }))

    // Mark that we have unsaved changes
    setHasChanges(true);

    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [name]: value,
      lastSaved: null, // Mark as unsaved
    }))

    // Mark that we have unsaved changes
    setHasChanges(true);

    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  // Handle switch changes
  const handleSwitchChange = async (name: string, checked: boolean) => {
    // Special handling for status change to "completed"
    if (name === "status" && checked) { // checked means changing to "completed"
      // Check if the story has any draft chapters
      if (storyData.id) {
        try {
          const chapters = await StoryService.getChapters(storyData.id);
          const draftChapters = chapters.filter(chapter => chapter.isDraft);

          if (draftChapters.length > 0) {
            toast({
              title: "Cannot mark as completed",
              description: `This story has ${draftChapters.length} draft ${draftChapters.length === 1 ? "chapter" : "chapters"}. Please publish all draft chapters before marking the story as completed.`,
              variant: "destructive",
            });
            return; // Don't update the status
          }
        } catch (error) {
          console.error("Failed to check draft chapters:", error);
          toast({
            title: "Error",
            description: "Failed to check draft chapters. Please try again.",
            variant: "destructive",
          });
          return; // Don't update the status
        }
      }
    }

    // Update the state
    setStoryData((prev) => ({
      ...prev,
      [name]: checked,
      lastSaved: null, // Mark as unsaved
    }))

    // Mark that we have unsaved changes
    setHasChanges(true);
  }

  // Handle cover image upload
  const handleCoverImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      // First, read the file as an ArrayBuffer for S3 upload
      const arrayBuffer = await file.arrayBuffer();

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `stories/covers/${storyData.id || 'new'}-${timestamp}.${fileExtension}`;

      // Upload to S3
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: imageKey,
          contentType: file.type,
          data: Array.from(new Uint8Array(arrayBuffer)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }

      const data = await response.json();
      const imageUrl = data.url;
      console.log('Image uploaded, received URL:', imageUrl);

      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }

      // Update the story data with the S3 URL
      setStoryData((prev) => {
        console.log('Updating story data with new coverImage:', imageUrl);
        return {
          ...prev,
          coverImage: imageUrl,
          lastSaved: null, // Mark as unsaved
        };
      });
      // Explicitly trigger a save after image upload
      setHasChanges(true); // Mark that we have unsaved changes
      console.log('Story data updated, hasChanges set to true');

      // Force a save immediately instead of waiting for auto-save
      setTimeout(() => {
        console.log('Forcing save after image upload');
        // Get the latest state to ensure we have the most up-to-date data
        setStoryData(currentState => {
          console.log('Current state before forced save:', currentState);
          // Save with the current state to ensure we have the latest data
          saveStoryData(false, currentState);
          return currentState; // Don't actually change the state
        });
      }, 500);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setStoryData((prev) => ({
      ...prev,
      coverImage: "/placeholder.svg?height=1600&width=900",
      lastSaved: null, // Mark as unsaved
    }))
    setHasChanges(true); // Mark that we have unsaved changes
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {
      title: "",
      description: "",
      genre: "",
    }

    let isValid = true

    if (!storyData.title.trim()) {
      newErrors.title = "Title is required"
      isValid = false
    } else if (storyData.title.length > 100) {
      newErrors.title = "Title must be less than 100 characters"
      isValid = false
    }

    if (!storyData.description.trim()) {
      newErrors.description = "Description is required"
      isValid = false
    } else if (storyData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters"
      isValid = false
    }

    if (!storyData.genre) {
      newErrors.genre = "Please select a genre"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  // Save story data
  const saveStoryData = async (showToast = true, dataToSave = storyData) => {
    if (isSaving) return

    setIsSaving(true)

    try {
      // Prepare the story data for API
      // Log the coverImage value for debugging
      console.log('Cover image before save:', dataToSave.coverImage);

      // Ensure coverImage is included in the request if it exists and is not the placeholder
      const hasCoverImage = dataToSave.coverImage &&
                          dataToSave.coverImage !== "/placeholder.svg" &&
                          dataToSave.coverImage !== "/placeholder.svg?height=1600&width=900";

      console.log('Has cover image:', hasCoverImage);

      const storyRequest: CreateStoryRequest | UpdateStoryRequest = {
        title: dataToSave.title,
        description: dataToSave.description,
        genre: dataToSave.genre,
        language: dataToSave.language,
        isMature: dataToSave.isMature,
        coverImage: hasCoverImage ? dataToSave.coverImage : undefined,
        status: dataToSave.status || "draft", // Include the story status
      };

      // Log the request for debugging
      console.log('Story request:', storyRequest);

      let savedStory;

      if (dataToSave.id) {
        // Update existing story
        savedStory = await StoryService.updateStory(dataToSave.id, storyRequest);
      } else {
        // Create new story
        savedStory = await StoryService.createStory(storyRequest as CreateStoryRequest);
      }

      console.log('Story saved successfully, server response:', savedStory);

      // Update state with the saved story data
      const updatedStoryData = {
        ...dataToSave,
        id: savedStory.id,
        slug: savedStory.slug,
        lastSaved: new Date(),
        // Make sure to include the latest description from the server response
        description: savedStory.description || dataToSave.description,
        // Preserve the coverImage from the server response if it exists
        coverImage: savedStory.coverImage || dataToSave.coverImage,
      };

      console.log('Updated story data after save:', updatedStoryData);

      // Only update the state if the current data matches what we tried to save
      // This prevents overwriting newer changes that happened during the save operation
      setStoryData(prevData => {
        // Create a new object with the saved data
        const newData = { ...updatedStoryData };

        // Preserve user changes that might have happened during saving
        // For each field that could change during saving, check if it's different
        // from what we sent to the server

        // Description (text field)
        if (prevData.description !== dataToSave.description) {
          newData.description = prevData.description;
        }

        // Genre (select field)
        if (prevData.genre !== dataToSave.genre) {
          newData.genre = prevData.genre;
        }

        // Mature content (toggle)
        if (prevData.isMature !== dataToSave.isMature) {
          newData.isMature = prevData.isMature;
        }

        // Language (select field)
        if (prevData.language !== dataToSave.language) {
          newData.language = prevData.language;
        }

        // Cover image
        if (prevData.coverImage !== dataToSave.coverImage) {
          console.log('Preserving newer coverImage:', prevData.coverImage);
          newData.coverImage = prevData.coverImage;
        }

        console.log('Final state after preserving user changes:', newData);
        return newData;
      });

      setHasChanges(false); // Reset changes flag

      if (showToast) {
        toast({
          title: "Draft saved",
          description: "Your story has been saved as a draft.",
        });
      }

      // Return the updated story data for immediate use
      return updatedStoryData;
    } catch (error) {
      console.error("Failed to save story", error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save your story. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  // Publish story
  const publishStory = async () => {
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation failed",
        description: "Please fix the errors in the form before publishing.",
        variant: "destructive",
      })
      return
    }

    // Confirm publishing
    if (!window.confirm("Are you sure you want to publish this story? Published stories will be visible to all users.")) {
      return
    }

    setIsPublishing(true)

    try {
      // Instead of saving first and then updating, directly publish the story
      const storyRequest: CreateStoryRequest | UpdateStoryRequest = {
        title: storyData.title,
        description: storyData.description,
        genre: storyData.genre,
        language: storyData.language,
        isMature: storyData.isMature,
        coverImage: storyData.coverImage !== "/placeholder.svg?height=1600&width=900" ? storyData.coverImage : undefined,
        isDraft: false, // Set to published
        status: storyData.status // Include the story status
      };

      let publishedStory;

      if (storyData.id) {
        // Update existing story
        publishedStory = await StoryService.updateStory(storyData.id, storyRequest);
      } else {
        // Create new story
        publishedStory = await StoryService.createStory(storyRequest as CreateStoryRequest);
      }

      // Update local state
      setStoryData(prev => ({
        ...prev,
        isDraft: false,
        lastSaved: new Date()
      }))

      toast({
        title: "Story published",
        description: "Your story has been published successfully!",
      })

      // Redirect to the story page
      setTimeout(() => {
        router.push(`/story/${publishedStory.slug}`)
      }, 1500)
    } catch (error) {
      console.error("Failed to publish story", error)
      toast({
        title: "Publish failed",
        description: error instanceof Error ? error.message : "Failed to publish your story. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  // Handle proceed to editor
  const handleProceedToEditor = async () => {
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation failed",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      })
      return
    }

    // Save story data and get the updated data with ID
    const savedStory = await saveStoryData(false)

    // Navigate to editor using the ID from the saved story
    // We'll redirect to new-chapter to start creating the first chapter
    if (savedStory && savedStory.id) {
      router.push(`/write/editor/${savedStory.id}/new-chapter`)
    } else {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Handle creating a new chapter
  const handleCreateChapter = async () => {
    // First save the story if it's not saved yet
    if (!storyData.id) {
      if (!validateForm()) {
        toast({
          title: "Please complete story details",
          description: "Fill in all required fields before creating a chapter.",
          variant: "destructive",
        })
        return
      }

      const savedStory = await saveStoryData(false)
      if (savedStory) {
        // Navigate to editor with new chapter using new URL pattern
        router.push(`/write/editor/${savedStory.id}/new-chapter`)
      }
    } else {
      // Navigate to editor with new chapter using new URL pattern
      router.push(`/write/editor/${storyData.id}/new-chapter`)
    }
  }

  // Handle editing an existing chapter
  const handleEditChapter = (chapterId: string) => {
    // Use the new URL pattern
    router.push(`/write/editor/${storyData.id}/${chapterId}`)
  }

  // Check authentication
  useEffect(() => {
    if (!session) {
      // Redirect to login if not authenticated
      router.push('/login?callbackUrl=/write/story-info')
    }
  }, [session, router])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="pl-0 flex items-center gap-2">
            <ArrowLeft size={16} />
            Back
          </Button>

          <div className="flex items-center gap-2">
            {storyData.id && !storyData.isDraft && (
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs rounded-full">
                Published
              </div>
            )}
            {/* Save Draft and Publish buttons removed */}
          </div>
        </div>

        {/* Last saved indicator */}
        <div className="mb-4 flex justify-end items-center gap-2">
          {isSaving ? (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></span>
              Auto-saving...
            </div>
          ) : storyData.lastSaved ? (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock size={14} />
              Auto-saved: {storyData.lastSaved.toLocaleString()}
            </div>
          ) : hasChanges ? (
            <div className="text-sm text-muted-foreground">
              Unsaved changes
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Cover Image */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-4"
            >
              <h2 className="text-xl font-bold">Cover Image</h2>

              <div
                className="relative aspect-[16/9] rounded-lg overflow-hidden border cursor-pointer group"
                onClick={handleCoverImageClick}
              >
                {isUploading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <Image
                      src={storyData.coverImage || "/placeholder.svg"}
                      alt="Story cover"
                      fill
                      className="object-cover transition-opacity group-hover:opacity-70"
                      unoptimized={true} // Always use unoptimized for external images
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/80 rounded-full p-3">
                        <Upload size={24} />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCoverImageClick} className="flex-1" disabled={isUploading}>
                  Upload Image
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRemoveCoverImage}
                  disabled={storyData.coverImage === "/placeholder.svg?height=1600&width=900" || isUploading}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">Recommended size: 1600x900 pixels. Max file size: 5MB.</p>
            </motion.div>
          </div>

          {/* Story Details Form */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-3xl font-bold">Story Details</h1>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={storyData.title}
                  onChange={handleInputChange}
                  placeholder="Enter your story title"
                  maxLength={100}
                />
                <div className="flex justify-between">
                  {errors.title ? (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.title}
                    </p>
                  ) : (
                    <span className="text-sm text-muted-foreground">Be creative but clear</span>
                  )}
                  <span className="text-sm text-muted-foreground">{storyData.title.length}/100</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    name="description"
                    value={storyData.description}
                    onChange={handleInputChange}
                    placeholder="Write a compelling description for your story"
                    className="min-h-[150px]"
                    maxLength={1000}
                    // Disable the textarea during saving to prevent race conditions
                    disabled={isSaving && !hasChanges}
                  />
                  {isSaving && !hasChanges && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
                    {errors.description ? (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.description}
                      </p>
                    ) : isSaving ? (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                        {hasChanges ? "Saving changes..." : "Saving..."}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Hook your readers with an engaging description
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{storyData.description.length}/1000</span>
                </div>
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="genre">
                    Genre <span className="text-destructive">*</span>
                  </Label>
                  {isSaving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                      Saving...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Select
                    value={storyData.genre}
                    onValueChange={(value) => handleSelectChange("genre", value)}
                    disabled={isSaving && !hasChanges}
                  >
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Select a genre" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.genre && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.genre}
                  </p>
                )}
              </div>

              {/* Language */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="language">Language</Label>
                  {isSaving && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                      Saving...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Select
                    value={storyData.language}
                    onValueChange={(value) => handleSelectChange("language", value)}
                    disabled={isSaving && !hasChanges}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language} value={language}>
                          {language}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Mature Content Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mature-content">
                      Mature Content
                    </Label>
                    {isSaving && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                        Saving...
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Contains adult themes, violence, or explicit content</p>
                </div>
                <div className="relative">
                  <Switch
                    id="mature-content"
                    checked={storyData.isMature}
                    onCheckedChange={(checked) => handleSwitchChange("isMature", checked)}
                    disabled={isSaving && !hasChanges}
                  />
                </div>
              </div>

              {/* Story Status Toggle */}
              <div className="flex items-center justify-between space-x-2 mt-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="story-status">
                      Story Completed
                    </Label>
                    {isSaving && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                        Saving...
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {storyData.status === "completed"
                      ? "This story is complete with all chapters published. No draft chapters allowed."
                      : "This story is ongoing with published chapters. You can have draft chapters that are only visible to you."}
                  </p>
                </div>
                <div className="relative">
                  <Switch
                    id="story-status"
                    checked={storyData.status === "completed"}
                    onCheckedChange={(checked) => handleSwitchChange("status", checked ? "completed" : "ongoing")}
                    disabled={isSaving && !hasChanges}
                  />
                </div>
              </div>

              {/* Action Buttons - Removed */}
              <div className="pt-6 flex flex-wrap gap-4">
                {storyData.id && !storyData.isDraft && (
                  <Button
                    onClick={() => router.push(`/story/${storyData.slug}`)}
                    size="lg"
                    className="w-full md:w-auto flex items-center gap-2"
                  >
                    <BookOpen size={18} />
                    View Published Story
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Chapters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-12"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Chapters</h2>
            <Button onClick={handleCreateChapter} className="flex items-center gap-2">
              <Plus size={16} />
              New Chapter
            </Button>
          </div>

          {isLoadingChapters ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : chapters.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {chapters.map((chapter) => (
                <Card key={chapter.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center p-4">
                      <div className="flex-shrink-0 mr-4">
                        <div className="bg-muted/50 rounded-full p-3">
                          <FileText size={24} className="text-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{chapter.title}</h3>
                          <div className="flex gap-1">
                            {/* Debug: Show the actual status */}
                            <Badge variant={chapter.status === "draft" ? "outline" : "default"} className={chapter.status === "premium" ? "bg-amber-500" : ""}>
                              {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Last updated: {formatDate(chapter.lastUpdated)}</span>
                          </div>
                          <div>{chapter.wordCount} words</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleEditChapter(chapter.id)}
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => router.push(`/story/${storyData.slug}/chapter/${chapter.number}`)}
                        >
                          <Eye size={14} />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-muted/30 rounded-full p-4 mb-4">
                  <FileText size={32} className="text-muted-foreground" />
                </div>
                <h3 className="text-xl font-medium mb-2">No chapters yet</h3>
                <p className="text-muted-foreground mb-6 text-center max-w-md">
                  Start writing your story by creating your first chapter. You can add as many chapters as you need.
                </p>
                <Button onClick={handleCreateChapter} className="flex items-center gap-2">
                  <Plus size={16} />
                  Create First Chapter
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Publishing Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mb-12 bg-muted/30 rounded-lg p-6"
        >
          <h2 className="text-xl font-bold mb-4">Publishing Tips</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Complete your story details</h3>
                <p className="text-sm text-muted-foreground">
                  A compelling title and description will help readers find and engage with your story.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Create engaging chapters</h3>
                <p className="text-sm text-muted-foreground">
                  Break your story into chapters to make it easier to read and navigate.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Preview before publishing</h3>
                <p className="text-sm text-muted-foreground">
                  Always preview your chapters to catch any formatting issues or typos.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <SiteFooter />
    </div>
  )
}

