import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      donationsEnabled: user.donationsEnabled ?? false,
      donationMethod: user.donationMethod,
      donationLink: user.donationLink,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching donation settings" },
      { status: 500 }
    );
  }
}