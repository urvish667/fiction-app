import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Editor } from '@/components/editor'

// Mock the tiptap editor
jest.mock('@tiptap/react', () => {
  const originalModule = jest.requireActual('@tiptap/react')
  
  return {
    ...originalModule,
    useEditor: () => ({
      chain: () => ({
        focus: () => ({
          toggleBold: () => ({ run: jest.fn() }),
          toggleItalic: () => ({ run: jest.fn() }),
          toggleHeading: () => ({ run: jest.fn() }),
          toggleBulletList: () => ({ run: jest.fn() }),
          toggleOrderedList: () => ({ run: jest.fn() }),
          toggleBlockquote: () => ({ run: jest.fn() }),
          toggleCodeBlock: () => ({ run: jest.fn() }),
          setImage: () => ({ run: jest.fn() }),
          extendMarkRange: () => ({
            setLink: () => ({ run: jest.fn() }),
            unsetLink: () => ({ run: jest.fn() })
          }),
          undo: () => ({ run: jest.fn() }),
          redo: () => ({ run: jest.fn() })
        })
      }),
      isActive: () => false,
      can: () => ({ undo: () => true, redo: () => true }),
      getHTML: () => '<p>Test content</p>',
      commands: {
        setContent: jest.fn()
      },
      setEditable: jest.fn()
    }),
    EditorContent: ({ editor }) => (
      <div data-testid="editor-content">
        <div dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
      </div>
    )
  }
})

describe('Editor Component', () => {
  const mockOnChange = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders the editor with toolbar in edit mode', () => {
    render(<Editor content="<p>Test content</p>" onChange={mockOnChange} />)
    
    // Check that toolbar buttons are rendered
    expect(screen.getByLabelText('Bold')).toBeInTheDocument()
    expect(screen.getByLabelText('Italic')).toBeInTheDocument()
    expect(screen.getByLabelText('Heading 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Heading 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Bullet List')).toBeInTheDocument()
    expect(screen.getByLabelText('Ordered List')).toBeInTheDocument()
    expect(screen.getByLabelText('Blockquote')).toBeInTheDocument()
    expect(screen.getByLabelText('Code Block')).toBeInTheDocument()
    expect(screen.getByLabelText('Image')).toBeInTheDocument()
    expect(screen.getByLabelText('Link')).toBeInTheDocument()
    expect(screen.getByLabelText('Undo')).toBeInTheDocument()
    expect(screen.getByLabelText('Redo')).toBeInTheDocument()
    
    // Check that editor content is rendered
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })
  
  it('hides toolbar in read-only mode', () => {
    render(<Editor content="<p>Test content</p>" onChange={mockOnChange} readOnly={true} />)
    
    // Toolbar should not be visible
    expect(screen.queryByLabelText('Bold')).not.toBeInTheDocument()
    
    // Editor content should still be visible
    expect(screen.getByTestId('editor-content')).toBeInTheDocument()
  })
  
  it('handles toolbar button clicks', () => {
    render(<Editor content="<p>Test content</p>" onChange={mockOnChange} />)
    
    // Click the Bold button
    fireEvent.click(screen.getByLabelText('Bold'))
    
    // Click the Italic button
    fireEvent.click(screen.getByLabelText('Italic'))
    
    // These don't actually trigger changes in the mocked implementation,
    // but we can verify the buttons are clickable
  })
})
