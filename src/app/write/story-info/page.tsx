"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Upload, Save, Trash2, AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import { useDebounce } from "@/hooks/use-debounce"

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

  // Create debounced version of storyData for auto-save
  const debouncedStoryData = useDebounce(storyData, 1500)

  // Auto-save effect
  useEffect(() => {
    // Only auto-save if we have a title (to avoid saving empty stories)
    if (debouncedStoryData.title.trim()) {
      saveStoryData(false)
    }
  }, [debouncedStoryData])

  // Load existing story data if editing
  useEffect(() => {
    // In a real app, we would fetch from API if there's a storyId in the URL or localStorage
    const savedStory = localStorage.getItem("draftStory")
    if (savedStory) {
      try {
        const parsedStory = JSON.parse(savedStory)
        setStoryData(parsedStory)
      } catch (error) {
        console.error("Failed to parse saved story", error)
      }
    }
  }, [])

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Update the story data
    setStoryData((prev) => ({
      ...prev,
      [name]: value,
      lastSaved: null, // Mark as unsaved
    }))

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
  const saveStoryData = async (showToast = true) => {
    if (isSaving) return

    setIsSaving(true)

    try {
      // In a real app, we would save to an API
      // For this demo, we'll use localStorage

      // Create a copy of the current story data to work with
      const updatedStoryData = {
        ...storyData,
        lastSaved: new Date(),
      }

      // Generate an ID if this is a new story
      if (!updatedStoryData.id) {
        updatedStoryData.id = `story_${Date.now()}`
      }

      // Save to localStorage
      localStorage.setItem("draftStory", JSON.stringify(updatedStoryData))

      // Update state
      setStoryData(updatedStoryData)

      if (showToast) {
        toast({
          title: "Draft saved",
          description: "Your story has been saved as a draft.",
        })
      }

      // Return the updated story data (with ID) for immediate use
      return updatedStoryData
    } catch (error) {
      console.error("Failed to save story", error)
      toast({
        title: "Save failed",
        description: "Failed to save your story. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsSaving(false)
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

          <Button
            variant="outline"
            onClick={() => saveStoryData(true)}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>
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
                <Textarea
                  id="description"
                  name="description"
                  value={storyData.description}
                  onChange={handleInputChange}
                  placeholder="Write a compelling description for your story"
                  className="min-h-[150px]"
                  maxLength={1000}
                />
                <div className="flex justify-between">
                  {errors.description ? (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle size={14} />
                      {errors.description}
                    </p>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Hook your readers with an engaging description
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">{storyData.description.length}/1000</span>
                </div>
              </div>

              {/* Genre */}
              <div className="space-y-2">
                <Label htmlFor="genre">
                  Genre <span className="text-destructive">*</span>
                </Label>
                <Select value={storyData.genre} onValueChange={(value) => handleSelectChange("genre", value)}>
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
                {errors.genre && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.genre}
                  </p>
                )}
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select value={storyData.language} onValueChange={(value) => handleSelectChange("language", value)}>
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

              {/* Mature Content Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="mature-content" className="flex-1">
                  Mature Content
                  <p className="text-sm text-muted-foreground">Contains adult themes, violence, or explicit content</p>
                </Label>
                <Switch
                  id="mature-content"
                  checked={storyData.isMature}
                  onCheckedChange={(checked) => handleSwitchChange("isMature", checked)}
                />
              </div>

              {/* Proceed Button */}
              <div className="pt-6">
                <Button onClick={handleProceedToEditor} size="lg" className="w-full md:w-auto">
                  Proceed to Editor
                </Button>
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

