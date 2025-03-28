import type { Comment } from "./types"

export const sampleComments: Comment[] = [
  {
    id: 1001,
    storyId: 1,
    userId: 101,
    username: "BookLover42",
    userAvatar: "/placeholder-user.jpg",
    content:
      "This story is absolutely captivating! I couldn't stop reading once I started. The world-building is phenomenal and the characters feel so real. Can't wait for the next chapter!",
    likes: 24,
    date: new Date("2023-12-16"),
    replies: [
      {
        id: 10011,
        commentId: 1001,
        userId: 102,
        username: "StorySeeker",
        userAvatar: "/placeholder-user.jpg",
        content:
          "I completely agree! The way the author describes the lighthouse is so vivid, I feel like I'm actually there.",
        likes: 8,
        date: new Date("2023-12-16"),
      },
      {
        id: 10012,
        commentId: 1001,
        userId: 103,
        username: "NightOwl",
        userAvatar: "/placeholder-user.jpg",
        content: "The character development is what really got me. So nuanced!",
        likes: 5,
        date: new Date("2023-12-17"),
      },
    ],
  },
  {
    id: 1002,
    storyId: 1,
    userId: 104,
    username: "LiteraryExplorer",
    userAvatar: "/placeholder-user.jpg",
    content:
      "The plot twist at the end of chapter 3 was mind-blowing! I did not see that coming at all. Emma Rivers is quickly becoming one of my favorite authors on this platform.",
    likes: 17,
    date: new Date("2023-12-23"),
    replies: [],
  },
  {
    id: 1003,
    storyId: 1,
    userId: 105,
    username: "WordWanderer",
    userAvatar: "/placeholder-user.jpg",
    content:
      "I'm usually not a big fan of fantasy, but this story has completely changed my mind. The way magic is integrated into the world feels so natural and believable.",
    likes: 12,
    date: new Date("2023-12-24"),
    replies: [
      {
        id: 10031,
        commentId: 1003,
        userId: 101,
        username: "BookLover42",
        userAvatar: "/placeholder-user.jpg",
        content: "Right? It's fantasy but somehow feels grounded in reality. That's hard to pull off!",
        likes: 3,
        date: new Date("2023-12-24"),
      },
    ],
  },
  {
    id: 1004,
    storyId: 1,
    userId: 106,
    username: "PageTurner",
    userAvatar: "/placeholder-user.jpg",
    content:
      "The dialogue is so well-written! Each character has such a distinct voice. I'm especially fond of the lighthouse keeper - such a mysterious and intriguing character.",
    likes: 9,
    date: new Date("2023-12-26"),
    replies: [],
  },

  // Comments for story 2
  {
    id: 2001,
    storyId: 2,
    userId: 107,
    username: "SciFiEnthusiast",
    userAvatar: "/placeholder-user.jpg",
    content:
      "As a huge sci-fi fan, I have to say this is one of the most original takes on first contact I've read in years. The scientific details feel well-researched too!",
    likes: 19,
    date: new Date("2023-12-11"),
    replies: [],
  },
  {
    id: 2002,
    storyId: 2,
    userId: 108,
    username: "StarGazer",
    userAvatar: "/placeholder-user.jpg",
    content:
      "The way the author describes the alien technology is fascinating. It's advanced but still feels plausible. I'm completely hooked!",
    likes: 14,
    date: new Date("2023-12-15"),
    replies: [],
  },

  // Comments for story 3
  {
    id: 3001,
    storyId: 3,
    userId: 109,
    username: "MysteryLover",
    userAvatar: "/placeholder-user.jpg",
    content:
      "This story has the perfect atmosphere for a mystery - creepy old school, strange noises, and secrets buried for generations. I'm getting goosebumps just reading it!",
    likes: 16,
    date: new Date("2023-12-06"),
    replies: [],
  },
]

