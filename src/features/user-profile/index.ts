// Public barrel interface for user-profile feature
export { UserProfileClient } from "./components/user-profile-client";
export { ProfileHeader } from "./components/profile-header";
export { ProfileActionButtons } from "./components/profile-action-buttons";
export { PublishedStoriesTab } from "./components/tabs/published-stories-tab";
export { SavedLibraryTab } from "./components/tabs/saved-library-tab";
export { FollowersTab } from "./components/tabs/followers-tab";

// Hooks
export { useUserProfileData } from "./hooks/use-user-profile-data";

// Types
export type * from "./types/user-profile.types";
