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
  },
}

// Define a type for the user data included in stories/comments etc.
export interface UserSummary {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
  // Add donation fields needed for SupportButton
  donationsEnabled?: boolean | null;
  donationMethod?: 'paypal' | 'stripe' | null;
  donationLink?: string | null;
}