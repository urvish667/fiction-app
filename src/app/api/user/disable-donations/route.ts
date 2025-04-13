import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Update user in the database to disable donations
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: false,
        donationMethod: null, // Clear the method
        donationLink: null,   // Clear the link
        updatedAt: new Date(), // Explicitly update updatedAt
      },
    });

    return NextResponse.json({ message: 'Donations disabled successfully.' }, { status: 200 });

  } catch (error) {
    console.error('[DISABLE_DONATIONS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 