import { UserSummary } from "./user";

export type GenreSummary = {
  id: string;
  name: string;
  slug: string | null;
};

export type TagSummary = {
  id: string;
  name: string;
  slug: string | null;
};

export type Story = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  genre: GenreSummary | null;
  language: string | { id: string; name: string } | null;
  isMature: boolean;
  isOriginal: boolean;
  status: string; // "draft", "ongoing", or "completed"
  license: string; // License type
  wordCount: number;
  readCount: number;
  authorId: string;
  author?: UserSummary;
  chapters?: Chapter[];
  tags: TagSummary[]; // Tags associated with the story
  createdAt: Date | string;
  updatedAt: Date | string;
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
  chapterId?: string;
  chapter?: Chapter;
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
  isOriginal?: boolean;
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
  progress?: number;
};

export type StoryRecommendation = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  status: string;
  author: {
    id: string;
    name?: string;
    username: string;
    image?: string;
  };
  genre: GenreSummary | null;
  tags: TagSummary[];
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  chapterCount: number;
  similarityScore: number;
};
