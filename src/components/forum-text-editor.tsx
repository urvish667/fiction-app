"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import Document from "@tiptap/extension-document"
import Paragraph from "@tiptap/extension-paragraph"
import Text from "@tiptap/extension-text"
import BoldExt from "@tiptap/extension-bold"
import ItalicExt from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import BulletList from "@tiptap/extension-bullet-list"
import ListItem from "@tiptap/extension-list-item"
import Heading from "@tiptap/extension-heading"
import Blockquote from "@tiptap/extension-blockquote"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Quote,
  Heading2,
} from "lucide-react"
import DOMPurify from "isomorphic-dompurify"

interface ForumTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export default function ForumTextEditor({ content, onChange, placeholder = "Share your thoughts..." }: ForumTextEditorProps) {
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      BoldExt,
      ItalicExt,
      Underline,
      BulletList,
      ListItem,
      Heading.configure({ levels: [1, 2] }),
      Blockquote,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()

      // Enforce 3000 character limit
      if (text.length > 3000) {
        // If over limit, truncate the content
        const truncatedHTML = html.substring(0, Math.min(html.length, html.lastIndexOf('</p>') + 4))
        editor.commands.setContent(truncatedHTML)
        return
      }

      // Sanitize the HTML for security
      const sanitizedHTML = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'blockquote'],
        ALLOWED_ATTR: []
      })

      onChange(sanitizedHTML)
    },
  })

  if (!editor) {
    return null
  }

  const characterCount = editor.getText().length
  const isNearLimit = characterCount > 2700
  const isOverLimit = characterCount > 3000

  return (
    <div className="border rounded-lg dark:border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-muted" : ""}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-muted" : ""}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-muted" : ""}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-muted" : ""}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-muted" : ""}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-muted" : ""}
        >
          <Quote className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <div className="p-3 min-h-[100px]">
        <EditorContent
          editor={editor}
          placeholder={placeholder}
          className="prose prose-sm dark:prose-invert max-w-none [&>div>p]:m-0"
        />
      </div>

      {/* Character Count */}
      <div className={`px-3 py-2 text-xs border-t dark:border-gray-700 text-right ${isOverLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600 dark:text-yellow-500' : 'text-muted-foreground'}`}>
        {characterCount}/3000 characters
      </div>
    </div>
  )
}
