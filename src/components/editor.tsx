"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
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
        inline: true,
      }),
      Link.configure({
        openOnClick: false,
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
        // Insert the image at the current cursor position
        editor
          .chain()
          .focus()
          .setImage({ src: event.target.result as string })
          .run()
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

      <div className="p-4 min-h-[500px] prose prose-sm max-w-none editor-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

