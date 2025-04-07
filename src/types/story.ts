import { User } from "./user";

export type Story = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  genre?: string;
  language: string;
  isMature: boolean;
  isDraft: boolean;
  status: string; // "ongoing" or "completed"
  wordCount: number;
  readCount: number;
  authorId: string;
  author?: User;
  chapters?: Chapter[];
  createdAt: Date;
  updatedAt: Date;
  // Interaction properties
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  bookmarkCount?: number;
  chapterCount?: number;
};

export type Chapter = {
  id: string;
  title: string;
  contentKey: string;
  content?: string; // Content loaded from S3, not stored in DB
  number: number;
  wordCount: number;
  isPremium: boolean;
  isDraft: boolean; // Individual chapter draft status
  publishDate?: Date; // For scheduled publishing
  readCount: number;
  storyId: string;
  story?: Story;
  createdAt: Date;
  updatedAt: Date;
};

export type Comment = {
  id: string;
  content: string;
  userId: string;
  user?: User;
  storyId: string;
  story?: Story;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
};

export type Like = {
  id: string;
  userId: string;
  user?: User;
  storyId: string;
  story?: Story;
  createdAt: Date;
};

export type Bookmark = {
  id: string;
  userId: string;
  user?: User;
  storyId: string;
  story?: Story;
  createdAt: Date;
};

export type ReadingProgress = {
  id: string;
  progress: number; // 0-100 percentage
  userId: string;
  user?: User;
  chapterId: string;
  chapter?: Chapter;
  lastRead: Date;
};

// Request and response types for API endpoints

export type CreateStoryRequest = {
  title: string;
  description?: string;
  coverImage?: string;
  genre?: string;
  language?: string;
  isMature?: boolean;
  isDraft?: boolean;
  status?: string; // "ongoing" or "completed"
};

export type UpdateStoryRequest = Partial<CreateStoryRequest>;

export type CreateChapterRequest = {
  title: string;
  content: string;
  number: number;
  isPremium?: boolean;
  isDraft?: boolean;
  publishDate?: Date;
};

export type UpdateChapterRequest = Partial<CreateChapterRequest>;

export type CreateCommentRequest = {
  content: string;
  storyId: string;
  parentId?: string;
};

export type StoryResponse = Story & {
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type ChapterResponse = Chapter & {
  readingProgress?: number;
};
