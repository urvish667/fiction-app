export interface ExpectedSocialLinks {
  twitter?: string | null;
  facebook?: string | null;
  instagram?: string | null;
}

export interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  socialLinks: ExpectedSocialLinks | null;
  image: string | null;
  bannerImage: string | null;
  joinedDate: string | null;
  storyCount: number;
  followerCount?: number;
  followingCount?: number;
  isCurrentUser: boolean;
  followers?: number;
  following?: number;
  donationsEnabled?: boolean | null;
  donationMethod?: string | null;
  donationLink?: string | null;
  preferences?: {
    privacySettings?: {
      publicProfile?: boolean;
      showEmail?: boolean;
      showLocation?: boolean;
      allowMessages?: boolean;
      forum?: boolean;
    };
  };
  isPublic: boolean;
  email: string | null;
}

export interface FollowUserItem {
  id: string;
  username: string;
  name?: string | null;
  image?: string | null;
  bio?: string | null;
}
