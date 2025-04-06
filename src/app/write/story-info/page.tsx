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
import { ArrowLeft, Upload, Save, Trash2, AlertCircle, Eye, BookOpen } from "lucide-react"
import Navbar from "@/components/navbar"
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
    coverImage: "/placeholder.svg?height=600&width=400",
    isDraft: true,
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

  // Track if story data has changed since last save
  const [hasChanges, setHasChanges] = useState(false);

  // Create debounced version of storyData for auto-save
  const debouncedStoryData = useDebounce(storyData, 3000);

  // Auto-save effect
  useEffect(() => {
    // Only auto-save if we have a title and there are changes
    if (debouncedStoryData.title.trim() && hasChanges && !isSaving) {
      const autoSave = async () => {
        try {
          // Save the current state of the story data
          const currentData = { ...debouncedStoryData };
          await saveStoryData(false, currentData);
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
            coverImage: story.coverImage || "/placeholder.svg?height=600&width=400",
            isDraft: story.isDraft,
            lastSaved: new Date(story.updatedAt),
            slug: story.slug,
          });
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
  const handleSwitchChange = (name: string, checked: boolean) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // In a real app, we would upload to a server/CDN
    // For this demo, we'll use a local URL
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setStoryData((prev) => ({
          ...prev,
          coverImage: event.target?.result as string,
          lastSaved: null, // Mark as unsaved
        }))
        setHasChanges(true); // Mark that we have unsaved changes
        setIsUploading(false)
      }
    }
    reader.onerror = () => {
      toast({
        title: "Upload failed",
        description: "Failed to read the image file.",
        variant: "destructive",
      })
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setStoryData((prev) => ({
      ...prev,
      coverImage: "/placeholder.svg?height=600&width=400",
      lastSaved: null, // Mark as unsaved
    }))
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
      const storyRequest: CreateStoryRequest | UpdateStoryRequest = {
        title: dataToSave.title,
        description: dataToSave.description,
        genre: dataToSave.genre,
        language: dataToSave.language,
        isMature: dataToSave.isMature,
        coverImage: dataToSave.coverImage !== "/placeholder.svg?height=600&width=400" ? dataToSave.coverImage : undefined,
        isDraft: true, // Always save as draft initially
      };

      let savedStory;

      if (dataToSave.id) {
        // Update existing story
        savedStory = await StoryService.updateStory(dataToSave.id, storyRequest);
      } else {
        // Create new story
        savedStory = await StoryService.createStory(storyRequest as CreateStoryRequest);
      }

      // Update state with the saved story data
      const updatedStoryData = {
        ...dataToSave,
        id: savedStory.id,
        slug: savedStory.slug,
        lastSaved: new Date(),
        // Make sure to include the latest description from the server response
        description: savedStory.description || dataToSave.description,
      };

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
      // Save story data first
      const savedStory = await saveStoryData(false)

      if (!savedStory || !savedStory.id) {
        throw new Error("Failed to save story before publishing")
      }

      // Update the story to set isDraft to false
      const publishedStory = await StoryService.updateStory(savedStory.id, {
        isDraft: false
      })

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
    if (savedStory && savedStory.id) {
      router.push(`/write/editor/${savedStory.id}`)
    } else {
      toast({
        title: "Error",
        description: "Failed to create story. Please try again.",
        variant: "destructive",
      })
    }
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

            <Button
              variant="outline"
              onClick={() => saveStoryData(true)}
              disabled={isSaving || isPublishing}
              className="flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>

            {storyData.id && storyData.isDraft && (
              <Button
                variant="default"
                onClick={publishStory}
                disabled={isSaving || isPublishing}
                className="flex items-center gap-2"
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </Button>
            )}
          </div>
        </div>

        {/* Last saved indicator */}
        {storyData.lastSaved && (
          <p className="text-sm text-muted-foreground mb-4 text-right">
            Last saved: {storyData.lastSaved.toLocaleString()}
          </p>
        )}

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
                className="relative aspect-[2/3] rounded-lg overflow-hidden border cursor-pointer group"
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
                  disabled={storyData.coverImage === "/placeholder.svg?height=600&width=400" || isUploading}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">Recommended size: 600x900 pixels. Max file size: 5MB.</p>
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

              {/* Action Buttons */}
              <div className="pt-6 flex flex-wrap gap-4">
                {storyData.id && !storyData.isDraft ? (
                  <>
                    <Button
                      onClick={() => router.push(`/story/${storyData.slug}`)}
                      size="lg"
                      className="w-full md:w-auto flex items-center gap-2"
                    >
                      <BookOpen size={18} />
                      View Published Story
                    </Button>
                    <Button
                      onClick={handleProceedToEditor}
                      variant="outline"
                      size="lg"
                      className="w-full md:w-auto flex items-center gap-2"
                    >
                      <Eye size={18} />
                      Edit in Editor
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleProceedToEditor}
                    size="lg"
                    className="w-full md:w-auto"
                    disabled={isPublishing}
                  >
                    {storyData.id ? "Continue in Editor" : "Proceed to Editor"}
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-10 px-4 bg-muted">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold font-serif">FableSpace</h2>
              <p className="text-muted-foreground">Unleash your stories, one page at a time.</p>
            </div>
            <div className="flex gap-8">
              <div>
                <h3 className="font-medium mb-2">Platform</h3>
                <ul className="space-y-1">
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      Browse
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      Write
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      Challenges
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Company</h3>
                <ul className="space-y-1">
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-muted-foreground hover:text-foreground">
                      Contact
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FableSpace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

