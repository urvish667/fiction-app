import { UserSummary } from "./user";

export type Story = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  genre?: string;
  language: string;
  isMature: boolean;
  status: string; // "draft", "ongoing", or "completed"
  license: string; // License type
  wordCount: number;
  readCount: number;
  authorId: string;
  author?: UserSummary;
  chapters?: Chapter[];
  tags?: { id: string; name: string }[]; // Tags associated with the story
  createdAt: Date;
  updatedAt: Date;
  // Interaction properties
  isLiked?: boolean;
  isBookmarked?: boolean;
  likeCount?: number;
  commentCount?: number;
  bookmarkCount?: number;
  chapterCount?: number;
  viewCount?: number; // Combined story + chapter views
};

export type Chapter = {
  id: string;
  title: string;
  contentKey: string;
  content?: string; // Content loaded from S3, not stored in DB
  number: number;
  wordCount: number;
  isPremium: boolean;
  status: 'draft' | 'scheduled' | 'published'; // Current status field
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
  user?: UserSummary;
  storyId: string;
  story?: Story;
  parentId?: string;
  parent?: Comment;
  replies?: Comment[];
  replyCount?: number;
  likeCount?: number;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Like = {
  id: string;
  userId: string;
  user?: UserSummary;
  storyId: string;
  story?: Story;
  createdAt: Date;
};

export type Bookmark = {
  id: string;
  userId: string;
  user?: UserSummary;
  storyId: string;
  story?: Story;
  createdAt: Date;
};

export type ReadingProgress = {
  id: string;
  progress: number; // 0-100 percentage
  userId: string;
  user?: UserSummary;
  chapterId: string;
  chapter?: Chapter;
  lastRead: Date;
};

// Request and response types for API endpoints

export type CreateStoryRequest = {
  title: string;
  description?: string;
  coverImage?: string;
  genre?: string | { connect: { id: string } };
  language?: string | { connect: { id: string } };
  isMature?: boolean;
  status?: string; // "draft", "ongoing", or "completed"
  license?: string; // License type
};

export type UpdateStoryRequest = Partial<CreateStoryRequest>;

export type CreateChapterRequest = {
  title: string;
  content: string;
  number: number;
  isPremium?: boolean;
  status?: 'draft' | 'scheduled' | 'published';
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
  viewCount?: number; // Combined story + chapter views
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type ChapterResponse = Chapter & {
  readingProgress?: number;
};
