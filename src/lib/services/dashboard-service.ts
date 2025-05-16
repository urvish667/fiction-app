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
  const totalEarningsInCents = stories.reduce(
    (sum, story) => sum + story.donations.reduce((dSum, d) => dSum + d.amount, 0),
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

  // Get previous period earnings
  const previousPeriodEarnings = await prisma.donation.aggregate({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: previousStartDate,
        lt: previousEndDate,
      },
    },
    _sum: {
      amount: true,
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

  // Get current period earnings
  const currentPeriodEarnings = await prisma.donation.aggregate({
    where: {
      story: {
        authorId: userId,
      },
      createdAt: {
        gte: startDate,
      },
    },
    _sum: {
      amount: true,
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
  const currentEarnings = (currentPeriodEarnings._sum.amount || 0) / 100;
  const previousEarnings = (previousPeriodEarnings._sum.amount || 0) / 100;

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
  // Determine the order by field based on sortBy parameter
  let orderBy: any = {};

  // For reads, we'll need to sort after fetching since we're using StoryView
  if (sortBy === 'reads') {
    orderBy = {
      updatedAt: "desc", // Default ordering until we apply the view count sort
    };
  } else if (sortBy === 'likes') {
    orderBy = {
      likes: {
        _count: "desc",
      },
    };
  } else if (sortBy === 'comments') {
    orderBy = {
      comments: {
        _count: "desc",
      },
    };
  } else if (sortBy === 'earnings') {
    // For earnings, we'll need to sort after fetching since it's calculated
    orderBy = {
      updatedAt: "desc",
    };
  } else {
    // Default to reads
    orderBy = {
      views: {
        _count: "desc",
      },
    };
  }

  // Get the user's stories
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
    orderBy,
    take: limit,
  });

  // Get view counts for each story using the optimized ViewService with combined story + chapter views
  const storyIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds, timeRange);

  // Format stories data
  let formattedStories: DashboardStory[] = stories.map(story => {
    // Calculate earnings in cents
    const storyEarningsInCents = story.donations.reduce((sum, donation) => sum + donation.amount, 0);

    // Convert cents to dollars
    const storyEarnings = storyEarningsInCents / 100;

    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      reads: viewCountMap.get(story.id) || 0,
      likes: story._count.likes,
      comments: story._count.comments,
      date: story.updatedAt.toISOString(),
      earnings: storyEarnings,
    };
  });

  // Apply custom sorting for reads and earnings
  if (sortBy === 'reads') {
    formattedStories = formattedStories.sort((a, b) => b.reads - a.reads).slice(0, limit);
  } else if (sortBy === 'earnings') {
    formattedStories = formattedStories.sort((a, b) => b.earnings - a.earnings).slice(0, limit);
  }

  return formattedStories;
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
 * @returns Array of user stories with detailed information
 */
export async function getUserStories(userId: string) {
  // Get all stories for the user
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      _count: {
        select: {
          likes: true,
          comments: true,
          chapters: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get view counts for each story using the optimized ViewService with combined story + chapter views
  const storyIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds);

  // Format stories data
  const formattedStories = stories.map(story => {
    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      status: story.status,
      viewCount: viewCountMap.get(story.id) || 0,
      reads: viewCountMap.get(story.id) || 0, // Keep reads for backward compatibility
      likes: story._count.likes,
      comments: story._count.comments,
      chapters: story._count.chapters, // Renamed from chaptersCount to match API expectation
      chaptersCount: story._count.chapters, // Keep for backward compatibility
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
 * @returns Earnings data including total, monthly, and per story
 */
export async function getEarningsData(userId: string, timeRange: string = '30days') {
  // Calculate date ranges based on the timeRange parameter
  calculateDateRanges(timeRange); // Not used directly but kept for consistency

  // Get the user's stories
  const stories = await prisma.story.findMany({
    where: {
      authorId: userId,
    },
    include: {
      donations: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get view counts for each story using the optimized ViewService with combined story + chapter views
  const storyIds = stories.map(story => story.id);
  const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds);

  // Calculate total earnings (all time)
  const totalEarningsInCents = stories.reduce(
    (sum, story) => sum + story.donations.reduce((dSum, d) => dSum + d.amount, 0),
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
        (d) => new Date(d.createdAt) >= thisMonthStart
      );
      return sum + monthlyDonations.reduce((dSum, d) => dSum + d.amount, 0);
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
          return date >= lastMonthStart && date <= lastMonthEnd;
        }
      );
      return sum + monthlyDonations.reduce((dSum, d) => dSum + d.amount, 0);
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
    // Calculate earnings in cents
    const storyEarningsInCents = story.donations.reduce((sum, donation) => sum + donation.amount, 0);

    // Convert cents to dollars
    const storyEarnings = storyEarningsInCents / 100;

    return {
      id: story.id,
      title: story.title,
      genre: story.genreId || "",
      viewCount: viewCountMap.get(story.id) || 0,
      reads: viewCountMap.get(story.id) || 0, // Keep reads for backward compatibility
      earnings: storyEarnings,
    };
  });

  // Sort stories by earnings (highest first)
  storiesWithEarnings.sort((a, b) => b.earnings - a.earnings);

  // Get earnings chart data
  const chartData = await getEarningsChartData(userId, timeRange);

  return {
    totalEarnings,
    thisMonthEarnings,
    monthlyChange,
    stories: storiesWithEarnings,
    chartData,
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

  // Get all donations for this user's stories
  const donations = await prisma.donation.findMany({
    where: {
      storyId: { in: userStoryIds },
    },
    select: {
      amount: true,
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
    const totalAmountInCents = monthDonations.reduce((sum, donation) => sum + donation.amount, 0);

    // Convert cents to dollars
    const earningsInDollars = totalAmountInCents / 100;

    earningsData.push({
      name: month.name,
      earnings: earningsInDollars,
    });
  }

  return earningsData;
}
