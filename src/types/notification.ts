export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Extended properties for UI display
  user?: {
    name: string;
    username: string;
    avatar: string;
  };
  content?: {
    storyId: string;
    storyTitle: string;
    comment?: string;
    chapterNumber?: number;
    chapterTitle?: string;
  };
  date?: Date; // For backward compatibility with mock data
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MarkReadRequest {
  ids?: string[];
  all?: boolean;
}

export interface MarkReadResponse {
  message: string;
}

// Mock notification data for development
export const mockNotifications = [
  {
    id: "1",
    userId: "user1",
    type: "like",
    title: "New Like",
    message: "Emma Rivers liked your story The Last Lighthouse",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    user: {
      name: "Emma Rivers",
      username: "emmarivers",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "1",
      storyTitle: "The Last Lighthouse",
    },
  },
  {
    id: "2",
    userId: "user1",
    type: "comment",
    title: "New Comment",
    message: "James Chen commented on your story The Last Lighthouse",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    user: {
      name: "James Chen",
      username: "jameschen",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "1",
      storyTitle: "The Last Lighthouse",
      comment: "This story is absolutely captivating! I couldn't stop reading once I started.",
    },
  },
  {
    id: "3",
    userId: "user1",
    type: "follow",
    title: "New Follower",
    message: "Sarah Blake started following you",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    user: {
      name: "Sarah Blake",
      username: "sarahblake",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    id: "4",
    userId: "user1",
    type: "chapter",
    title: "New Chapter",
    message: "Michael Torres published a new chapter in Echoes of Tomorrow",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    user: {
      name: "Michael Torres",
      username: "michaeltorres",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "2",
      storyTitle: "Echoes of Tomorrow",
      chapterNumber: 5,
      chapterTitle: "The Signal",
    },
  },
  {
    id: "5",
    userId: "user1",
    type: "like",
    title: "New Like",
    message: "Olivia Parker liked your story Whispers in the Hallway",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    user: {
      name: "Olivia Parker",
      username: "oliviaparker",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "3",
      storyTitle: "Whispers in the Hallway",
    },
  },
  {
    id: "6",
    userId: "user1",
    type: "comment",
    title: "New Comment",
    message: "Daniel Wright commented on your story Whispers in the Hallway",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
    user: {
      name: "Daniel Wright",
      username: "danielwright",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "3",
      storyTitle: "Whispers in the Hallway",
      comment: "The atmosphere you've created is so eerie and immersive. Can't wait for the next chapter!",
    },
  },
  {
    id: "7",
    userId: "user1",
    type: "follow",
    title: "New Follower",
    message: "Elena Vasquez started following you",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    user: {
      name: "Elena Vasquez",
      username: "elenavasquez",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    id: "8",
    userId: "user1",
    type: "chapter",
    title: "New Chapter",
    message: "Ryan Kim published a new chapter in Beyond the Horizon",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(), // 6 days ago
    user: {
      name: "Ryan Kim",
      username: "ryankim",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: "4",
      storyTitle: "Beyond the Horizon",
      chapterNumber: 3,
      chapterTitle: "Uncharted Waters",
    },
  },
];
