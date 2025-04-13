import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        donationsEnabled: true,
        donationMethod: true,
        donationLink: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      donationsEnabled: user.donationsEnabled ?? false,
      donationMethod: user.donationMethod,
      donationLink: user.donationLink,
    });
  } catch (error) {
    console.error('[GET_DONATION_SETTINGS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 