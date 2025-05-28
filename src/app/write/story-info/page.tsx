"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, Upload, Trash2, AlertCircle, Eye, BookOpen, Plus, FileText, Clock, CheckCircle2, Edit, X } from "lucide-react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
import { useDebounce } from "@/hooks/use-debounce"
import { StoryService } from "@/services/story-service"
import { CreateStoryRequest, UpdateStoryRequest } from "@/types/story"
import { fetchWithCsrf } from "@/lib/client/csrf"

import { logError } from "@/lib/error-logger"
import { licenses } from "@/constants/licenses"

// Types for the story info page
interface StoryFormData {
  id: string;
  title: string;
  description: string;
  genre: string;
  language: string;
  isMature: boolean;
  coverImage: string;
  status: "draft" | "ongoing" | "completed";
  license: string;
  lastSaved: Date | null;
  slug: string;
}

interface FormErrors {
  title: string;
  description: string;
  genre: string;
}

interface ChapterData {
  id: string;
  title: string;
  status: "published" | "draft" | "scheduled" | "premium";
  wordCount: number;
  lastUpdated: Date;
  number: number;
}

interface TagData {
  name: string;
}

export default function StoryInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reference data state
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagData[]>([]);
  const [popularTags, setPopularTags] = useState<TagData[]>([]);
  const [tagError, setTagError] = useState<string>("");
  const [isSavingTags, setIsSavingTags] = useState(false);



  // Story data state
  const [storyData, setStoryData] = useState<StoryFormData>({
    id: "",
    title: "",
    description: "",
    genre: "",
    language: "English",
    isMature: false,
    coverImage: "/placeholder.svg?height=1600&width=900",
    status: "draft",
    license: "ALL_RIGHTS_RESERVED",
    lastSaved: null,
    slug: "",
  });

  // Form validation state
  const [errors, setErrors] = useState<FormErrors>({
    title: "",
    description: "",
    genre: "",
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<{id: string, title: string} | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [justCreatedStory, setJustCreatedStory] = useState(false);
  const [chapters, setChapters] = useState<ChapterData[]>([]);

  // Create debounced version of storyData for auto-save
  const debouncedStoryData = useDebounce(storyData, 2000);



  // Fetch genres/languages/tags on mount
  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres);
    fetch("/api/languages").then(r => r.json()).then(setLanguages);
    fetch("/api/tags").then(r => r.json()).then(data => {
      setPopularTags(data);
      setTagSuggestions(data);
    });
  }, []);

  // Fetch story tags when editing an existing story
  useEffect(() => {
    if (storyData.id) {
      fetch(`/api/stories/${storyData.id}/tags`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) {
            const tagNames = data.map((t: any) => t.name);
            setTags(tagNames);
          }
        })
        .catch(error => {
          logError(error, { context: 'Fetching story tags', storyId: storyData.id });
        });
    }
  }, [storyData.id]);

  // Tag input normalization & validation
  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    if (tags.length >= 10) {
      setTagError("You can add up to 10 tags.");
      return;
    }

    // Update tags state
    const newTags = [...tags, tag];
    setTags(newTags);
    setTagInput("");
    setTagError("");

    // Mark that we have unsaved changes when adding a tag
    setHasChanges(true);

    // Immediate auto-save for tags
    if (storyData.id && !isSaving && !isSavingTags) {
      setTimeout(async () => {
        try {
          setIsSavingTags(true);
          const response = await fetchWithCsrf('/api/tags/upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storyId: storyData.id, tags: newTags }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            logError(new Error(`Failed to save tags: ${errorData.error}`), {
              context: 'Immediate tag save after add',
              storyId: storyData.id,
              tags: newTags
            });
          }
        } catch (err) {
          logError(err, { context: 'Immediate tag save after add', storyId: storyData.id, tags: newTags });
        } finally {
          setIsSavingTags(false);
        }
      }, 100); // Very short delay to ensure state is updated
    }
  }, [tags, storyData.id, isSaving, isSavingTags]);

  const removeTag = useCallback((idx: number) => {
    // Update tags state
    const newTags = tags.filter((_, i) => i !== idx);
    setTags(newTags);
    setTagError("");

    // Mark that we have unsaved changes when removing a tag
    setHasChanges(true);

    // Immediate auto-save for tags
    if (storyData.id && !isSaving && !isSavingTags) {
      setTimeout(async () => {
        try {
          setIsSavingTags(true);
          const response = await fetchWithCsrf('/api/tags/upsert', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storyId: storyData.id, tags: newTags }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            logError(new Error(`Failed to save tags: ${errorData.error}`), {
              context: 'Immediate tag save after remove',
              storyId: storyData.id,
              tags: newTags
            });
          }
        } catch (err) {
          logError(err, { context: 'Immediate tag save after remove', storyId: storyData.id, tags: newTags });
        } finally {
          setIsSavingTags(false);
        }
      }, 100); // Very short delay to ensure state is updated
    }
  }, [tags, storyData.id, isSaving, isSavingTags]);

  const handleTagInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    // Filter suggestions
    setTagSuggestions(
      popularTags.filter(t => t.name.includes(e.target.value.trim().toLowerCase()) && !tags.includes(t.name))
    );
  }, [popularTags, tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ",", " "].includes(e.key)) {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length) {
      removeTag(tags.length - 1);
    }
  }, [addTag, removeTag, tagInput, tags.length]);

  // Tag validation helper
  const validateTags = useCallback(() => {
    if (tags.length < 3) {
      setTagError("Add at least 3 tags.");
      return false;
    }
    if (tags.length > 10) {
      setTagError("You can add up to 10 tags.");
      return false;
    }
    setTagError("");
    return true;
  }, [tags.length]);

  // Use validateTags in the auto-save effect to ensure it's used
  useEffect(() => {
    // Validate tags whenever they change
    validateTags();
  }, [tags, validateTags]);

  // Auto-save effect with improved conditions
  useEffect(() => {
    // Only auto-save if all required fields are valid
    const valid = debouncedStoryData.title.trim() &&
                  debouncedStoryData.description.trim() &&
                  debouncedStoryData.genre;

    // Additional checks to prevent excessive auto-saving
    const shouldAutoSave = valid &&
                          hasChanges &&
                          !isSaving &&
                          !justCreatedStory &&
                          debouncedStoryData.id; // Only auto-save existing stories

    if (shouldAutoSave) {
      const autoSaveTimeout = setTimeout(async () => {
        try {
          // Use the debounced data for auto-save to avoid race conditions
          const savedStory = await saveStoryData(false, debouncedStoryData);
          if (savedStory) {
            // Upsert tags after save
            const response = await fetchWithCsrf('/api/tags/upsert', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ storyId: savedStory.id, tags }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              logError(new Error(`Auto-save failed to save tags: ${errorData.error}`), {
                context: 'Auto-save tags',
                storyId: savedStory.id,
                tags
              });
            }
          }
        } catch (error) {
          logError(error, {
            context: 'Auto-save',
            storyId: debouncedStoryData.id,
            hasChanges,
            isSaving,
            justCreatedStory,
            tags
          });
        }
      }, 500); // Reduced delay for more responsive auto-save
      return () => clearTimeout(autoSaveTimeout);
    }
  }, [debouncedStoryData, hasChanges, isSaving, justCreatedStory, tags]);

  // Load existing story data if editing
  useEffect(() => {
    const storyId = new URLSearchParams(window.location.search).get("id");

    if (storyId) {
      const fetchStory = async () => {
        try {
          const story = await StoryService.getStory(storyId);

          // Extract genre and language IDs from the response
          let genreId = "";
          let languageId = "";

          // Handle genre - it might be an object with id property or a string ID
          if (story.genre && typeof story.genre === 'object') {
            const genreObj = story.genre as { id: string, name: string };
            if (genreObj.id) {
              genreId = genreObj.id;
            }
          } else if (typeof story.genre === 'string') {
            genreId = story.genre;
          }

          // Handle language - it might be an object with id property or a string ID
          if (story.language && typeof story.language === 'object') {
            const languageObj = story.language as { id: string, name: string };
            if (languageObj.id) {
              languageId = languageObj.id;
            }
          } else if (typeof story.language === 'string') {
            languageId = story.language;
          }

          // Determine the status with type safety
          const storyStatus = story.status === "ongoing" || story.status === "completed"
            ? story.status
            : "draft" as const;

          const newStoryData: StoryFormData = {
            id: story.id,
            title: story.title,
            description: story.description || "",
            genre: genreId,
            language: languageId || "English",
            isMature: story.isMature,
            // Only use the actual coverImage if it exists and is not null/empty
            coverImage: story.coverImage && story.coverImage.trim() !== ""
              ? story.coverImage
              : "/placeholder.svg?height=1600&width=900",
            status: storyStatus,
            license: story.license || "ALL_RIGHTS_RESERVED",
            lastSaved: new Date(story.updatedAt),
            slug: story.slug,
          };

          setStoryData(newStoryData);

          // Fetch chapters for this story
          fetchChapters(story.id);
        } catch (error) {
          logError(error, { context: 'Fetching story', storyId });
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
  const fetchChapters = useCallback(async (storyId: string) => {
    if (!storyId) return;

    setIsLoadingChapters(true);

    try {
      const chaptersData = await StoryService.getChapters(storyId);

      // Convert to our local format
      const formattedChapters = chaptersData.map(chapter => {
        // Determine status based on chapter status and isPremium flag
        const status = chapter.status === 'scheduled' ? 'scheduled' as const :
                (chapter.status === 'published' ? (chapter.isPremium ? 'premium' as const : 'published' as const) : 'draft' as const);

        return {
          id: chapter.id,
          title: chapter.title,
          status,
          wordCount: chapter.wordCount,
          lastUpdated: new Date(chapter.updatedAt),
          number: chapter.number
        };
      });

      setChapters(formattedChapters);
    } catch (error) {
      logError(error, { context: 'Fetching chapters', storyId });
      toast({
        title: "Error loading chapters",
        description: "Failed to load chapter data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingChapters(false);
    }
  }, [toast]);

  // Handle input changes
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  }, [errors]);

  // Handle select changes
  const handleSelectChange = useCallback((name: string, value: string) => {
    setStoryData((prev) => ({
      ...prev,
      [name]: value,
      lastSaved: null, // Mark as unsaved
    }));

    // Mark that we have unsaved changes
    setHasChanges(true);

    // Clear error for this field if it exists
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }

    // For genre and language changes, save immediately to avoid auto-save issues
    if (name === 'genre' || name === 'language') {
      // Use setTimeout to ensure state is updated before saving
      setTimeout(() => {
        // Force a save with the current state including the new genre/language value
        const currentState = { ...storyData, [name]: value };
        saveStoryData(true, currentState); // Show toast to confirm save
      }, 100);
    }
  }, [errors, storyData]);

  // Handle switch changes
  const handleSwitchChange = useCallback(async (name: string, checked: boolean) => {
    // Special handling for status change to "completed"
    if (name === "status") {
      if (checked) { // checked means changing to "completed"
        // Check if the story has any draft chapters
        if (storyData.id) {
          try {
            const chapters = await StoryService.getChapters(storyData.id);

            // Check if there are any chapters at all
            if (chapters.length === 0) {
              toast({
                title: "Cannot mark as completed",
                description: "This story has no chapters. Please add at least one published chapter before marking the story as completed.",
                variant: "destructive",
              });
              return; // Don't update the status
            }

            // Check for draft chapters
            const draftChapters = chapters.filter(chapter => chapter.status === 'draft' || chapter.status === 'scheduled');
            if (draftChapters.length > 0) {
              toast({
                title: "Cannot mark as completed",
                description: `This story has ${draftChapters.length} draft ${draftChapters.length === 1 ? "chapter" : "chapters"}. Please publish all draft chapters before marking the story as completed.`,
                variant: "destructive",
              });
              return; // Don't update the status
            }

            // Check if there are any published chapters
            const publishedChapters = chapters.filter(chapter => chapter.status === 'published');
            if (publishedChapters.length === 0) {
              toast({
                title: "Cannot mark as completed",
                description: "This story has no published chapters. Please publish at least one chapter before marking the story as completed.",
                variant: "destructive",
              });
              return; // Don't update the status
            }
          } catch (error) {
            logError(error, { context: 'Checking draft chapters', storyId: storyData.id });
            toast({
              title: "Error",
              description: "Failed to check draft chapters. Please try again.",
              variant: "destructive",
            });
            return; // Don't update the status
          }
        }

        // If all checks pass, update the status to "completed"
        setStoryData((prev) => ({
          ...prev,
          status: "completed",
          lastSaved: null, // Mark as unsaved
        }));
      } else {
        // Changing from "completed" to "ongoing"
        setStoryData((prev) => ({
          ...prev,
          status: "ongoing",
          lastSaved: null, // Mark as unsaved
        }));
      }

      // Mark that we have unsaved changes
      setHasChanges(true);

      // Save the changes immediately to avoid auto-save conflicts
      setTimeout(() => {
        setStoryData(currentState => {
          saveStoryData(false, currentState);
          return currentState; // Don't actually change the state
        });
      }, 100);
    } else {
      // For other switches (like isMature), just update the state normally
      setStoryData((prev) => ({
        ...prev,
        [name]: checked,
        lastSaved: null, // Mark as unsaved
      }));

      // Mark that we have unsaved changes
      setHasChanges(true);
    }
  }, [storyData.id, toast]);

  // Handle cover image upload
  const handleCoverImageClick = useCallback(() => {
    fileInputRef.current?.click()
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Upload to S3 with CSRF token
      const response = await fetchWithCsrf('/api/upload-image', {
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

      if (!imageUrl) {
        throw new Error('No image URL returned from server');
      }

      // Update the story data with the S3 URL
      setStoryData((prev) => ({
        ...prev,
        coverImage: imageUrl,
        lastSaved: null, // Mark as unsaved
      }));

      // Explicitly trigger a save after image upload
      setHasChanges(true); // Mark that we have unsaved changes

      // Force a save immediately instead of waiting for auto-save
      setTimeout(() => {
        // Get the latest state to ensure we have the most up-to-date data
        setStoryData(currentState => {
          // Save with the current state to ensure we have the latest data
          saveStoryData(false, currentState);
          return currentState; // Don't actually change the state
        });
      }, 500);
    } catch (error) {
      logError(error, { context: 'Uploading cover image', storyId: storyData.id });
      toast({
        title: "Upload failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [storyData.id, toast]);

  // Remove cover image
  const handleRemoveCoverImage = useCallback(async () => {
    try {
      setIsSaving(true);

      // Create a special request that explicitly sets coverImage to null
      // This is a special value that will be interpreted by the server as a request to remove the image
      const deleteImageRequest = {
        coverImage: null
      };

      // Only proceed if we have an ID (existing story)
      if (storyData.id) {
        // Make a direct fetch call to ensure we're bypassing any client-side type checking
        const response = await fetchWithCsrf(`/api/stories/${storyData.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(deleteImageRequest),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to remove cover image");
        }

        await response.json();

        // Update the state with the result
        setStoryData(prev => ({
          ...prev,
          coverImage: "/placeholder.svg?height=1600&width=900",
          lastSaved: new Date()
        }));

        setHasChanges(false);

        toast({
          title: "Cover image removed",
          description: "The cover image has been removed successfully."
        });
      } else {
        // If it's a new story, just update the local state
        setStoryData(prev => ({
          ...prev,
          coverImage: "/placeholder.svg?height=1600&width=900",
          lastSaved: null
        }));

        setHasChanges(true);
      }
    } catch (error) {
      logError(error, { context: 'Removing cover image', storyId: storyData.id });
      toast({
        title: "Error",
        description: "Failed to remove cover image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [storyData.id, toast]);

  // Validate form
  const validateForm = useCallback(() => {
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
  }, [storyData.title, storyData.description, storyData.genre]);

  // Save story data
  const saveStoryData = useCallback(async (showToast = true, dataToSave = storyData) => {
    if (isSaving) return null;

    setIsSaving(true);

    try {
      // Determine how to handle the coverImage field
      const isPlaceholder = dataToSave.coverImage === "/placeholder.svg" ||
                          dataToSave.coverImage === "/placeholder.svg?height=1600&width=900";

      // If we have a real image, include it. If it's a placeholder and we're updating an existing story,
      // we need to handle it differently. For TypeScript compatibility, we'll use undefined instead of null.
      let coverImageValue: string | undefined;
      if (!dataToSave.coverImage) {
        coverImageValue = undefined; // Omit if empty
      } else if (isPlaceholder && dataToSave.id) {
        // For existing stories with placeholder, we'll handle this specially in the API call
        coverImageValue = undefined; // Will be handled separately for existing stories
      } else if (isPlaceholder) {
        coverImageValue = undefined; // Omit the field for new stories with placeholder
      } else {
        coverImageValue = dataToSave.coverImage; // Include real image URL
      }

      const storyRequest: CreateStoryRequest | UpdateStoryRequest = {
        title: dataToSave.title,
        description: dataToSave.description,
        coverImage: coverImageValue,
        genre: dataToSave.genre || undefined,
        language: dataToSave.language || undefined,
        isMature: dataToSave.isMature,
        status: dataToSave.status || "draft", // Include the story status
        license: dataToSave.license || "ALL_RIGHTS_RESERVED", // Include the license
      };

      let savedStory;

      if (dataToSave.id) {
        // Update existing story
        savedStory = await StoryService.updateStory(dataToSave.id, storyRequest);
      } else {
        // Check if we're already in the process of creating this story
        if (isSaving) {
          return null;
        }

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
        // Preserve the coverImage from the server response if it exists
        coverImage: savedStory.coverImage || dataToSave.coverImage,
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

        // Status (toggle)
        if (prevData.status !== dataToSave.status) {
          newData.status = prevData.status;
        }

        // License (select field)
        if (prevData.license !== dataToSave.license) {
          newData.license = prevData.license;
        }

        // Cover image
        if (prevData.coverImage !== dataToSave.coverImage) {
          newData.coverImage = prevData.coverImage;
        }

        return newData;
      });

      setHasChanges(false); // Reset changes flag

      // Upsert tags after save (if not handled by autosave)
      if (updatedStoryData.id) {
        try {
          const response = await fetchWithCsrf('/api/tags/upsert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storyId: updatedStoryData.id, tags }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            logError(new Error(`Manual save failed to save tags: ${errorData.error}`), {
              context: 'Manual save tags',
              storyId: updatedStoryData.id,
              tags
            });
          }
        } catch (err) {
          logError(err, { context: 'Saving tags', storyId: updatedStoryData.id, tags })
        }
      }

      if (showToast) {
        toast({
          title: "Draft saved",
          description: "Your story has been saved as a draft.",
        });
      }

      // Return the updated story data for immediate use
      return updatedStoryData;
    } catch (error) {
      logError(error, { context: 'Saving story', storyId: dataToSave.id });
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save your story. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, storyData, tags, toast]);

  // Format date for display
  const formatDate = useCallback((date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }, []);

  // Handle creating a new chapter
  const handleCreateChapter = useCallback(async () => {
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

      // Set the flag to prevent duplicate creation
      setJustCreatedStory(true);

      try {
        const savedStory = await saveStoryData(false)
        if (savedStory) {
          // Navigate to editor with new chapter using new URL pattern
          router.push(`/write/editor/${savedStory.id}/new-chapter`)
        }
      } finally {
        // Reset the flag after a delay
        setTimeout(() => setJustCreatedStory(false), 5000);
      }
    } else {
      // Navigate to editor with new chapter using new URL pattern
      router.push(`/write/editor/${storyData.id}/new-chapter`)
    }
  }, [router, saveStoryData, storyData.id, toast, validateForm]);

  // Handle editing an existing chapter
  const handleEditChapter = useCallback((chapterId: string) => {
    // Use the new URL pattern
    router.push(`/write/editor/${storyData.id}/${chapterId}`)
  }, [router, storyData.id]);

  // Handle chapter deletion
  const handleDeleteChapter = useCallback(async () => {
    if (!chapterToDelete || !storyData.id) return;

    setIsDeleting(true);
    try {
      await StoryService.deleteChapter(storyData.id, chapterToDelete.id);

      // Update the chapters list
      setChapters(prevChapters =>
        prevChapters.filter(chapter => chapter.id !== chapterToDelete.id)
      );

      toast({
        title: "Chapter deleted",
        description: `"${chapterToDelete.title}" has been deleted successfully.`,
      });

      // Close the dialog
      setDeleteDialogOpen(false);
      setChapterToDelete(null);
    } catch (error) {
      logError(error, { context: 'Deleting chapter', storyId: storyData.id, chapterId: chapterToDelete.id })
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete the chapter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [chapterToDelete, storyData.id, toast]);

  // Open delete confirmation dialog
  const openDeleteDialog = useCallback((chapter: {id: string, title: string}) => {
    setChapterToDelete(chapter);
    setDeleteDialogOpen(true);
  }, []);

  // Check authentication
  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect during loading state
    if (status === "unauthenticated") {
      router.push('/login?callbackUrl=/write/story-info')
    }
  }, [session, status, router])

  // Show loading state while session is being restored
  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        {/* Header with Back button and Auto-save status on the same line */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => router.push('/works')} className="pl-0 flex items-center gap-2">
              <ArrowLeft size={16} />
              Back
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Auto-save status with single loading animation */}
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

            {/* Story status badge */}
            {storyData.id && storyData.status !== "draft" && (
              <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-xs rounded-full">
                {storyData.status === "completed" ? "Completed" : "Ongoing"}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
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
                className="relative aspect-[16/9] sm:aspect-[16/9] rounded-lg overflow-hidden border cursor-pointer group"
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
                  disabled={storyData.coverImage === "/placeholder.svg?height=1600&width=900" ||
                           storyData.coverImage === "/placeholder.svg" ||
                           isUploading}
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
                <div className="flex justify-between">
                  <div className="flex items-center gap-2">
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
                        <SelectItem key={genre.id} value={genre.id}>
                          {genre.name}
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
                        <SelectItem key={language.id} value={language.id}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* License */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="license">Copyright License</Label>
                </div>
                <div className="relative">
                  <Select
                    value={storyData.license}
                    onValueChange={(value) => handleSelectChange("license", value)}
                    disabled={isSaving && !hasChanges}
                  >
                    <SelectTrigger id="license">
                      <SelectValue placeholder="Select a license" />
                    </SelectTrigger>
                    <SelectContent>
                      {licenses.map((license) => (
                        <SelectItem key={license.value} value={license.value}>
                          <div className="flex flex-col items-start w-full">
                            <span className="font-medium text-left">{license.label}</span>
                            <span className="text-xs text-muted-foreground text-left">{license.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Choose how others can use your work. This affects copyright and sharing permissions.
                </p>
              </div>

              {/* Tags Input - moved here */}
              <div className="mb-6">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tags">Tags</Label>
                  {isSavingTags && (
                    <div className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary rounded-full"></div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, idx) => (
                    <motion.span
                      key={tag}
                      className="flex items-center bg-muted px-3 py-1 rounded-full text-sm shadow-sm"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(idx)} aria-label="Remove tag" className="ml-2 text-muted-foreground hover:text-destructive focus:outline-none">
                        <X size={16} />
                      </button>
                    </motion.span>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={handleTagInput}
                    onKeyDown={handleTagKeyDown}
                    className="bg-transparent outline-none min-w-[100px] px-2 py-1"
                    placeholder={tags.length >= 10 ? "Max 10 tags" : "Add tag..."}
                    disabled={tags.length >= 10}
                    aria-label="Add tag"
                  />
                </div>
                {tagSuggestions.length > 0 && tagInput && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {tagSuggestions.slice(0, 6).map((t) => (
                      <button
                        key={t.name}
                        type="button"
                        className="px-2 py-1 rounded-full border border-muted-foreground text-xs hover:bg-muted"
                        onClick={() => addTag(t.name)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap mt-2">
                  {popularTags.slice(0, 8).map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      className="px-2 py-1 rounded-full border border-muted-foreground text-xs hover:bg-muted"
                      onClick={() => addTag(t.name)}
                      disabled={tags.includes(t.name)}
                    >
                      + {t.name}
                    </button>
                  ))}
                </div>
                {tagError && <div className="text-destructive text-xs mt-1">{tagError}</div>}
                <div className="text-xs text-muted-foreground mt-1">3–10 tags, lowercase, no duplicates</div>
              </div>

              {/* Mature Content Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mature-content">
                      Mature Content
                    </Label>
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
                    onCheckedChange={(checked) => handleSwitchChange("status", checked)}
                    disabled={isSaving} // Always disable during saving to prevent toggle flicker
                  />
                </div>
              </div>

              {/* Action Buttons - Removed */}
              <div className="pt-6 flex flex-wrap gap-4">
                {storyData.id && storyData.status !== "draft" && (
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6">
            <h2 className="text-2xl font-bold">Chapters</h2>
            <Button onClick={handleCreateChapter} className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-center p-4">
                      <div className="flex-shrink-0 mr-4 mb-3 sm:mb-0">
                        <div className="bg-muted/50 rounded-full p-3">
                          <FileText size={24} className="text-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium">{chapter.title}</h3>
                          <div className="flex gap-1">
                            <Badge variant={chapter.status === "draft" ? "outline" : "default"} className={chapter.status === "premium" ? "bg-amber-500" : ""}>
                              {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            <span>Last updated: {formatDate(chapter.lastUpdated)}</span>
                          </div>
                          <div>{chapter.wordCount} words</div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 flex-1 sm:flex-initial justify-center"
                          onClick={() => handleEditChapter(chapter.id)}
                        >
                          <Edit size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 flex-1 sm:flex-initial justify-center"
                          onClick={() => router.push(`/story/${storyData.slug}/chapter/${chapter.number}`)}
                        >
                          <Eye size={14} />
                          Preview
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-destructive hover:text-destructive flex-1 sm:flex-initial justify-center"
                          onClick={() => openDeleteDialog({id: chapter.id, title: chapter.title})}
                        >
                          <Trash2 size={14} />
                          Delete
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

      {/* Delete Chapter Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the chapter
              "{chapterToDelete?.title}" and remove it from your story.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteChapter();
              }}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

