"use client"

import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

/**
 * Custom extension to enhance image alignment
 */
export const ImageAlignment = Extension.create({
  name: 'imageAlignment',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imageAlignment'),
        props: {
          decorations(state) {
            const { doc } = state
            const decorations: Decoration[] = []

            doc.descendants((node, pos) => {
              if (node.type.name === 'image') {
                // Find the parent node to check for alignment
                const $pos = state.doc.resolve(pos)
                const parent = $pos.parent

                // Check if the parent has alignment
                let alignment = 'left' // default

                if (parent.attrs.textAlign === 'center') {
                  alignment = 'center'
                } else if (parent.attrs.textAlign === 'right') {
                  alignment = 'right'
                }

                // Add a decoration to enhance the image alignment
                const from = pos
                const to = pos + node.nodeSize

                // Apply stronger styling for better alignment visibility
                let style = 'display: block;'

                if (alignment === 'left') {
                  style += ' float: left; margin-right: 1rem; clear: both;'
                } else if (alignment === 'center') {
                  style += ' margin-left: auto; margin-right: auto; float: none; clear: both;'
                } else if (alignment === 'right') {
                  style += ' float: right; margin-left: 1rem; clear: both;'
                }

                decorations.push(
                  Decoration.node(from, to, {
                    style,
                    class: `image-alignment image-alignment-${alignment}`
                  })
                )
              }
            })

            return DecorationSet.create(state.doc, decorations)
          }
        }
      })
    ]
  },

  // Add commands to directly align images
  addCommands() {
    return {
      alignImage: (alignment) => ({ editor, commands }) => {
        // First select the image if it's not already selected
        const { state } = editor
        const { selection } = state

        // Apply the alignment to the current selection
        return commands.setTextAlign(alignment)
      },
    }
  },
})

export default ImageAlignment
