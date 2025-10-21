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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArrowLeft, Upload, Trash2, AlertCircle, Eye, BookOpen, Plus, FileText, Clock, CheckCircle2, Edit, X, Save, RefreshCw, Info, AlertTriangle, Check } from "lucide-react"
import Navbar from "@/components/navbar"
import { SiteFooter } from "@/components/site-footer"
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
  isOriginal: boolean;
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
  publishDate?: Date;
}

interface TagData {
  name: string;
}

// --- Save Status Type ---
type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'success' | 'error';

export default function StoryInfoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true);

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
    isOriginal: false,
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
  const [justCreatedStory, setJustCreatedStory] = useState(false);
  const [chapters, setChapters] = useState<ChapterData[]>([]);

  // --- Refactored: Unified State Management ---
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // --- Move validateForm above saveAllStoryData ---
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

  // --- Unified Save Function and State Handlers (move above all useEffect and usages) ---
  const saveAllStoryData = useCallback(async (dataToSave: StoryFormData, tagsToSave: string[], showToastMessages: boolean = false) => {
    if (saveStatus === 'saving') return;
    setSaveStatus('saving');
    if (showToastMessages) {
      toast({ title: "Saving...", description: "Please wait." });
    }
    try {
      if (!validateForm()) {
        setSaveStatus('error');
        if (showToastMessages) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required story details.",
            variant: "destructive",
          });
        }
        return;
      }
      const isPlaceholder = dataToSave.coverImage?.startsWith('/placeholder');
      const coverImageValue = isPlaceholder ? undefined : dataToSave.coverImage;
      const storyRequest: CreateStoryRequest | UpdateStoryRequest = {
        title: dataToSave.title,
        description: dataToSave.description,
        coverImage: coverImageValue,
        genre: dataToSave.genre || undefined,
        language: dataToSave.language || undefined,
        isMature: dataToSave.isMature,
        isOriginal: dataToSave.isOriginal,
        status: dataToSave.status || "draft",
        license: dataToSave.license || "ALL_RIGHTS_RESERVED",
      };
      let savedStory;
      if (dataToSave.id) {
        savedStory = await StoryService.updateStory(dataToSave.id, storyRequest);
      } else {
        savedStory = await StoryService.createStory(storyRequest as CreateStoryRequest);
      }
      const storyId = savedStory.id;
      await fetchWithCsrf('/api/tags/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId, tags: tagsToSave }),
      });
      setStoryData(prev => ({
        ...prev,
        id: storyId,
        slug: savedStory.slug,
        lastSaved: new Date(),
        description: savedStory.description || prev.description,
        coverImage: savedStory.coverImage || prev.coverImage,
      }));
      setLastSaved(new Date());
      setSaveStatus('success');
      if (showToastMessages) {
        toast({
          title: "Changes saved!",
          description: "Your story has been successfully updated.",
        });
      }
      setTimeout(() => setSaveStatus('idle'), 2000);
      return savedStory;
    } catch (error) {
      logError(error, { context: 'saveAllStoryData', storyId: dataToSave.id });
      setSaveStatus('error');
      if (showToastMessages) {
        toast({
          title: "Save Failed",
          description: error instanceof Error ? error.message : "Failed to save your changes. Please try again.",
          variant: "destructive",
        });
      }
      return null;
    }
  }, [saveStatus, toast, validateForm]);

  const handleStateChange = useCallback((update: Partial<StoryFormData>) => {
    if (update.status === 'completed' && chapters.length === 0) {
      toast({
        title: "Cannot mark as completed",
        description: "A story must have at least one chapter to be marked as completed.",
        variant: "destructive",
      });
      return;
    }
    setStoryData(prev => ({ ...prev, ...update }));
    // Mark as having unsaved changes
    if (!isInitialLoad.current) {
      setSaveStatus('unsaved');
    }
  }, [chapters.length, toast]);
  const handleTagChange = useCallback((newTags: string[]) => {
    setTags(newTags);
    // Mark as having unsaved changes
    if (!isInitialLoad.current) {
      setSaveStatus('unsaved');
    }
  }, []);

  // Fetch genres/languages/tags on mount
  useEffect(() => {
    fetch("/api/genres").then(r => r.json()).then(setGenres);
    fetch("/api/languages").then(r => r.json()).then(setLanguages);
    fetch("/api/tags").then(r => r.json()).then(data => {
      setPopularTags(data);
      setTagSuggestions(data);
    });
  }, []);

  // REMOVED: Duplicate tag fetching
  // Tags are now loaded directly from the story object in the fetchStory effect below
  // This prevents race conditions and duplicate API calls

  // Tag input normalization & validation
  const addTag = useCallback((raw: string) => {
    const tag = raw.trim().toLowerCase();
    if (!tag || tags.includes(tag)) return;
    if (tags.length >= 10) {
      setTagError("You can add up to 10 tags.");
      return;
    }
    handleTagChange([...tags, tag]);
    setTagInput("");
    setTagError("");
  }, [tags, handleTagChange]);

  const removeTag = useCallback((idx: number) => {
    const newTags = tags.filter((_, i) => i !== idx);
    handleTagChange(newTags);
    setTagError("");
  }, [tags, handleTagChange]);

  const handleTagInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    // Filter suggestions
    setTagSuggestions(
      popularTags.filter(t => t.name.includes(e.target.value.trim().toLowerCase()) && !tags.includes(t.name))
    );
  }, [popularTags, tags]);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["Enter", ","].includes(e.key)) {
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
      setTagError("Please add tags for SEO optimization.");
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

  // --- REMOVED: Auto-save Effect ---
  // Auto-save has been removed to reduce unnecessary database pings.
  // Users now manually save using the "Save Changes" button or Ctrl/Cmd+S.

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
            isOriginal: story.isOriginal || false,
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

          // Extract and set tags from the story data
          if (Array.isArray(story.tags)) {
            const tagNames = story.tags.map((tag: any) => {
              // Handle both string format (legacy) and object format (current)
              if (typeof tag === 'string') {
                return tag;
              } else if (tag && typeof tag === 'object' && tag.name) {
                return tag.name;
              }
              return '';
            }).filter(Boolean);
            setTags(tagNames);
          }
          
          // Mark initial load as complete AFTER loading all data
          // This prevents the tag loading from triggering "unsaved changes"
          setTimeout(() => {
            isInitialLoad.current = false;
          }, 100);

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
          number: chapter.number,
          publishDate: chapter.publishDate ? new Date(chapter.publishDate) : undefined
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

      // Force a save immediately instead of waiting for auto-save
      setTimeout(() => {
        // Get the latest state to ensure we have the most up-to-date data
        setStoryData(currentState => {
          // Save with the current state to ensure we have the latest data
          saveAllStoryData(currentState, tags, true);
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
  }, [storyData.id, toast, tags, saveAllStoryData]);

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
        const savedStory = await saveAllStoryData(storyData, tags, true)
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
  }, [router, saveAllStoryData, storyData.id, toast, validateForm]);

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
    if (sessionStatus === "unauthenticated") {
      router.push('/login?callbackUrl=/write/story-info')
    }
  }, [session, sessionStatus, router])

  // Mark initial load complete after first render (for new stories)
  useEffect(() => {
    // Only set to false immediately if this is a new story (no ID in URL)
    const storyId = new URLSearchParams(window.location.search).get("id");
    if (!storyId) {
      isInitialLoad.current = false;
    }
    // For existing stories, this is set in the fetchStory effect after data loads
  }, []);

  // Add keyboard shortcut for saving (Ctrl/Cmd + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveStatus !== 'saving') {
          saveAllStoryData(storyData, tags, true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAllStoryData, storyData, tags, saveStatus]);

  // Warn user about unsaved changes when leaving the page
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === 'unsaved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveStatus]);

  // Show loading state while session is being restored
  if (sessionStatus === "loading") {
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

  const isFormDisabled = saveStatus === 'saving' || sessionStatus !== 'authenticated';
  
  const isActuallySaving = saveStatus === 'saving';
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
        {/* Header with Back button and Auto-save status on the same line */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (saveStatus === 'unsaved') {
                  if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                    router.push('/works')
                  }
                } else {
                  router.push('/works')
                }
              }} 
              className="pl-0 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              Back
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            {/* Unsaved changes indicator - matching editor style */}
            {saveStatus === 'unsaved' && (
              <span className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-500 flex items-center gap-1 font-medium">
                <AlertTriangle size={14} />
                <span className="hidden sm:inline">Unsaved changes</span>
              </span>
            )}

            {/* Save status messages - matching editor style */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              {isActuallySaving && (
                <span className="text-muted-foreground animate-pulse flex items-center gap-1">
                  <Clock size={14} className="animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                </span>
              )}
              {saveStatus === 'success' && (
                <span className="text-green-600 dark:text-green-500 flex items-center gap-1">
                  <Check size={14} />
                  <span className="hidden sm:inline">Saved</span>
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-destructive flex items-center gap-1">
                  <AlertCircle size={14} />
                  <span className="hidden sm:inline">Save failed</span>
                </span>
              )}
              {saveStatus === 'idle' && lastSaved && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock size={14} />
                  <span className="hidden sm:inline">Saved {lastSaved.toLocaleTimeString()}</span>
                </span>
              )}
            </div>

            {/* Story status badge */}
            {storyData.id && storyData.status !== "draft" && (
              <span className={`text-xs sm:text-sm flex items-center gap-1 ${storyData.status === "completed" ? "text-green-500" : "text-blue-500"}`}>
                <BookOpen size={14} />
                <span className="hidden sm:inline">{storyData.status === "completed" ? "Completed" : "Ongoing"}</span>
              </span>
            )}

            {/* Manual Save Button - with text for prominence */}
            <Button 
              onClick={() => saveAllStoryData(storyData, tags, true)}
              disabled={isFormDisabled || isActuallySaving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save size={16} />
              <span>Save</span>
            </Button>
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

              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg text-sm text-green-800 dark:text-green-200">
                Need help creating a thumbnail?{' '}
                <a
                  href="https://fablespace.space/blog/creating-amazing-story-thumbnails-using-perchance-ai-a-complete-beginners-guide"
                  className="underline hover:text-green-600 dark:hover:text-green-400 font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  click here
                </a>
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
                  onChange={(e) => handleStateChange({ title: e.target.value })}
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
                  onChange={(e) => handleStateChange({ description: e.target.value })}
                  placeholder="Write a compelling description for your story"
                  className="min-h-[150px]"
                  maxLength={1000}
                  // Disable the textarea during saving to prevent race conditions
                  disabled={isFormDisabled}
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
                    onValueChange={(value) => handleStateChange({ genre: value })}
                    disabled={isFormDisabled}
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
                    onValueChange={(value) => handleStateChange({ language: value })}
                    disabled={isFormDisabled}
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
                    onValueChange={(value) => handleStateChange({ license: value })}
                    disabled={isFormDisabled}
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
                     {t.name}
                    </button>
                  ))}
                </div>
                {tagError && <div className="text-destructive text-xs mt-1">{tagError}</div>}
                <div className="text-xs text-muted-foreground mt-1">3–10 tags, lowercase, no duplicates</div>
              </div>

              {/* Original Story Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="original-story">Original Story</Label>
                    
                    {/* Info Tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent"
                          >
                            <Info size={16} className="text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          <p className="font-medium mb-1">Original vs Fanfiction</p>
                          <p>Enable this if your story is original work. Disable for fanfiction. For better story management.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    This is an original story (not fanfiction)
                  </p>
                </div>

                <div className="relative">
                  <Switch
                    id="original-story"
                    checked={storyData.isOriginal}
                    onCheckedChange={(checked) =>
                      handleStateChange({ isOriginal: checked })
                    }
                    disabled={isFormDisabled}
                  />
                </div>
              </div>

              {/* Mature Content Toggle */}
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="mature-content">Mature Content</Label>
                    
                    {/* Info Tooltip */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent"
                          >
                            <Info size={16} className="text-muted-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-sm">
                          <p className="font-medium mb-1">Mature Content Policy</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>✅ Allowed: adult themes, romance, violence, explicit scenes within story context.</li>
                            <li>❌ Not allowed: sexual violence, incest, minors in sexual content, bestiality, pure pornographic works.</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Contains adult themes, violence, or explicit content
                  </p>
                </div>

                <div className="relative">
                  <Switch
                    id="mature-content"
                    checked={storyData.isMature}
                    onCheckedChange={(checked) =>
                      handleStateChange({ isMature: checked })
                    }
                    disabled={isFormDisabled}
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
                    onCheckedChange={(checked) => handleStateChange({ status: checked ? "completed" : "ongoing" })}
                    disabled={isFormDisabled} // Always disable during saving to prevent toggle flicker
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
                            <Badge 
                              variant={chapter.status === "draft" ? "outline" : "default"} 
                              className={
                                chapter.status === "premium" ? "bg-amber-500" : 
                                chapter.status === "scheduled" ? "bg-orange-500 hover:bg-orange-600" : ""
                              }
                            >
                              {chapter.status.charAt(0).toUpperCase() + chapter.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Clock size={14} />
                            {chapter.status === "scheduled" && chapter.publishDate ? (
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                Scheduled for: {new Intl.DateTimeFormat("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "numeric",
                                  minute: "2-digit",
                                  hour12: true
                                }).format(chapter.publishDate)}
                              </span>
                            ) : (
                              <span>Last updated: {formatDate(chapter.lastUpdated)}</span>
                            )}
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
                          onClick={() => {
                            if (storyData.status === 'completed') {
                              toast({
                                title: "Deletion disabled",
                                description: "Disable the 'Story Completed' switch to delete chapters.",
                                variant: "destructive",
                              });
                            } else {
                              openDeleteDialog({id: chapter.id, title: chapter.title});
                            }
                          }}
                          disabled={storyData.status === 'completed'}
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
