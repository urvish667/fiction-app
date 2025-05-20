"use client"

import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Custom div node extension for TipTap
 * This allows using div elements in the editor for alignment and other purposes
 */
export const DivNode = Node.create({
  name: 'div',
  group: 'block',
  content: 'block+',
  
  // Define the attributes that can be set on the div
  addAttributes() {
    return {
      class: {
        default: null,
      },
      'data-text-align': {
        default: null,
      },
      style: {
        default: null,
      },
    }
  },

  // Define how the div is parsed from HTML
  parseHTML() {
    return [
      { tag: 'div' },
    ]
  },

  // Define how the div is rendered to HTML
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0]
  },
})

export default DivNode
