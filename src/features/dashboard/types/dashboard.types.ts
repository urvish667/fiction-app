// Dashboard data types
export interface DashboardStats {
  totalReads: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalEarnings: number;
  readsChange: number;
  likesChange: number;
  commentsChange: number;
  followersChange: number;
  earningsChange: number;
}

export interface DashboardStory {
  id: string;
  title: string;
  genre: string;
  genreName?: string;
  slug: string;
  reads: number;
  likes: number;
  comments: number;
  date: string;
  earnings: number;
}

export interface ReadsDataPoint {
  name: string;
  reads: number;
}

export interface EngagementDataPoint {
  name: string;
  likes: number;
  comments: number;
}

export interface EarningsDataPoint {
  name: string;
  earnings: number;
}

export interface DonationTransaction {
  id: string;
  donorId: string;
  donorName: string;
  donorUsername?: string;
  storyId?: string;
  storyTitle?: string;
  storySlug?: string;
  amount: number;
  message?: string;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
}

export interface DashboardOverviewData {
  stats: DashboardStats;
  stories: DashboardStory[];
  readsData: ReadsDataPoint[];
  engagementData: EngagementDataPoint[];
}

export interface TransformedEarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  monthlyChange: number;
  stories: Array<{
    id: string;
    title: string;
    genre: string;
    genreName?: string;
    slug?: string;
    reads: number;
    earnings: number;
  }>;
  transactions: DonationTransaction[];
  pagination: PaginationInfo;
  chartData: Array<{
    name: string;
    earnings: number;
  }>;
}

export type SortKey = "title" | "status" | "reads" | "likes" | "comments" | "updatedAt";

export interface UserStoryItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  genre?: string;
  genreName?: string;
  reads?: number;
  likes?: number;
  comments?: number;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}
