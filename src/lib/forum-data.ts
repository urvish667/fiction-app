import { UserService } from '@/lib/api/user'
import { ForumService } from '@/lib/api/forum'

export async function getForumPostData(username: string, slug: string) {
  try {
    // Get user profile from API
    const userProfileResponse = await UserService.getUserProfile(username)

    if (!userProfileResponse.success || !userProfileResponse.data) {
      return null
    }

    const userProfile = userProfileResponse.data

    // Check if forum is enabled
    if (!userProfile.preferences?.privacySettings?.forum) {
      return null
    }

    // Get all posts to find the one with matching slug
    const postsResponse = await ForumService.getPosts(username, { limit: 100 })

    if (!postsResponse.success || !postsResponse.data) {
      return null
    }

    // Find the post with matching slug
    const postData = postsResponse.data.posts.find(p => p.slug === slug)
    if (!postData) {
      return null
    }

    // Use the new getPost API method to get full post details
    const singlePostResponse = await ForumService.getPost(username, postData.id)

    let finalPostData
    if (singlePostResponse.success && singlePostResponse.data) {
      finalPostData = singlePostResponse.data
    } else {
      // Fallback to the data we already have from posts list
      finalPostData = postData
    }

    // Get comments for the post
    const commentsResponse = await ForumService.getComments(username, postData.id)

    let comments: any[] = []
    if (commentsResponse.success && commentsResponse.data) {
      comments = commentsResponse.data.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.createdAt),
        editedAt: comment.editedAt ? new Date(comment.editedAt) : null,
        author: {
          id: comment.user.id,
          name: comment.user.name || comment.user.username || 'Unknown',
          username: comment.user.username || 'unknown',
          image: comment.user.image
        }
      }))
    }

    // Transform post to match expected format
    const transformedPost = {
      id: finalPostData.id,
      title: finalPostData.title,
      slug: finalPostData.slug,
      content: finalPostData.content,
      pinned: finalPostData.pinned,
      createdAt: new Date(finalPostData.createdAt),
      commentCount: comments.length,
      comments: comments,
      author: {
        id: finalPostData.author.id,
        name: finalPostData.author.name || finalPostData.author.username || 'Unknown',
        username: finalPostData.author.username || 'unknown',
        image: finalPostData.author.image
      }
    }

    return {
      post: transformedPost,
      user: {
        id: userProfile.id,
        name: userProfile.name ?? userProfile.username ?? 'Unknown',
        username: userProfile.username ?? 'unknown',
        image: userProfile.image
      }
    }
  } catch (error) {
    console.error('Error fetching post data:', error)
    return null
  }
}
