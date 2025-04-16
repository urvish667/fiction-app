"use client"

import type React from "react"
import "@/styles/editor.css"

import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Image } from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
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

interface EditorProps {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
}

export function Editor({ content, onChange, readOnly = false }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track if content is being updated internally to avoid unnecessary saves
  const [isInternalUpdate, setIsInternalUpdate] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Begin your story here...",
      }),
      Image.configure({
        allowBase64: true,
        inline: false, // Block mode for better alignment
        HTMLAttributes: {
          class: 'editor-image editor-image-centered',
        },
        // Handle image resizing and default alignment
        handleDOMAttributes: (node) => {
          const attrs = {}

          // Only add width attribute if it's specified in the node
          if (node.attrs.width) {
            attrs['width'] = node.attrs.width
          }

          // Add default center alignment class
          attrs['class'] = 'editor-image editor-image-centered'

          return attrs
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
        // Set default alignment for specific node types
        defaultAlignments: {
          image: 'center',
        },
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }

    // Read the file as a data URL
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result && editor) {
        // Create a temporary HTML image to get the original dimensions
        const tempImg = new window.Image()
        tempImg.src = event.target.result as string

        tempImg.onload = () => {
          // Calculate dimensions while maintaining aspect ratio and limiting size
          const maxWidth = 600 // Maximum width in pixels
          let width = tempImg.width

          // Only set width if the image is larger than maxWidth
          const widthAttr = width > maxWidth ? { width: maxWidth } : {}

          // Insert the image at the current cursor position
          editor
            .chain()
            .focus()
            .insertContent({
              type: 'image',
              attrs: {
                src: event.target.result as string,
                ...widthAttr
              }
            })
            .run()

          // Always set center alignment for images
          editor
            .chain()
            .focus()
            .setTextAlign('center')
            .run()
        }
      }
    }
    reader.readAsDataURL(file)

    // Reset the input so the same file can be selected again
    e.target.value = ""
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

          <Button variant="ghost" size="icon" onClick={handleImageUpload}>
            <ImageIcon size={16} />
            <span className="sr-only">Image</span>
          </Button>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

          <Button variant="ghost" size="icon" onClick={setLink}>
            <LinkIcon size={16} />
            <span className="sr-only">Link</span>
          </Button>

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

      <div className="p-4 min-h-[570px] prose prose-sm max-w-none editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

