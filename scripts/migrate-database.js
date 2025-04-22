const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define source and target database URLs
const SOURCE_DB_URL = "postgresql://postgres:root@18.142.239.93:5432/fablespace_db";
const TARGET_DB_URL = process.env.DATABASE_URL;

// Create Prisma clients for source and target databases
const sourcePrisma = new PrismaClient({
  datasources: {
    db: {
      url: SOURCE_DB_URL,
    },
  },
});

const targetPrisma = new PrismaClient({
  datasources: {
    db: {
      url: TARGET_DB_URL,
    },
  },
});

// Tables to migrate (excluding Genre and Tag)
const TABLES_TO_MIGRATE = [
  'Account',
  'Session',
  'User',
  'VerificationToken',
  'PasswordResetToken',
  'Notification',
  'Story',
  'Chapter',
  'Comment',
  'Like',
  'Bookmark',
  'Follow',
  'Language',
  'Donation',
  'StoryView',
  'ChapterView',
  'ReadingProgress',
  'CommentLike',
  'StoryRecommendation'
];

// Helper function to chunk array into smaller pieces
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Main migration function
async function migrateData() {
  console.log('Starting database migration...');
  console.log(`Source: ${SOURCE_DB_URL}`);
  console.log(`Target: ${TARGET_DB_URL}`);

  try {
    // Migrate Languages first (needed for Story references)
    console.log('\nMigrating Languages...');
    const languages = await sourcePrisma.language.findMany();
    console.log(`Found ${languages.length} languages`);

    for (const language of languages) {
      try {
        await targetPrisma.language.upsert({
          where: { id: language.id },
          update: language,
          create: language,
        });
      } catch (error) {
        console.error(`Error migrating language ${language.id}:`, error.message);
      }
    }

    // Migrate Users
    console.log('\nMigrating Users...');
    const users = await sourcePrisma.user.findMany();
    console.log(`Found ${users.length} users`);

    const userChunks = chunkArray(users, 50);
    for (const [index, chunk] of userChunks.entries()) {
      console.log(`Processing user chunk ${index + 1}/${userChunks.length}...`);
      await Promise.all(
        chunk.map(async (user) => {
          try {
            await targetPrisma.user.upsert({
              where: { id: user.id },
              update: user,
              create: user,
            });
          } catch (error) {
            console.error(`Error migrating user ${user.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Accounts
    console.log('\nMigrating Accounts...');
    const accounts = await sourcePrisma.account.findMany();
    console.log(`Found ${accounts.length} accounts`);

    const accountChunks = chunkArray(accounts, 50);
    for (const [index, chunk] of accountChunks.entries()) {
      console.log(`Processing account chunk ${index + 1}/${accountChunks.length}...`);
      await Promise.all(
        chunk.map(async (account) => {
          try {
            await targetPrisma.account.upsert({
              where: { id: account.id },
              update: account,
              create: account,
            });
          } catch (error) {
            console.error(`Error migrating account ${account.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Sessions
    console.log('\nMigrating Sessions...');
    const sessions = await sourcePrisma.session.findMany();
    console.log(`Found ${sessions.length} sessions`);

    const sessionChunks = chunkArray(sessions, 50);
    for (const [index, chunk] of sessionChunks.entries()) {
      console.log(`Processing session chunk ${index + 1}/${sessionChunks.length}...`);
      await Promise.all(
        chunk.map(async (session) => {
          try {
            await targetPrisma.session.upsert({
              where: { id: session.id },
              update: session,
              create: session,
            });
          } catch (error) {
            console.error(`Error migrating session ${session.id}:`, error.message);
          }
        })
      );
    }

    // Migrate VerificationTokens
    console.log('\nMigrating VerificationTokens...');
    const verificationTokens = await sourcePrisma.verificationToken.findMany();
    console.log(`Found ${verificationTokens.length} verification tokens`);

    for (const token of verificationTokens) {
      try {
        await targetPrisma.verificationToken.upsert({
          where: {
            identifier_token: {
              identifier: token.identifier,
              token: token.token
            }
          },
          update: token,
          create: token,
        });
      } catch (error) {
        console.error(`Error migrating verification token:`, error.message);
      }
    }

    // Migrate PasswordResetTokens
    console.log('\nMigrating PasswordResetTokens...');
    const passwordResetTokens = await sourcePrisma.passwordResetToken.findMany();
    console.log(`Found ${passwordResetTokens.length} password reset tokens`);

    for (const token of passwordResetTokens) {
      try {
        await targetPrisma.passwordResetToken.upsert({
          where: {
            identifier_token: {
              identifier: token.identifier,
              token: token.token
            }
          },
          update: token,
          create: token,
        });
      } catch (error) {
        console.error(`Error migrating password reset token:`, error.message);
      }
    }

    // Migrate Stories
    console.log('\nMigrating Stories...');
    const stories = await sourcePrisma.story.findMany();
    console.log(`Found ${stories.length} stories`);

    const storyChunks = chunkArray(stories, 20);
    for (const [index, chunk] of storyChunks.entries()) {
      console.log(`Processing story chunk ${index + 1}/${storyChunks.length}...`);
      await Promise.all(
        chunk.map(async (story) => {
          try {
            // Remove genreId as we're not migrating genres
            const { genreId, ...storyData } = story;
            await targetPrisma.story.upsert({
              where: { id: story.id },
              update: storyData,
              create: storyData,
            });
          } catch (error) {
            console.error(`Error migrating story ${story.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Chapters
    console.log('\nMigrating Chapters...');
    const chapters = await sourcePrisma.chapter.findMany();
    console.log(`Found ${chapters.length} chapters`);

    const chapterChunks = chunkArray(chapters, 20);
    for (const [index, chunk] of chapterChunks.entries()) {
      console.log(`Processing chapter chunk ${index + 1}/${chapterChunks.length}...`);
      await Promise.all(
        chunk.map(async (chapter) => {
          try {
            await targetPrisma.chapter.upsert({
              where: { id: chapter.id },
              update: chapter,
              create: chapter,
            });
          } catch (error) {
            console.error(`Error migrating chapter ${chapter.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Comments
    console.log('\nMigrating Comments...');
    const comments = await sourcePrisma.comment.findMany();
    console.log(`Found ${comments.length} comments`);

    // First migrate comments without parents
    const rootComments = comments.filter(c => !c.parentId);
    const childComments = comments.filter(c => c.parentId);

    console.log(`Migrating ${rootComments.length} root comments...`);
    // Process root comments sequentially to avoid race conditions
    for (const comment of rootComments) {
      try {
        // Check if the story exists in the target database
        const storyExists = await targetPrisma.story.findUnique({
          where: { id: comment.storyId },
        });

        if (!storyExists) {
          console.log(`Skipping comment ${comment.id} because story ${comment.storyId} does not exist in target database`);
          continue;
        }

        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: comment.userId },
        });

        if (!userExists) {
          console.log(`Skipping comment ${comment.id} because user ${comment.userId} does not exist in target database`);
          continue;
        }

        await targetPrisma.comment.upsert({
          where: { id: comment.id },
          update: comment,
          create: comment,
        });
        console.log(`Migrated root comment ${comment.id}`);
      } catch (error) {
        console.error(`Error migrating comment ${comment.id}:`, error.message);
      }
    }

    console.log(`Migrating ${childComments.length} child comments...`);
    // Sort child comments by their parent IDs to ensure parents are migrated before children
    const sortedChildComments = [...childComments].sort((a, b) => {
      // If a's parent is a root comment and b's isn't, a comes first
      const aParentIsRoot = rootComments.some(rc => rc.id === a.parentId);
      const bParentIsRoot = rootComments.some(rc => rc.id === b.parentId);

      if (aParentIsRoot && !bParentIsRoot) return -1;
      if (!aParentIsRoot && bParentIsRoot) return 1;

      // Otherwise, sort by parent ID
      return a.parentId.localeCompare(b.parentId);
    });

    // Process child comments sequentially to ensure proper parent-child relationships
    for (const comment of sortedChildComments) {
      try {
        // Check if the parent comment exists in the target database
        const parentExists = await targetPrisma.comment.findUnique({
          where: { id: comment.parentId },
        });

        if (!parentExists) {
          console.log(`Skipping comment ${comment.id} because parent comment ${comment.parentId} does not exist in target database`);
          continue;
        }

        // Check if the story exists in the target database
        const storyExists = await targetPrisma.story.findUnique({
          where: { id: comment.storyId },
        });

        if (!storyExists) {
          console.log(`Skipping comment ${comment.id} because story ${comment.storyId} does not exist in target database`);
          continue;
        }

        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: comment.userId },
        });

        if (!userExists) {
          console.log(`Skipping comment ${comment.id} because user ${comment.userId} does not exist in target database`);
          continue;
        }

        await targetPrisma.comment.upsert({
          where: { id: comment.id },
          update: comment,
          create: comment,
        });
        console.log(`Migrated child comment ${comment.id}`);
      } catch (error) {
        console.error(`Error migrating comment ${comment.id}:`, error.message);
      }
    }

    // Migrate Likes
    console.log('\nMigrating Likes...');
    const likes = await sourcePrisma.like.findMany();
    console.log(`Found ${likes.length} likes`);

    const likeChunks = chunkArray(likes, 100);
    for (const [index, chunk] of likeChunks.entries()) {
      console.log(`Processing like chunk ${index + 1}/${likeChunks.length}...`);
      await Promise.all(
        chunk.map(async (like) => {
          try {
            await targetPrisma.like.upsert({
              where: { id: like.id },
              update: like,
              create: like,
            });
          } catch (error) {
            console.error(`Error migrating like ${like.id}:`, error.message);
          }
        })
      );
    }

    // Migrate CommentLikes
    console.log('\nMigrating CommentLikes...');
    const commentLikes = await sourcePrisma.commentLike.findMany();
    console.log(`Found ${commentLikes.length} comment likes`);

    // Process comment likes sequentially to ensure related records exist
    for (const commentLike of commentLikes) {
      try {
        // Check if the comment exists in the target database
        const commentExists = await targetPrisma.comment.findUnique({
          where: { id: commentLike.commentId },
        });

        if (!commentExists) {
          console.log(`Skipping comment like ${commentLike.id} because comment ${commentLike.commentId} does not exist in target database`);
          continue;
        }

        // Check if the user exists in the target database
        const userExists = await targetPrisma.user.findUnique({
          where: { id: commentLike.userId },
        });

        if (!userExists) {
          console.log(`Skipping comment like ${commentLike.id} because user ${commentLike.userId} does not exist in target database`);
          continue;
        }

        await targetPrisma.commentLike.upsert({
          where: { id: commentLike.id },
          update: commentLike,
          create: commentLike,
        });
      } catch (error) {
        console.error(`Error migrating comment like ${commentLike.id}:`, error.message);
      }
    }

    // Migrate Bookmarks
    console.log('\nMigrating Bookmarks...');
    const bookmarks = await sourcePrisma.bookmark.findMany();
    console.log(`Found ${bookmarks.length} bookmarks`);

    const bookmarkChunks = chunkArray(bookmarks, 100);
    for (const [index, chunk] of bookmarkChunks.entries()) {
      console.log(`Processing bookmark chunk ${index + 1}/${bookmarkChunks.length}...`);
      await Promise.all(
        chunk.map(async (bookmark) => {
          try {
            await targetPrisma.bookmark.upsert({
              where: { id: bookmark.id },
              update: bookmark,
              create: bookmark,
            });
          } catch (error) {
            console.error(`Error migrating bookmark ${bookmark.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Follows
    console.log('\nMigrating Follows...');
    const follows = await sourcePrisma.follow.findMany();
    console.log(`Found ${follows.length} follows`);

    const followChunks = chunkArray(follows, 100);
    for (const [index, chunk] of followChunks.entries()) {
      console.log(`Processing follow chunk ${index + 1}/${followChunks.length}...`);
      await Promise.all(
        chunk.map(async (follow) => {
          try {
            await targetPrisma.follow.upsert({
              where: { id: follow.id },
              update: follow,
              create: follow,
            });
          } catch (error) {
            console.error(`Error migrating follow ${follow.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Donations
    console.log('\nMigrating Donations...');
    const donations = await sourcePrisma.donation.findMany();
    console.log(`Found ${donations.length} donations`);

    const donationChunks = chunkArray(donations, 50);
    for (const [index, chunk] of donationChunks.entries()) {
      console.log(`Processing donation chunk ${index + 1}/${donationChunks.length}...`);
      await Promise.all(
        chunk.map(async (donation) => {
          try {
            await targetPrisma.donation.upsert({
              where: { id: donation.id },
              update: donation,
              create: donation,
            });
          } catch (error) {
            console.error(`Error migrating donation ${donation.id}:`, error.message);
          }
        })
      );
    }

    // Migrate StoryViews
    console.log('\nMigrating StoryViews...');
    const storyViews = await sourcePrisma.storyView.findMany();
    console.log(`Found ${storyViews.length} story views`);

    const storyViewChunks = chunkArray(storyViews, 200);
    for (const [index, chunk] of storyViewChunks.entries()) {
      console.log(`Processing story view chunk ${index + 1}/${storyViewChunks.length}...`);
      await Promise.all(
        chunk.map(async (view) => {
          try {
            await targetPrisma.storyView.upsert({
              where: { id: view.id },
              update: view,
              create: view,
            });
          } catch (error) {
            console.error(`Error migrating story view ${view.id}:`, error.message);
          }
        })
      );
    }

    // Migrate ChapterViews
    console.log('\nMigrating ChapterViews...');
    const chapterViews = await sourcePrisma.chapterView.findMany();
    console.log(`Found ${chapterViews.length} chapter views`);

    const chapterViewChunks = chunkArray(chapterViews, 200);
    for (const [index, chunk] of chapterViewChunks.entries()) {
      console.log(`Processing chapter view chunk ${index + 1}/${chapterViewChunks.length}...`);
      await Promise.all(
        chunk.map(async (view) => {
          try {
            await targetPrisma.chapterView.upsert({
              where: { id: view.id },
              update: view,
              create: view,
            });
          } catch (error) {
            console.error(`Error migrating chapter view ${view.id}:`, error.message);
          }
        })
      );
    }

    // Migrate ReadingProgress
    console.log('\nMigrating ReadingProgress...');
    const readingProgresses = await sourcePrisma.readingProgress.findMany();
    console.log(`Found ${readingProgresses.length} reading progresses`);

    const readingProgressChunks = chunkArray(readingProgresses, 100);
    for (const [index, chunk] of readingProgressChunks.entries()) {
      console.log(`Processing reading progress chunk ${index + 1}/${readingProgressChunks.length}...`);
      await Promise.all(
        chunk.map(async (progress) => {
          try {
            await targetPrisma.readingProgress.upsert({
              where: { id: progress.id },
              update: progress,
              create: progress,
            });
          } catch (error) {
            console.error(`Error migrating reading progress ${progress.id}:`, error.message);
          }
        })
      );
    }

    // Migrate Notifications
    console.log('\nMigrating Notifications...');
    const notifications = await sourcePrisma.notification.findMany();
    console.log(`Found ${notifications.length} notifications`);

    const notificationChunks = chunkArray(notifications, 100);
    for (const [index, chunk] of notificationChunks.entries()) {
      console.log(`Processing notification chunk ${index + 1}/${notificationChunks.length}...`);
      await Promise.all(
        chunk.map(async (notification) => {
          try {
            await targetPrisma.notification.upsert({
              where: { id: notification.id },
              update: notification,
              create: notification,
            });
          } catch (error) {
            console.error(`Error migrating notification ${notification.id}:`, error.message);
          }
        })
      );
    }

    // Migrate StoryRecommendations if they exist
    try {
      console.log('\nMigrating StoryRecommendations...');
      const storyRecommendations = await sourcePrisma.storyRecommendation.findMany();
      console.log(`Found ${storyRecommendations.length} story recommendations`);

      const recommendationChunks = chunkArray(storyRecommendations, 100);
      for (const [index, chunk] of recommendationChunks.entries()) {
        console.log(`Processing recommendation chunk ${index + 1}/${recommendationChunks.length}...`);
        await Promise.all(
          chunk.map(async (recommendation) => {
            try {
              await targetPrisma.storyRecommendation.upsert({
                where: { id: recommendation.id },
                update: recommendation,
                create: recommendation,
              });
            } catch (error) {
              console.error(`Error migrating story recommendation ${recommendation.id}:`, error.message);
            }
          })
        );
      }
    } catch (error) {
      console.log('StoryRecommendation table not found or error occurred:', error.message);
    }

    console.log('\nMigration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    // Disconnect from both databases
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// Run the migration
migrateData().catch(console.error);
