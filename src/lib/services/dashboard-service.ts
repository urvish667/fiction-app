import { prisma } from "@/lib/prisma";
import { ViewService } from "@/services/view-service";
import {
  DashboardOverviewData,
  DashboardStats,
  DashboardStory,
  ReadsDataPoint,
  EngagementDataPoint,
  EarningsDataPoint
} from "@/types/dashboard";

/**
 * Calculate date ranges based on the time range parameter
 * @param timeRange The time range (e.g., 7days, 30days, 90days, year, all)
 * @returns Object containing start date and previous period dates
 */
function calculateDateRanges(timeRange: string) {
  const now = new Date();
  let days = 30; // Default to 30 days

  // Parse the time range
  if (timeRange === '7days') {
    days = 7;
  } else if (timeRange === '30days') {
    days = 30;
  } else if (timeRange === '90days') {
    days = 90;
  } else if (timeRange === 'year') {
    days = 365;
  } else if (timeRange === 'all') {
    // For 'all', use a very old date as the start date
    const startDate = new Date(2000, 0, 1); // January 1, 2000
    return {
      startDate,
      previousStartDate: new Date(1990, 0, 1), // January 1, 1990
      previousEndDate: startDate
    };
  }

  // Calculate the start date for the current period
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);

  // Calculate the start and end dates for the previous period
  const previousStartDate = new Date();
  previousStartDate.setDate(now.getDate() - (days * 2));

  const previousEndDate = new Date(startDate);

  return { startDate, previousStartDate, previousEndDate };
}

/**
 * Get dashboard stats for a specific user
 * @param userId The ID of the user
 * @param timeRange The time range for the data (e.g., 7days, 30days, 90days, year, all)
 * @returns Dashboard stats
 */
export async function getDashboardStats(userId: string, timeRange: string = '30days'): Promise<DashboardStats> {
  // Calculate date ranges based on the timeRange parameter
  const { startDate, previousStartDate, previousEndDate } = calculateDateRanges(timeRange);

  // Get the user's stories for calculating totals
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      _count: {
        select: {
          views: true,
          likes: true,
          comments: true,
        },
      },
      donations: true,
    },
  });

  // Get total followers
  const followersCount = await prisma.follow.count({
    where: {
      followingId: userId,
    },
  });

  // Get total reads (views) using the optimized ViewService with combined story + chapter views
  const userStoryIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(userStoryIds);
  const totalViews = Array.from(viewCountMap.values()).reduce((sum, count) => sum + count, 0);

  // Calculate total likes, comments
  const totalLikes = stories.reduce((sum, story) => sum + story._count.likes, 0);
  const totalComments = stories.reduce((sum, story) => sum + story._count.comments, 0);

  // Calculate total earnings from donations (convert cents to dollars)
  // Only count donations with 'collected' status
  const totalEarningsInCents = stories.reduce(
    (sum, story) => sum + story.donations
      .filter(d => d.status === 'collected')
      .reduce((dSum, d) => dSum + d.amountCents, 0),
    0
  );

  // Convert cents to dollars
  const totalEarnings = totalEarningsInCents / 100;

  // Get previous period views using the optimized ViewService with combined story + chapter views
  const previousPeriodViewCountMap = await ViewService.getBatchCombinedViewCounts(
    userStoryIds,
    'custom',
    previousStartDate,
    previousEndDate
  );
  const previousPeriodViews = Array.from(previousPeriodViewCountMap.values()).reduce((sum, count) => sum + count, 0);

  // Get previous period likes
  const previousPeriodLikes = await prisma.like.count({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: previousStartDate,
        lt: previousEndDate,
      },
    },
  });

  // Get previous period comments
  const previousPeriodComments = await prisma.comment.count({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: previousStartDate,
        lt: previousEndDate,
      },
    },
  });

  // Get previous period followers
  const previousPeriodFollowers = await prisma.follow.count({
    where: {
      followingId: userId,
      createdAt: {
        gte: previousStartDate,
        lt: previousEndDate,
      },
    },
  });

  // Get previous period earnings (only collected payments)
  const previousPeriodEarnings = await prisma.donation.aggregate({
    where: {
      story: {
        authorId: userId,
      },
      status: 'collected',
      createdAt: {
        gte: previousStartDate,
        lt: previousEndDate,
      },
    },
    _sum: {
      amountCents: true,
    },
  });

  // Calculate percentage changes
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  // Get current period views using the optimized ViewService with combined story + chapter views
  const currentPeriodViewCountMap = await ViewService.getBatchCombinedViewCounts(
    userStoryIds,
    'custom',
    startDate
  );
  const currentPeriodViews = Array.from(currentPeriodViewCountMap.values()).reduce((sum, count) => sum + count, 0);

  // Get current period likes
  const currentPeriodLikes = await prisma.like.count({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get current period comments
  const currentPeriodComments = await prisma.comment.count({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get current period followers
  const currentPeriodFollowers = await prisma.follow.count({
    where: {
      followingId: userId,
      createdAt: {
        gte: startDate,
      },
    },
  });

  // Get current period earnings (only collected payments)
  const currentPeriodEarnings = await prisma.donation.aggregate({
    where: {
      story: {
        authorId: userId,
      },
      status: 'collected',
      createdAt: {
        gte: startDate,
      },
    },
    _sum: {
      amountCents: true,
    },
  });

  const readsChange = calculateChange(
    currentPeriodViews,
    previousPeriodViews
  );

  const likesChange = calculateChange(
    currentPeriodLikes,
    previousPeriodLikes
  );

  const commentsChange = calculateChange(
    currentPeriodComments,
    previousPeriodComments
  );

  const followersChange = calculateChange(
    currentPeriodFollowers,
    previousPeriodFollowers
  );

  // Convert cents to dollars for earnings change calculation
  const currentEarnings = (currentPeriodEarnings._sum.amountCents || 0) / 100;
  const previousEarnings = (previousPeriodEarnings._sum.amountCents || 0) / 100;

  const earningsChange = calculateChange(
    currentEarnings,
    previousEarnings
  );

  // Compile and return stats
  return {
    totalReads: totalViews,
    totalLikes,
    totalComments,
    totalFollowers: followersCount,
    totalEarnings,
    readsChange,
    likesChange,
    commentsChange,
    followersChange,
    earningsChange,
  };
}

/**
 * Get top performing stories for a user
 * @param userId The ID of the user
 * @param limit Number of stories to return
 * @param sortBy Field to sort by (reads, likes, comments, earnings)
 * @returns Array of dashboard stories
 */
export async function getTopStories(userId: string, limit: number = 5, sortBy: string = 'reads', timeRange: string = '30days'): Promise<DashboardStory[]> {
  // Calculate date range
  const { startDate } = calculateDateRanges(timeRange);

  // Get the user's stories
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      donations: {
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      },
      genre: true, // Include genre to get the name
    },
  });

  const storyIds = stories.map(story => story.id);

  // Get view counts for the specified time range
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds, 'custom', startDate);

  // Get like counts for the specified time range
  const likesCount = await prisma.like.groupBy({
    by: ['storyId'],
    where: {
      storyId: { in: storyIds },
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      storyId: true,
    },
  });

  // Get comment counts for the specified time range
  const commentsCount = await prisma.comment.groupBy({
    by: ['storyId'],
    where: {
      storyId: { in: storyIds },
      createdAt: {
        gte: startDate,
      },
    },
    _count: {
      storyId: true,
    },
  });

  // Create maps for quick lookup
  const likesMap = new Map(likesCount.map(like => [like.storyId, like._count.storyId]));
  const commentsMap = new Map(commentsCount.map(comment => [comment.storyId, comment._count.storyId]));

  // Format stories data
  let formattedStories: DashboardStory[] = stories.map(story => {
    // Calculate earnings in cents (only collected payments)
    const storyEarningsInCents = story.donations
      .filter(donation => donation.status === 'collected')
      .reduce((sum, donation) => sum + donation.amountCents, 0);

    // Convert cents to dollars
    const storyEarnings = storyEarningsInCents / 100;

    // Get genre name if available
    const genreName = story.genre?.name || "General";

    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      genreName: genreName,
      slug: story.slug || story.id, // Use slug if available, fallback to ID
      reads: viewCountMap.get(story.id) || 0,
      likes: likesMap.get(story.id) || 0,
      comments: commentsMap.get(story.id) || 0,
      date: story.updatedAt.toISOString(),
      earnings: storyEarnings,
    };
  });

  // Apply custom sorting for views, likes, comments, and earnings
  if (sortBy === 'reads') {
    formattedStories.sort((a, b) => b.reads - a.reads);
  } else if (sortBy === 'likes') {
    formattedStories.sort((a, b) => b.likes - a.likes);
  } else if (sortBy === 'comments') {
    formattedStories.sort((a, b) => b.comments - a.comments);
  } else if (sortBy === 'earnings') {
    formattedStories.sort((a, b) => b.earnings - a.earnings);
  }

  return formattedStories.slice(0, limit);
}

/**
 * Get dashboard overview data for a specific user
 * @param userId The ID of the user
 * @param timeRange The time range for the data (e.g., 7days, 30days, 90days, year, all)
 * @returns Dashboard overview data
 */
export async function getDashboardOverviewData(userId: string, timeRange: string = '30days'): Promise<DashboardOverviewData> {
  // Get stats
  const stats = await getDashboardStats(userId, timeRange);

  // Get top stories
  const stories = await getTopStories(userId, 5, 'reads', timeRange);

  // Get chart data
  const readsData = await getReadsChartData(userId, timeRange);
  const engagementData = await getEngagementChartData(userId, timeRange);

  // Return combined data
  return {
    stats,
    stories,
    readsData,
    engagementData,
  };
}

/**
 * Get reads data for chart
 * @param userId The ID of the user
 * @param timeRange The time range for the data
 * @returns Array of data points for reads chart
 */
export async function getReadsChartData(userId: string, timeRange: string = '30days'): Promise<ReadsDataPoint[]> {

  const months = [];
  const today = new Date();

  // Generate last 7 months
  for (let i = 6; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      name: month.toLocaleString('default', { month: 'short' }),
      date: month,
      nextMonth: new Date(month.getFullYear(), month.getMonth() + 1, 1)
    });
  }

  // Get all user's stories
  const userStories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    select: {
      id: true,
    },
  });

  const userStoryIds = userStories.map(story => story.id);

  if (userStoryIds.length === 0) {
    // Return empty data if user has no stories
    return months.map(month => ({
      name: month.name,
      reads: 0,
    }));
  }

  // Get reads data for each month
  const readsData: ReadsDataPoint[] = [];

  // Get all story views for this user's stories
  const storyViews = await prisma.storyView.findMany({
    where: {
      storyId: { in: userStoryIds },
    },
    select: {
      storyId: true,
      createdAt: true,
    },
  });

  // Get all chapter views for this user's stories
  const chapters = await prisma.chapter.findMany({
    where: {
      storyId: { in: userStoryIds },
    },
    select: {
      id: true,
      storyId: true,
    },
  });

  const chapterIds = chapters.map(chapter => chapter.id);

  let chapterViews: { chapterId: string, createdAt: Date }[] = [];

  if (chapterIds.length > 0) {
    chapterViews = await prisma.chapterView.findMany({
      where: {
        chapterId: { in: chapterIds },
      },
      select: {
        chapterId: true,
        createdAt: true,
      },
    });

  }

  // Create a map of chapter ID to story ID
  const chapterToStoryMap = new Map<string, string>();
  chapters.forEach(chapter => {
    chapterToStoryMap.set(chapter.id, chapter.storyId);
  });

  // Process each month
  for (const month of months) {
    // Filter story views for this month
    const monthStoryViews = storyViews.filter(view =>
      view.createdAt >= month.date && view.createdAt < month.nextMonth
    );

    // Filter chapter views for this month
    const monthChapterViews = chapterViews.filter(view =>
      view.createdAt >= month.date && view.createdAt < month.nextMonth
    );

    // Count story views
    const storyViewCount = monthStoryViews.length;

    // Count chapter views
    const chapterViewCount = monthChapterViews.length;

    // Total reads for this month
    const reads = storyViewCount + chapterViewCount;

    readsData.push({
      name: month.name,
      reads,
    });
  }

  return readsData;
}

/**
 * Get engagement data for chart
 * @param userId The ID of the user
 * @param timeRange The time range for the data
 * @returns Array of data points for engagement chart
 */
export async function getEngagementChartData(userId: string, timeRange: string = '30days'): Promise<EngagementDataPoint[]> {
  // timeRange parameter is kept for API consistency but not used in this implementation

  const months = [];
  const today = new Date();

  // Generate last 7 months
  for (let i = 6; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      name: month.toLocaleString('default', { month: 'short' }),
      date: month,
      nextMonth: new Date(month.getFullYear(), month.getMonth() + 1, 1)
    });
  }

  // Get all user's stories first to check if they have any
  const userStories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    select: {
      id: true,
    },
  });

  const userStoryIds = userStories.map(story => story.id);


  if (userStoryIds.length === 0) {
    // Return empty data if user has no stories
    return months.map(month => ({
      name: month.name,
      likes: 0,
      comments: 0,
    }));
  }

  // Get all likes for this user's stories
  const likes = await prisma.like.findMany({
    where: {
      storyId: { in: userStoryIds },
    },
    select: {
      createdAt: true,
    },
  });

  // Get all comments for this user's stories
  const comments = await prisma.comment.findMany({
    where: {
      storyId: { in: userStoryIds },
    },
    select: {
      createdAt: true,
    },
  });

  // Get engagement data for each month
  const engagementData: EngagementDataPoint[] = [];

  for (const month of months) {
    // Filter likes for this month
    const monthLikes = likes.filter(like =>
      like.createdAt >= month.date && like.createdAt < month.nextMonth
    );

    // Filter comments for this month
    const monthComments = comments.filter(comment =>
      comment.createdAt >= month.date && comment.createdAt < month.nextMonth
    );

    const likesCount = monthLikes.length;
    const commentsCount = monthComments.length;

    engagementData.push({
      name: month.name,
      likes: likesCount,
      comments: commentsCount,
    });
  }

  return engagementData;
}

/**
 * Get all stories for a user with detailed information
 * @param userId The ID of the user
 * @param timeRange The time range for the data
 * @returns Array of user stories with detailed information
 */
export async function getUserStories(userId: string, timeRange: string = 'all') {
  const { startDate } = calculateDateRanges(timeRange);
  // Get all stories for the user
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      _count: {
        select: {
          chapters: true,
        },
      },
      donations: {
        where: {
          createdAt: {
            gte: startDate,
          },
        },
      },
      genre: true, // Include genre to get the name
    },
  });

  // Get view counts for each story using the optimized ViewService with combined story + chapter views
  const storyIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds, 'custom', startDate);

    // Get like counts for the specified time range
    const likesCount = await prisma.like.groupBy({
      by: ['storyId'],
      where: {
        storyId: { in: storyIds },
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        storyId: true,
      },
    });
  
    // Get comment counts for the specified time range
    const commentsCount = await prisma.comment.groupBy({
      by: ['storyId'],
      where: {
        storyId: { in: storyIds },
        createdAt: {
          gte: startDate,
        },
      },
      _count: {
        storyId: true,
      },
    });
  
    // Create maps for quick lookup
    const likesMap = new Map(likesCount.map(like => [like.storyId, like._count.storyId]));
    const commentsMap = new Map(commentsCount.map(comment => [comment.storyId, comment._count.storyId]));

  // Format stories data
  const formattedStories = stories.map(story => {
    // Get genre name if available
    const genreName = story.genre?.name || "General";
    const storyEarningsInCents = story.donations
    .filter(donation => donation.status === 'collected')
    .reduce((sum, donation) => sum + donation.amountCents, 0);

  // Convert cents to dollars
  const storyEarnings = storyEarningsInCents / 100;

    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      genreName: genreName,
      slug: story.slug || story.id, // Use slug if available, fallback to ID
      status: story.status,
      reads: viewCountMap.get(story.id) || 0,
      likes: likesMap.get(story.id) || 0,
      comments: commentsMap.get(story.id) || 0,
      date: story.updatedAt.toISOString(),
      earnings: storyEarnings,
      chapters: story._count.chapters,
      updatedAt: story.updatedAt,
      createdAt: story.createdAt,
      coverImage: story.coverImage,
      description: story.description,
    };
  });

  return formattedStories;
}

/**
 * Get earnings data for a user
 * @param userId The ID of the user
 * @param timeRange The time range for the data
 * @param page The page number for transactions pagination
 * @param pageSize The number of transactions per page
 * @returns Earnings data including total, monthly, per story, and individual transactions
 */
export async function getEarningsData(
  userId: string,
  timeRange: string = '30days',
  page: number = 1,
  pageSize: number = 10
) {
  // Calculate date ranges based on the timeRange parameter
  const { startDate } = calculateDateRanges(timeRange);

  // Get the user's stories
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      donations: true,
      genre: true, // Include genre to get the name
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get view counts for each story using the optimized ViewService with combined story + chapter views
  const storyIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds);

  // Calculate total earnings (all time) - only collected payments
  const totalEarningsInCents = stories.reduce(
    (sum, story) => sum + story.donations
      .filter(d => d.status === 'collected')
      .reduce((dSum, d) => dSum + d.amountCents, 0),
    0
  );

  // Convert cents to dollars
  const totalEarnings = totalEarningsInCents / 100;

  // Calculate this month's earnings
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const thisMonthEarningsInCents = stories.reduce(
    (sum, story) => {
      const monthlyDonations = story.donations.filter(
        (d) => d.status === 'collected' && new Date(d.createdAt) >= thisMonthStart
      );
      return sum + monthlyDonations.reduce((dSum, d) => dSum + d.amountCents, 0);
    },
    0
  );

  // Convert cents to dollars
  const thisMonthEarnings = thisMonthEarningsInCents / 100;

  // Calculate last month's earnings for comparison
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const lastMonthEnd = new Date(thisMonthStart);
  lastMonthEnd.setSeconds(lastMonthEnd.getSeconds() - 1);

  const lastMonthEarningsInCents = stories.reduce(
    (sum, story) => {
      const monthlyDonations = story.donations.filter(
        (d) => {
          const date = new Date(d.createdAt);
          return d.status === 'collected' && date >= lastMonthStart && date <= lastMonthEnd;
        }
      );
      return sum + monthlyDonations.reduce((dSum, d) => dSum + d.amountCents, 0);
    },
    0
  );

  // Convert cents to dollars
  const lastMonthEarnings = lastMonthEarningsInCents / 100;

  // Calculate percentage change
  let monthlyChange = 0;
  if (lastMonthEarnings > 0) {
    monthlyChange = Number((((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100).toFixed(1));
  } else if (thisMonthEarnings > 0) {
    monthlyChange = 100;
  }

  // Format stories data with earnings
  const storiesWithEarnings = stories.map(story => {
    // Calculate earnings in cents (only collected payments)
    const storyEarningsInCents = story.donations
      .filter(donation => donation.status === 'collected' && new Date(donation.createdAt) >= startDate)
      .reduce((sum, donation) => sum + donation.amountCents, 0);

    // Convert cents to dollars
    const storyEarnings = storyEarningsInCents / 100;

    // Get genre name if available
    const genreName = story.genre?.name || "General";

    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      genreName: genreName,
      slug: story.slug || story.id, // Use slug if available, fallback to ID
      viewCount: viewCountMap.get(story.id) || 0,
      earnings: storyEarnings,
    };
  });

  // Sort stories by earnings (highest first)
  storiesWithEarnings.sort((a, b) => b.earnings - a.earnings);

  // Get earnings chart data
  const chartData = await getEarningsChartData(userId, timeRange);

  // Get total count of transactions for pagination
  const totalTransactions = await prisma.donation.count({
    where: {
      story: {
        authorId: userId,
      },
      status: 'collected',
      ...(timeRange !== 'all' && { createdAt: { gte: startDate } }),
    },
  });

  // Calculate pagination values
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  const totalPages = Math.ceil(totalTransactions / pageSize);
  const hasMore = page < totalPages;

  // Get individual donation transactions with donor information
  // Filter by time range if specified and apply pagination
  const donations = await prisma.donation.findMany({
    where: {
      story: {
        authorId: userId,
      },
      status: 'collected',
      ...(timeRange !== 'all' && { createdAt: { gte: startDate } }),
    },
    include: {
      donor: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
      story: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip,
    take,
  });

  // Format donation transactions
  const transactions = donations.map(donation => ({
    id: donation.id,
    donorId: donation.donorId,
    donorName: donation.donor.name || 'Anonymous',
    donorUsername: donation.donor.username,
    storyId: donation.storyId || undefined,
    storyTitle: donation.story?.title,
    storySlug: donation.story?.slug || donation.story?.id,
    amount: donation.amountCents / 100, // Convert cents to dollars
    message: donation.message || undefined,
    createdAt: donation.createdAt.toISOString(),
  }));

  return {
    totalEarnings,
    thisMonthEarnings,
    monthlyChange,
    stories: storiesWithEarnings,
    chartData,
    transactions,
    pagination: {
      page,
      pageSize,
      totalItems: totalTransactions,
      totalPages,
      hasMore: page < totalPages
    }
  };
}

export async function getEarningsChartData(userId: string, timeRange: string = '30days'): Promise<EarningsDataPoint[]> {
  // timeRange parameter is kept for API consistency but not used in this implementation


  const months = [];
  const today = new Date();

  // Generate last 7 months
  for (let i = 6; i >= 0; i--) {
    const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      name: month.toLocaleString('default', { month: 'short' }),
      date: month,
      nextMonth: new Date(month.getFullYear(), month.getMonth() + 1, 1)
    });
  }

  // Get all user's stories first to check if they have any
  const userStories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    select: {
      id: true,
    },
  });

  const userStoryIds = userStories.map(story => story.id);


  if (userStoryIds.length === 0) {
    // Return empty data if user has no stories
    return months.map(month => ({
      name: month.name,
      earnings: 0,
    }));
  }

  // Get all successful donations for this user's stories
  const donations = await prisma.donation.findMany({
    where: {
      storyId: { in: userStoryIds },
      status: 'collected', // Only include collected payments
    },
    select: {
      amountCents: true,
      createdAt: true,
    },
  });



  // Get earnings data for each month
  const earningsData: EarningsDataPoint[] = [];

  for (const month of months) {
    // Filter donations for this month
    const monthDonations = donations.filter(donation =>
      donation.createdAt >= month.date && donation.createdAt < month.nextMonth
    );

    // Sum up donation amounts for this month (in cents)
    const totalAmountInCents = monthDonations.reduce((sum, donation) => sum + donation.amountCents, 0);

    // Convert cents to dollars
    const earningsInDollars = totalAmountInCents / 100;

    earningsData.push({
      name: month.name,
      earnings: earningsInDollars,
    });
  }

  return earningsData;
}
