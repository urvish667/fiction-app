"use client"

import type React from "react"
import "@/styles/editor.css"
import "@/styles/reading.css"

import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Image } from "@tiptap/extension-image"

import TextAlign from "@tiptap/extension-text-align"
import { ImageUpload } from "@/lib/image-upload"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ImageIcon,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react"
import { logError } from "@/lib/error-logger"
import DivNode from "@/components/editor-extensions/div-node"

interface EditorProps {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
}

export function Editor({ content, onChange, readOnly = false }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)

  // Track if content is being updated internally to avoid unnecessary saves
  const [isInternalUpdate, setIsInternalUpdate] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      // DivNode, // Temporarily remove the custom div node to test image insertion
      Placeholder.configure({
        placeholder: "Begin your story here...",
      }),
      Image.configure({
        allowBase64: true,
        inline: false, // Block mode for better alignment
        HTMLAttributes: {
          class: 'editor-image',
          draggable: 'false', // Prevent dragging to ensure alignment works
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'], // Remove div from types for now
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Only trigger onChange if it's not an internal update
      if (!isInternalUpdate) {
        onChange(editor.getHTML())
      }
    },
  })

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor) {
      // Normalize both strings for comparison
      const normalizedEditorContent = editor.getHTML().replace(/\s+/g, ' ').trim()
      const normalizedContent = content.replace(/\s+/g, ' ').trim()

      // Only update if content is actually different
      if (normalizedContent !== normalizedEditorContent) {
        setIsInternalUpdate(true)
        editor.commands.setContent(content)
        // Reset the flag after the update
        setTimeout(() => setIsInternalUpdate(false), 0)
      }
    }
  }, [editor, content])

  // Update editor editable state when readOnly prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly)
    }
  }, [editor, readOnly])

  if (!editor) {
    return null
  }

  // Handle image upload from local file
  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Process the image (resize, compress)
      // Use smaller dimensions for editor images (800x600)
      const processedFile = await ImageUpload.processImage(file, 800, 600)

      // Upload the image to Azure Blob Storage with CSRF token
      const imageUrl = await ImageUpload.uploadEditorImage(processedFile)

      if (editor) {
        // Simple and reliable image insertion
        editor.chain().focus().setImage({
          src: imageUrl
        }).run();

        toast({
          title: "Image uploaded",
          description: "Image has been added to your chapter.",
        })
      }
    } catch (error) {
      logError(error, { context: 'Uploading image' });
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset the input so the same file can be selected again
      e.target.value = ""
    }
  }



  return (
    <div className={`border rounded-md ${readOnly ? "bg-muted/20" : ""}`}>
      {!readOnly && (
        <div className="border-b p-2 flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-muted" : ""}
          >
            <Bold size={16} />
            <span className="sr-only">Bold</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-muted" : ""}
          >
            <Italic size={16} />
            <span className="sr-only">Italic</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "bg-muted" : ""}
          >
            <Heading1 size={16} />
            <span className="sr-only">Heading 1</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
          >
            <Heading2 size={16} />
            <span className="sr-only">Heading 2</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-muted" : ""}
          >
            <List size={16} />
            <span className="sr-only">Bullet List</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-muted" : ""}
          >
            <ListOrdered size={16} />
            <span className="sr-only">Ordered List</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "bg-muted" : ""}
          >
            <Quote size={16} />
            <span className="sr-only">Blockquote</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={handleImageUpload} disabled={isUploading}>
            <ImageIcon size={16} />
            <span className="sr-only">Image</span>
            {isUploading && <span className="ml-2 text-xs">Uploading...</span>}
          </Button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isUploading} />

          <div className="border-l mx-1 h-6"></div>

          {/* Text alignment buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? "bg-muted" : ""}
            title="Align Left"
          >
            <AlignLeft size={16} />
            <span className="sr-only">Align Left</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? "bg-muted" : ""}
            title="Align Center"
          >
            <AlignCenter size={16} />
            <span className="sr-only">Align Center</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? "bg-muted" : ""}
            title="Align Right"
          >
            <AlignRight size={16} />
            <span className="sr-only">Align Right</span>
          </Button>

          <div className="border-l mx-1 h-6"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo size={16} />
            <span className="sr-only">Undo</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo size={16} />
            <span className="sr-only">Redo</span>
          </Button>
        </div>
      )}

      <div className={`p-4 min-h-[570px] ${readOnly ? 'prose prose-lg' : 'prose prose-sm'} max-w-none editor-content ${readOnly ? 'reading-preview content-protected' : ''}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

