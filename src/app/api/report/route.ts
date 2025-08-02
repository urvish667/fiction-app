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
    const { storyId, commentId, reason, details } = ReportValidator.parse(body);

    if (!storyId && !commentId) {
      return new NextResponse('Either storyId or commentId must be provided', { status: 400 });
    }

    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: session.user.id,
        ...(storyId && { storyId }),
        ...(commentId && { commentId }),
      },
    });

    if (existingReport) {
      return new NextResponse('You have already reported this content.', { status: 409 });
    }

    const sanitizedDetails = details ? sanitizeText(details) : undefined;

    await prisma.report.create({
      data: {
        reporterId: session.user.id,
        storyId,
        commentId,
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
