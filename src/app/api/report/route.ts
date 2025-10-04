import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';
import { ReportValidator } from '@/lib/validators/report';
import { z } from 'zod';
import { sanitizeText } from '@/lib/security/input-validation';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { storyId, commentId, postId, forumCommentId, reportedUserId, reason, details } = ReportValidator.parse(body);

    if (!storyId && !commentId && !postId && !forumCommentId && !reportedUserId) {
      return new NextResponse('At least one content identifier (storyId, commentId, postId, forumCommentId, or reportedUserId) must be provided', { status: 400 });
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        ...(storyId && { storyId }),
        ...(commentId && { commentId }),
        ...(postId && { postId }),
        ...(forumCommentId && { forumCommentId }),
        ...(reportedUserId && { reportedUserId }),
      },
    });

    if (existingReport) {
      return new NextResponse('You have already reported this content.', { status: 409 });
    }

    // Validate that referenced entities exist
    if (storyId) {
      const story = await prisma.story.findUnique({ where: { id: storyId } });
      if (!story) {
        return new NextResponse('Story not found.', { status: 400 });
      }
    }

    if (commentId) {
      const comment = await prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) {
        return new NextResponse('Comment not found.', { status: 400 });
      }
    }

    if (postId) {
      const post = await prisma.forumPost.findUnique({ where: { id: postId } });
      if (!post) {
        return new NextResponse('Post not found.', { status: 400 });
      }
    }

    if (forumCommentId) {
      const forumComment = await prisma.forumPostComment.findUnique({ where: { id: forumCommentId } });
      if (!forumComment) {
        return new NextResponse('Forum comment not found.', { status: 400 });
      }
    }

    if (reportedUserId) {
      const user = await prisma.user.findUnique({ where: { id: reportedUserId } });
      if (!user) {
        return new NextResponse('User not found.', { status: 400 });
      }
    }

    const sanitizedDetails = details ? sanitizeText(details) : undefined;

    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        storyId,
        commentId,
        postId,
        forumCommentId,
        reportedUserId,
        reason,
        details: sanitizedDetails,
      },
    });

    return new NextResponse('Report submitted successfully', { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(error.message, { status: 422 });
    }

    return new NextResponse('Could not submit report, please try again later.', {
      status: 500,
    });
  }
}
