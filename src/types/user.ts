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