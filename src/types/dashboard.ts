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
  genreName?: string; // Added genre name
  slug: string; // Added slug
  reads: number;
  likes: number;
  comments: number;
  date: string; // ISO date string
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
  createdAt: string; // ISO date string
}

export interface DashboardOverviewData {
  stats: DashboardStats;
  stories: DashboardStory[];
  readsData: ReadsDataPoint[];
  engagementData: EngagementDataPoint[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
