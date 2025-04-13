import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Define the expected request body schema using Zod
const enableDonationsSchema = z.object({
  method: z.literal('paypal'), // For now, only handling PayPal
  link: z.string().min(1, { message: 'PayPal link cannot be empty' })
    .refine(val => val.includes('paypal.me/') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      { message: 'Please enter a valid PayPal.me link or PayPal email address' }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const validation = enableDonationsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { method, link } = validation.data;

    // Update user in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: true,
        donationMethod: method,
        donationLink: link,
        updatedAt: new Date(), // Explicitly update updatedAt
      },
    });

    return NextResponse.json({ message: 'Donations enabled successfully.' }, { status: 200 });

  } catch (error) {
    console.error('[ENABLE_DONATIONS_ERROR]', error);
    // Handle potential Prisma errors or other issues
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 