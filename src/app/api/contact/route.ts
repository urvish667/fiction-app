import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withApiLogging } from "@/lib/monitoring/api-logger";
import { withCsrfProtection } from "@/lib/security/csrf";
import { z } from "zod";

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Contact form validation schema
const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000, "Message too long"),
});

// Rate limiting function
function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5; // Max 5 requests per 15 minutes per IP

  const record = rateLimitStore.get(clientIp);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(clientIp, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Discord webhook function
async function sendToDiscord(contactData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error('Discord webhook URL not configured');
  }

  // Create Discord embed
  const embed = {
    title: "📧 New Contact Form Submission",
    color: 0x5865F2, // Discord blurple color
    fields: [
      {
        name: "👤 Name",
        value: contactData.name,
        inline: true
      },
      {
        name: "📧 Email",
        value: contactData.email,
        inline: true
      },
      {
        name: "📝 Subject",
        value: contactData.subject,
        inline: false
      },
      {
        name: "💬 Message",
        value: contactData.message.length > 1000
          ? contactData.message.substring(0, 1000) + "..."
          : contactData.message,
        inline: false
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "FableSpace Contact Form"
    }
  };

  const payload = {
    username: "FableSpace Contact",
    avatar_url: "https://cdn.discordapp.com/attachments/your-avatar-url", // Optional: Add your app's avatar
    embeds: [embed]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} - ${errorText}`);
  }
}

/**
 * POST endpoint to handle contact form submissions
 * Validates the form data, applies rate limiting, and sends to Discord
 */
export const POST = withCsrfProtection(withApiLogging(async (request: NextRequest) => {
  try {
    // Get client IP for rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     request.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Check rate limiting
    if (!checkRateLimit(clientIp)) {
      logger.warn('Contact form: Rate limit exceeded', { clientIp });
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      validatedData = ContactFormSchema.parse(body);
    } catch (validationError) {
      logger.warn('Contact form: Validation failed', {
        error: validationError,
        clientIp,
        body: JSON.stringify(body)
      });

      if (validationError instanceof z.ZodError) {
        const firstError = validationError.issues[0];
        return NextResponse.json(
          { error: firstError.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400 }
      );
    }

    // Send to Discord
    try {
      await sendToDiscord(validatedData);

      logger.info('Contact form submission sent to Discord successfully', {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject,
        messageLength: validatedData.message.length,
        clientIp
      });

      return NextResponse.json(
        { message: "Message sent successfully" },
        { status: 200 }
      );
    } catch (discordError) {
      logger.error('Failed to send contact form to Discord', {
        error: discordError instanceof Error ? discordError.message : String(discordError),
        stack: discordError instanceof Error ? discordError.stack : undefined,
        contactData: {
          name: validatedData.name,
          email: validatedData.email,
          subject: validatedData.subject,
          messageLength: validatedData.message.length
        },
        clientIp
      });

      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Contact form API error', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}));
