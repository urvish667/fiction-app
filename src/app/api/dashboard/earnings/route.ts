import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getEarningsData } from "@/lib/services/dashboard-service";
import { ApiResponse } from "@/types/dashboard";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

// Valid time range options
const VALID_TIME_RANGES = ['7days', '30days', '90days', 'year', 'all'];

// Create a dedicated logger for this endpoint
const earningsLogger = logger.child('dashboard-earnings-api');

/**
 * GET /api/dashboard/earnings
 * Fetches earnings data for the dashboard
 * @param timeRange - The time range for the earnings data
 */
export async function GET(request: Request) {
  // Get the timeRange from the URL query parameters
  const url = new URL(request.url);
  const timeRange = url.searchParams.get('timeRange') || '30days';

  // Validate timeRange parameter
  if (!VALID_TIME_RANGES.includes(timeRange)) {
    earningsLogger.warn(`Invalid time range parameter: ${timeRange}`);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid time range parameter",
      },
      { status: 400 }
    );
  }

  try {
    earningsLogger.debug('Processing earnings data request', { timeRange });

    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      earningsLogger.warn('Unauthorized access attempt to earnings data');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "Unauthorized",
      }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    if (!userId) {
      earningsLogger.warn('Missing user ID in session', { session });
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: "User ID not found in session",
      }, { status: 400 });
    }

    // Log the request details
    earningsLogger.info('Fetching earnings data', { userId, timeRange });

    // Fetch earnings data
    const earningsData = await getEarningsData(userId, timeRange);

    // Fetch recent donations for this user
    const recentDonations = await prisma.donation.findMany({
      where: {
        recipientId: userId,
        status: 'succeeded', // Only include successful donations
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5, // Limit to 5 most recent donations
      include: {
        donor: {
          select: {
            name: true,
          },
        },
        story: {
          select: {
            title: true,
          },
        },
      },
    });

    // Format the donations for the response
    const formattedDonations = recentDonations.map((donation) => ({
      id: donation.id,
      amount: donation.amount / 100, // Convert cents to dollars
      donorName: donation.donor.name || 'Anonymous',
      date: donation.createdAt.toISOString(),
      storyTitle: donation.story?.title,
    }));

    // Transform the data to match the expected format
    const transformedData = {
      total: earningsData.totalEarnings,
      change: earningsData.monthlyChange,
      recentDonations: formattedDonations,
    };

    earningsLogger.debug('Earnings data retrieved successfully', { userId });

    // Set cache headers for better performance
    // Cache for 5 minutes on client, revalidate every hour on server
    const headers = new Headers();
    headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');

    return NextResponse.json<ApiResponse<{
      total: number;
      change: number;
      recentDonations: Array<{
        id: string;
        amount: number;
        donorName: string;
        date: string;
        storyTitle?: string;
      }>;
    }>>(
      {
        success: true,
        data: transformedData,
      },
      { headers }
    );
  } catch (error) {
    // Log the error with detailed context
    earningsLogger.error('Error fetching earnings data', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timeRange
    });

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: "Failed to fetch earnings data",
    }, { status: 500 });
  }
}
