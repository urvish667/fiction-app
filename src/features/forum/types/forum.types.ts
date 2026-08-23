export interface ForumUser {
  id: string
  name: string
  username: string
  image: string | null
}

export interface ForumComment {
  id: string
  content: string
  author: {
    id: string
    name: string
    username: string
    image: string | null
  }
  createdAt: Date
  editedAt?: Date
}

export interface ForumPost {
  id: string
  title: string
  slug: string
  content: string
  author: {
    id: string
    name: string
    username: string
    image: string | null
  }
  pinned: boolean
  createdAt: Date
  commentCount: number
  comments: ForumComment[]
}

export interface BannedUser {
  id: string
  name: string
  username: string
  image: string | null
}

export interface PostCardProps {
  post: ForumPost
  forumOwnerUsername: string
  isExpanded: boolean
  onToggleExpansion: (postId: string) => void
  currentUser: {
    id: string
    name: string
    image: string | null
  } | null
  onLoadMoreComments: (postId: string, totalComments: number) => void
  visibleComments: { [key: string]: number }
  isForumOwner: boolean
  onBanUser?: (postId: string, userId: string) => void
  onDeletePost?: (postId: string) => void
  onEditPost?: (postId: string) => void
  onTogglePin?: (postId: string) => void
}

export interface PostListProps {
  user: ForumUser
  currentUserId: string | null
  posts: ForumPost[]
  onNewPost?: (title: string, content: string) => void
  isForumOwner?: boolean
  onBanUser?: (postId: string, userId: string) => void
  onDeletePost?: (postId: string) => void
  onEditPost?: (postId: string) => void
  onTogglePin?: (postId: string) => void
}
