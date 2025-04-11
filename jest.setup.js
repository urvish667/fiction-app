// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock the next/router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({
    storyId: 'test-story-id',
    chapterId: 'test-chapter-id',
  }),
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
      }
    },
    status: 'authenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Suppress console output during tests
const originalConsoleError = console.error
const originalConsoleLog = console.log
const originalConsoleWarn = console.warn

console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render') ||
      args[0].includes('Warning: React.createElement') ||
      args[0].includes('Warning: An update to') ||
      args[0].includes('Warning: validateDOMNesting'))
  ) {
    return
  }
  originalConsoleError(...args)
}

console.log = (...args) => {
  // Skip logging for info messages from error-logger
  if (typeof args[0] === 'string' && args[0].startsWith('Info:')) {
    return
  }
  originalConsoleLog(...args)
}

console.warn = (...args) => {
  // Skip logging for warning messages from error-logger
  if (typeof args[0] === 'string' && args[0].startsWith('Warning:')) {
    return
  }
  originalConsoleWarn(...args)
}
