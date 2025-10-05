import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/auth/db-adapter';

// Validate the input
const enableDonationsSchema = z.object({
  method: z.union([
    z.literal('PAYPAL'),
    z.literal('STRIPE'),
    z.literal('BMC'),
    z.literal('KOFI'),
  ]),
  link: z.string().optional(),
});

const isValidPaypalLink = (link: string) => {
  return (
    link.includes('paypal.me/') ||                          // Full PayPal.me link
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link) ||              // Email address
    /^[\w-]+$/.test(link)                                   // Just a username
  );
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = enableDonationsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.issues }, { status: 400 });
    }

    const { method, link } = validation.data;
    let formattedLink = link;

    if (method === 'PAYPAL') {
      if (!link || !isValidPaypalLink(link)) {
        return NextResponse.json({
          error: "Please enter a valid PayPal.me link, username, or email address"
        }, { status: 400 });
      }

      // Normalize PayPal link to username if it's a full link
      if (link.includes('paypal.me/')) {
        const match = link.match(/paypal\.me\/([\w-]+)/);
        if (match && match[1]) {
          formattedLink = match[1];
        }
      }
    } else if (method === 'BMC' || method === 'KOFI') {
      if (!link) {
        return NextResponse.json({
          error: `Please enter your ${method === 'BMC' ? 'Buy Me a Coffee' : 'Ko-fi'} username.`
        }, { status: 400 });
      }
      // Basic validation for username format
      const usernameRegex = /^[a-zA-Z0-9-_]+$/;
      if (!usernameRegex.test(link)) {
        return NextResponse.json({
          error: `Invalid ${method === 'BMC' ? 'Buy Me a Coffee' : 'Ko-fi'} username format.`
        }, { status: 400 });
      }
      formattedLink = link;
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        donationsEnabled: true,
        donationMethod: method,
        donationLink: formattedLink ?? null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Donations enabled successfully.' }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: "An error occurred while enabling donations" },
      { status: 500 }
    );
  }
}
