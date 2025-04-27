import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';

// Define the expected request body schema using Zod
const enableDonationsSchema = z.object({
  method: z.literal('paypal'), // For now, only handling PayPal
  link: z.string().min(1, { message: 'PayPal link cannot be empty' })
    .refine(val => {
      // Valid formats:
      // 1. PayPal.me link (with or without https://)
      // 2. PayPal.me username
      // 3. PayPal email address
      return (
        val.includes('paypal.me/') || // Full PayPal.me link
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || // Email address
        /^[\w-]+$/.test(val) // Just a username
      );
    }, { message: 'Please enter a valid PayPal.me link, username, or PayPal email address' }),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = enableDonationsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }

    const { method, link } = validation.data;

    // Format the PayPal link correctly
    let formattedLink = link;

    // If it's a PayPal.me link, ensure it's stored in a consistent format
    // We'll store it without the https:// prefix to keep it simple
    if (formattedLink.includes('paypal.me/')) {
      // Extract the username from the PayPal.me link
      const match = formattedLink.match(/paypal\.me\/([\w-]+)/);
      if (match && match[1]) {
        formattedLink = match[1];
      }
    }

    // Update user in the database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: true,
        donationMethod: method,
        donationLink: formattedLink,
        updatedAt: new Date(), // Explicitly update updatedAt
      },
    });

    return NextResponse.json({ message: 'Donations enabled successfully.' }, { status: 200 });

  } catch (error) {
    // Handle potential Prisma errors or other issues
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: "An error occurred while enabling donations" },
      { status: 500 }
    );
  }
}