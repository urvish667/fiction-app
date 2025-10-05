import { PayoutProvider } from '@prisma/client';

export interface UserSummary {
  id: string;
  name?: string;
  username?: string;
  image?: string;
  bio?: string;
  location?: string;
  donationsEnabled?: boolean;
  donationMethod?: PayoutProvider | null;
  donationLink?: string;
}

export interface UserPreferences {
  emailNotifications: {
    newFollower: boolean
    newComment: boolean
    newLike: boolean
    newChapter: boolean
  }
  privacySettings: {
    publicProfile: boolean
    showEmail: boolean
    showLocation: boolean
    allowMessages: boolean
    forum: boolean
  }
}

export const defaultPreferences: UserPreferences = {
  emailNotifications: {
    newFollower: false,
    newComment: false,
    newLike: false,
    newChapter: false,
  },
  privacySettings: {
    publicProfile: false,
    showEmail: false,
    showLocation: false,
    allowMessages: false,
    forum: false,
  },
}
