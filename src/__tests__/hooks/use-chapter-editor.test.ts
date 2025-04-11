import { renderHook, act } from '@testing-library/react-hooks'
import { useChapterEditor } from '@/hooks/use-chapter-editor'
import { StoryService } from '@/services/story-service'
import type { Chapter, ChapterResponse } from '@/types/story'

// Mock the StoryService
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

// Type assertion for mocked functions
const mockedGetChapter = StoryService.getChapter as jest.MockedFunction<typeof StoryService.getChapter>
const mockedUpdateChapter = StoryService.updateChapter as jest.MockedFunction<typeof StoryService.updateChapter>
const mockedCreateChapter = StoryService.createChapter as jest.MockedFunction<typeof StoryService.createChapter>
const mockedGetChapters = StoryService.getChapters as jest.MockedFunction<typeof StoryService.getChapters>

// Mock the toast component
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

describe('useChapterEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock responses
    const mockChapter = {
      id: 'test-chapter-id',
      title: 'Test Chapter',
      content: '<p>Test content</p>',
      number: 1,
      wordCount: 2,
      isDraft: true,
      isPremium: false,
      readCount: 0,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      storyId: 'test-story-id',
      contentKey: 'test-content-key',
      readingProgress: 0
    }

    // Convert string dates to Date objects for type compatibility
    const mockChapterWithDates = {
      ...mockChapter,
      createdAt: new Date(mockChapter.createdAt),
      updatedAt: new Date(mockChapter.updatedAt)
    }

    // Mock API responses
    mockedGetChapter.mockResolvedValue(mockChapterWithDates as unknown as ChapterResponse)
    mockedUpdateChapter.mockResolvedValue(mockChapterWithDates as unknown as Chapter)
    mockedCreateChapter.mockResolvedValue(mockChapterWithDates as unknown as Chapter)
    mockedGetChapters.mockResolvedValue([mockChapterWithDates] as unknown as ChapterResponse[])
  })

  it('should initialize with default values for a new chapter', () => {
    const { result } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'new-chapter'
    }))

    expect(result.current.chapter.title).toBe('')
    expect(result.current.chapter.content).toBe('')
    expect(result.current.isNewChapter).toBe(true)
    expect(result.current.hasChanges).toBe(false)
  })

  it('should load chapter data when editing an existing chapter', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'test-chapter-id'
    }))

    // Wait for the useEffect to complete
    await waitForNextUpdate()

    expect(StoryService.getChapter).toHaveBeenCalledWith('test-story-id', 'test-chapter-id')
    expect(result.current.chapter.title).toBe('Test Chapter')
    expect(result.current.chapter.content).toBe('<p>Test content</p>')
    expect(result.current.isNewChapter).toBe(false)
  })

  it('should update content and mark changes when editor content changes', () => {
    const { result } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'test-chapter-id'
    }))

    // Initial state
    expect(result.current.hasChanges).toBe(false)

    // Update content
    act(() => {
      result.current.handleEditorChange('<p>Updated content</p>')
    })

    // Check that state was updated
    expect(result.current.chapter.content).toBe('<p>Updated content</p>')
    expect(result.current.hasChanges).toBe(true)
  })

  it('should save chapter when saveChapter is called', async () => {
    const onSaveSuccess = jest.fn()

    const { result, waitForNextUpdate } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'test-chapter-id',
      onSaveSuccess
    }))

    // Wait for initial load
    await waitForNextUpdate()

    // Update content to trigger changes
    act(() => {
      result.current.handleEditorChange('<p>New content to save</p>')
    })

    // Save the chapter
    await act(async () => {
      await result.current.saveChapter(true)
    })

    // Check that the API was called with correct data
    expect(StoryService.updateChapter).toHaveBeenCalledWith(
      'test-story-id',
      'test-chapter-id',
      expect.objectContaining({
        content: '<p>New content to save</p>',
        title: 'Test Chapter'
      })
    )

    // Check that callback was called
    expect(onSaveSuccess).toHaveBeenCalled()

    // Check that hasChanges was reset
    expect(result.current.hasChanges).toBe(false)
  })

  it('should create a new chapter for new chapters', async () => {
    mockedGetChapters.mockResolvedValue([] as unknown as ChapterResponse[])

    const { result, waitForNextUpdate } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'new-chapter'
    }))

    // Wait for initial setup
    await waitForNextUpdate()

    // Set title and content
    act(() => {
      result.current.handleTitleChange({ target: { value: 'New Chapter Title' } } as React.ChangeEvent<HTMLInputElement>)
      result.current.handleEditorChange('<p>New chapter content</p>')
    })

    // Save the chapter
    await act(async () => {
      await result.current.saveChapter(true)
    })

    // Check that createChapter was called
    expect(StoryService.createChapter).toHaveBeenCalledWith(
      'test-story-id',
      expect.objectContaining({
        title: 'New Chapter Title',
        content: '<p>New chapter content</p>',
        isDraft: true
      })
    )
  })

  it('should publish a chapter when publishChapter is called', async () => {
    const onPublishSuccess = jest.fn()

    const { result, waitForNextUpdate } = renderHook(() => useChapterEditor({
      storyId: 'test-story-id',
      chapterId: 'test-chapter-id',
      onPublishSuccess
    }))

    // Wait for initial load
    await waitForNextUpdate()

    // Publish the chapter
    await act(async () => {
      await result.current.publishChapter()
    })

    // Check that updateChapter was called with isDraft: false
    expect(StoryService.updateChapter).toHaveBeenCalledWith(
      'test-story-id',
      'test-chapter-id',
      expect.objectContaining({
        isDraft: false
      })
    )

    // Check that callback was called
    expect(onPublishSuccess).toHaveBeenCalled()
  })
})
