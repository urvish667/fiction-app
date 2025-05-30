import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ChapterEditorPage from '@/app/write/editor/[storyId]/[chapterId]/page'
import { StoryService } from '@/services/story-service'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'

// Mock the dependencies
jest.mock('next-auth/react', () => ({
  useSession: jest.fn()
}))

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn()
}))

jest.mock('@/services/story-service', () => ({
  StoryService: {
    getChapter: jest.fn(),
    updateChapter: jest.fn(),
    createChapter: jest.fn(),
    getChapters: jest.fn(),
    getStory: jest.fn(),
    updateStory: jest.fn()
  }
}))

jest.mock('@/components/editor', () => ({
  Editor: ({ content, onChange, readOnly }) => (
    <div data-testid="mock-editor">
      <textarea
        data-testid="mock-editor-textarea"
        value={content}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  )
}))

jest.mock('@/components/editor/editor-header', () => ({
  EditorHeader: ({ chapter, storyId, hasChanges, isSaving, showPreview, setShowPreview, setIsPublishDialogOpen, handleTitleChange, saveChapter }) => (
    <header data-testid="mock-editor-header">
      <button data-testid="back-button">Back to Story</button>
      <input
        data-testid="title-input"
        value={chapter.title}
        onChange={handleTitleChange}
      />
      <button data-testid="save-button" onClick={() => saveChapter(true, true)}>Save Draft</button>
      <button data-testid="preview-button" onClick={() => setShowPreview(!showPreview)}>
        {showPreview ? "Edit" : "Preview"}
      </button>
      <button data-testid="publish-button" onClick={() => setIsPublishDialogOpen(true)}>Publish</button>
    </header>
  )
}))

jest.mock('@/components/editor/publish-dialog', () => ({
  PublishDialog: ({ isOpen, setIsOpen, publishSettings, extendedSettings, handlePublishSettingsChange, handlePublish }) => (
    isOpen ? (
      <div data-testid="mock-publish-dialog">
        <button data-testid="publish-confirm-button" onClick={handlePublish}>
          {publishSettings.schedulePublish ? "Schedule" : "Publish Now"}
        </button>
        <button data-testid="publish-cancel-button" onClick={() => setIsOpen(false)}>Cancel</button>
      </div>
    ) : null
  )
}))

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

// Mock window.confirm
global.confirm = jest.fn(() => true)

describe('ChapterEditorPage', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn()
  }

  const mockSession = {
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User'
      }
    }
  }

  const mockParams = {
    storyId: 'test-story-id',
    chapterId: 'test-chapter-id'
  }

  const mockChapter = {
    id: 'test-chapter-id',
    title: 'Test Chapter',
    content: '<p>Test content</p>',
    number: 1,
    wordCount: 2,
    isDraft: true,
    isPremium: false,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    storyId: 'test-story-id',
    contentKey: 'test-content-key'
  }

  const mockStory = {
    id: 'test-story-id',
    title: 'Test Story',
    authorId: 'test-user-id'
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mocks
    useSession.mockReturnValue(mockSession)
    useParams.mockReturnValue(mockParams)
    useRouter.mockReturnValue(mockRouter)

    StoryService.getChapter.mockResolvedValue(mockChapter)
    StoryService.getStory.mockResolvedValue(mockStory)
    StoryService.updateChapter.mockResolvedValue(mockChapter)
    StoryService.getChapters.mockResolvedValue([mockChapter])
  })

  it('renders the chapter editor with loaded data', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Check that the editor is rendered
    expect(screen.getByTestId('mock-editor')).toBeInTheDocument()

    // Check that the editor header is rendered
    expect(screen.getByTestId('mock-editor-header')).toBeInTheDocument()

    // Check that the title is set
    const titleInput = screen.getByTestId('title-input')
    expect(titleInput).toHaveValue('Test Chapter')
  })

  it('handles title changes', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the title input
    const titleInput = screen.getByTestId('title-input')

    // Change the title
    fireEvent.change(titleInput, { target: { value: 'Updated Chapter Title' } })

    // Check that the title was updated
    expect(titleInput).toHaveValue('Updated Chapter Title')
  })

  it('handles content changes', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the editor textarea
    const editorTextarea = screen.getByTestId('mock-editor-textarea')

    // Change the content
    fireEvent.change(editorTextarea, { target: { value: '<p>Updated content</p>' } })

    // Check that the content was updated
    expect(editorTextarea).toHaveValue('<p>Updated content</p>')
  })

  it('handles publish dialog open and close', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the publish button
    const publishButton = screen.getByTestId('publish-button')

    // Click the publish button to open dialog
    fireEvent.click(publishButton)

    // Check that the publish dialog is rendered
    expect(screen.getByTestId('mock-publish-dialog')).toBeInTheDocument()

    // Find the cancel button
    const cancelButton = screen.getByTestId('publish-cancel-button')

    // Click the cancel button to close dialog
    fireEvent.click(cancelButton)

    // Check that the publish dialog is no longer rendered
    expect(screen.queryByTestId('mock-publish-dialog')).not.toBeInTheDocument()
  })

  it('handles save button click', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the save button
    const saveButton = screen.getByTestId('save-button')

    // Click the save button
    fireEvent.click(saveButton)

    // Check that updateChapter was called
    await waitFor(() => {
      expect(StoryService.updateChapter).toHaveBeenCalledWith(
        'test-story-id',
        'test-chapter-id',
        expect.objectContaining({
          title: 'Test Chapter',
          content: '<p>Test content</p>'
        })
      )
    })
  })

  it('handles preview toggle', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the preview button
    const previewButton = screen.getByTestId('preview-button')

    // Click the preview button
    fireEvent.click(previewButton)

    // Check that the button text changed to "Edit"
    expect(screen.getByTestId('preview-button')).toHaveTextContent('Edit')

    // Click again to toggle back
    fireEvent.click(screen.getByTestId('preview-button'))

    // Check that the button text changed back to "Preview"
    expect(screen.getByTestId('preview-button')).toHaveTextContent('Preview')
  })

  it('confirms before navigating away with unsaved changes', async () => {
    render(<ChapterEditorPage />)

    // Wait for data to load
    await waitFor(() => {
      expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    })

    // Find the editor textarea and make a change
    const editorTextarea = screen.getByTestId('mock-editor-textarea')
    fireEvent.change(editorTextarea, { target: { value: '<p>Updated content</p>' } })

    // Find the back button
    const backButton = screen.getByTestId('back-button')

    // Click the back button
    fireEvent.click(backButton)

    // Check that confirm was called
    expect(global.confirm).toHaveBeenCalled()

    // Check that router.push was called since we mocked confirm to return true
    expect(mockRouter.push).toHaveBeenCalledWith(`/write/story-info?id=test-story-id`)
  })
})
