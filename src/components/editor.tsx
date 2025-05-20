"use client"

import type React from "react"
import "@/styles/editor.css"
import "@/styles/reading.css"

import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Image } from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import { ImageUpload } from "@/lib/image-upload"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  ImageIcon,
  LinkIcon,
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
      DivNode, // Add the custom div node
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
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image', 'div'], // Add div to the types that can be aligned
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'center',
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
        // Create a temporary HTML image to get the original dimensions
        const tempImg = new window.Image()
        tempImg.src = imageUrl

        tempImg.onload = () => {
          // Define target size for smaller images
          const targetWidth = 200 // Target width for resizing

          // Get original dimensions
          let width = tempImg.width
          let height = tempImg.height

          // Calculate aspect ratio
          const aspectRatio = width / height

          // Only resize if the image is larger than targetWidth
          let widthAttr = {}
          if (width > targetWidth) {
            // Calculate new height based on aspect ratio
            const newHeight = Math.round(targetWidth / aspectRatio)
            widthAttr = { width: targetWidth }
            console.log('Resizing image in editor', {
              originalWidth: width,
              originalHeight: height,
              newWidth: targetWidth,
              newHeight: newHeight
            });
          } else {
            console.log('Not resizing image in editor (already small enough)', {
              width,
              height,
              targetWidth
            });
          }

          // Get the current text alignment
          const currentAlignment = editor.isActive({ textAlign: 'center' })
            ? 'center'
            : editor.isActive({ textAlign: 'right' })
              ? 'right'
              : 'left';

          console.log('Inserting image with alignment:', currentAlignment);

          // Insert a div node with proper alignment
          editor.chain().focus().insertContent({
            type: 'div',
            attrs: {
              class: `text-align-${currentAlignment}`,
              'data-text-align': currentAlignment
            },
            content: [{
              type: 'image',
              attrs: {
                src: imageUrl,
                ...widthAttr,
                class: `editor-image`,
                'data-align': currentAlignment
              }
            }]
          }).run();

          // Add a paragraph after the div
          editor.chain().focus().insertContent({
            type: 'paragraph'
          }).run();
        }
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

  // Handle link
  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Enter link URL", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
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

          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive("codeBlock") ? "bg-muted" : ""}
          >
            <Code size={16} />
            <span className="sr-only">Code Block</span>
          </Button>

          <Button variant="ghost" size="icon" onClick={handleImageUpload} disabled={isUploading}>
            <ImageIcon size={16} />
            <span className="sr-only">Image</span>
            {isUploading && <span className="ml-2 text-xs">Uploading...</span>}
          </Button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" disabled={isUploading} />

          <Button variant="ghost" size="icon" onClick={setLink}>
            <LinkIcon size={16} />
            <span className="sr-only">Link</span>
          </Button>

          <div className="border-l mx-1 h-6"></div>

          {/* Text alignment buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Apply left alignment and log for debugging
              console.log('Setting alignment to left');

              // Check if an image is selected
              if (editor.isActive('image')) {
                // Find the parent node of the image
                const parentNode = editor.state.selection.$anchor.parent;

                // If the parent is a paragraph or div, set its alignment
                if (parentNode && (parentNode.type.name === 'paragraph' || parentNode.type.name === 'div')) {
                  editor.chain().focus().setTextAlign('left').run();
                } else {
                  // Create a div with left alignment and wrap the image
                  editor.chain().focus()
                    .setNodeSelection(editor.state.selection.$anchor.pos)
                    .wrapIn('div', { 'data-text-align': 'left' })
                    .setTextAlign('left')
                    .run();
                }

                // Also update the image attributes for backward compatibility
                editor.chain().focus().updateAttributes('image', {
                  'data-align': 'left'
                }).run();
              } else {
                // Set text alignment for the current node
                editor.chain().focus().setTextAlign('left').run();
              }
            }}
            className={editor.isActive({ textAlign: 'left' }) ? "bg-muted" : ""}
            title="Align Left"
          >
            <AlignLeft size={16} />
            <span className="sr-only">Align Left</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Apply center alignment and log for debugging
              console.log('Setting alignment to center');

              // Check if an image is selected
              if (editor.isActive('image')) {
                // Find the parent node of the image
                const parentNode = editor.state.selection.$anchor.parent;

                // If the parent is a paragraph or div, set its alignment
                if (parentNode && (parentNode.type.name === 'paragraph' || parentNode.type.name === 'div')) {
                  editor.chain().focus().setTextAlign('center').run();
                } else {
                  // Create a div with center alignment and wrap the image
                  editor.chain().focus()
                    .setNodeSelection(editor.state.selection.$anchor.pos)
                    .wrapIn('div', { 'data-text-align': 'center' })
                    .setTextAlign('center')
                    .run();
                }

                // Also update the image attributes for backward compatibility
                editor.chain().focus().updateAttributes('image', {
                  'data-align': 'center'
                }).run();
              } else {
                // Set text alignment for the current node
                editor.chain().focus().setTextAlign('center').run();
              }
            }}
            className={editor.isActive({ textAlign: 'center' }) ? "bg-muted" : ""}
            title="Align Center"
          >
            <AlignCenter size={16} />
            <span className="sr-only">Align Center</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Apply right alignment and log for debugging
              console.log('Setting alignment to right');

              // Check if an image is selected
              if (editor.isActive('image')) {
                // Find the parent node of the image
                const parentNode = editor.state.selection.$anchor.parent;

                // If the parent is a paragraph or div, set its alignment
                if (parentNode && (parentNode.type.name === 'paragraph' || parentNode.type.name === 'div')) {
                  editor.chain().focus().setTextAlign('right').run();
                } else {
                  // Create a div with right alignment and wrap the image
                  editor.chain().focus()
                    .setNodeSelection(editor.state.selection.$anchor.pos)
                    .wrapIn('div', { 'data-text-align': 'right' })
                    .setTextAlign('right')
                    .run();
                }

                // Also update the image attributes for backward compatibility
                editor.chain().focus().updateAttributes('image', {
                  'data-align': 'right'
                }).run();
              } else {
                // Set text alignment for the current node
                editor.chain().focus().setTextAlign('right').run();
              }
            }}
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

