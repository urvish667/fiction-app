import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  } catch {
    return NextResponse.json(
      { error: "An error occurred while disabling donations" },
      { status: 500 }
    );
  }
}