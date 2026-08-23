import type { StoryCardData } from "@/features/story";

export type LibrarySortOption = "recent" | "oldest" | "title" | "author" | "mostRead";

export interface LibraryState {
  bookmarkedStories: StoryCardData[];
  loading: boolean;
  searchQuery: string;
  sortBy: LibrarySortOption;
  filterGenre: string;
  genres: string[];
}
