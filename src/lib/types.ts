export interface Story {
  id: number
  title: string
  author: string
  genre: string
  coverImage: string
  excerpt: string
  likeCount: number
  commentCount: number
  viewCount: number
  readTime: number
  date: Date
}

export interface Chapter {
  id: number
  storyId: number
  number: number
  title: string
  content: string
  wordCount: number
  isPremium: boolean
  publishDate: Date
  readProgress: number
}

export interface Comment {
  id: number
  storyId: number
  userId: number
  username: string
  userAvatar: string
  content: string
  likeCount: number // Standardized from likes
  date: Date
  replies?: Reply[]
}

export interface Reply {
  id: number
  commentId: number
  userId: number
  username: string
  userAvatar: string
  content: string
  likeCount: number // Standardized from likes
  date: Date
}

