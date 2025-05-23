/**
 * Script to create missing notifications for existing PayPal donations
 *
 * This script finds PayPal donations that don't have notifications
 * and creates them retroactively.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDonationNotification(params) {
  const { recipientId, actorId, actorUsername, donationId, amount, message, storyId, storyTitle, storySlug } = params;

  const formattedAmount = (amount / 100).toFixed(2);
  const notificationMessage = storyId
    ? `${actorUsername} donated $${formattedAmount} to your story "${storyTitle}"`
    : `${actorUsername} donated $${formattedAmount} to support your work`;

  return prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'donation',
      title: 'New Donation Received!',
      message: notificationMessage,
      content: {
        donationId,
        amount,
        message,
        storyId,
        storyTitle,
        storySlug,
      },
      actorId,
    },
  });
}

async function fixMissingPayPalNotifications() {
  try {
    console.log('🔍 Finding PayPal donations without notifications...\n');

    // Find all successful PayPal donations
    const paypalDonations = await prisma.donation.findMany({
      where: {
        paymentMethod: 'paypal',
        status: 'succeeded',
      },
      include: {
        donor: {
          select: { id: true, username: true, name: true }
        },
        recipient: {
          select: { id: true, username: true, name: true }
        },
        story: {
          select: { id: true, title: true, slug: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Found ${paypalDonations.length} PayPal donations`);

    if (paypalDonations.length === 0) {
      console.log('✅ No PayPal donations found');
      return;
    }

    // Check which donations already have notifications
    const donationsWithoutNotifications = [];

    for (const donation of paypalDonations) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: donation.recipientId,
          type: 'donation',
          content: {
            path: ['donationId'],
            equals: donation.id
          }
        }
      });

      if (!existingNotification) {
        donationsWithoutNotifications.push(donation);
      }
    }

    console.log(`❌ Found ${donationsWithoutNotifications.length} donations without notifications`);
    console.log(`✅ Found ${paypalDonations.length - donationsWithoutNotifications.length} donations with notifications\n`);

    if (donationsWithoutNotifications.length === 0) {
      console.log('🎉 All PayPal donations already have notifications!');
      return;
    }

    // Ask for confirmation before creating notifications
    console.log('📋 Donations that need notifications:');
    donationsWithoutNotifications.forEach((donation, index) => {
      const donor = donation.donor.username || donation.donor.name || 'Anonymous';
      const recipient = donation.recipient.username || donation.recipient.name || 'Unknown';
      const amount = (donation.amount / 100).toFixed(2);
      const story = donation.story?.title || 'General donation';

      console.log(`  ${index + 1}. $${amount} from ${donor} to ${recipient} for "${story}" (${donation.createdAt.toISOString().split('T')[0]})`);
    });

    console.log('\n⚠️  This will create notifications for the above donations.');
    console.log('💡 Run with --dry-run to see what would be created without actually creating them.\n');

    const isDryRun = process.argv.includes('--dry-run');

    if (isDryRun) {
      console.log('🧪 DRY RUN MODE - No notifications will be created');
      return;
    }

    // Create notifications for donations without them
    let successCount = 0;
    let errorCount = 0;

    for (const donation of donationsWithoutNotifications) {
      try {
        const actorUsername = donation.donor.username || donation.donor.name || 'Anonymous';

        const notification = await createDonationNotification({
          recipientId: donation.recipientId,
          actorId: donation.donorId,
          actorUsername: actorUsername,
          donationId: donation.id,
          amount: donation.amount,
          message: donation.message || undefined,
          storyId: donation.storyId || undefined,
          storyTitle: donation.story?.title,
          storySlug: donation.story?.slug,
        });

        // Update unread notifications count
        await prisma.user.update({
          where: { id: donation.recipientId },
          data: {
            unreadNotifications: { increment: 1 },
          },
        });

        console.log(`✅ Created notification for donation ${donation.id} (${actorUsername} → ${donation.recipient.username || donation.recipient.name})`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to create notification for donation ${donation.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Completed! Created ${successCount} notifications`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} notifications failed to create`);
    }

    // Verify the fix
    console.log('\n🔍 Verifying the fix...');
    const remainingDonationsWithoutNotifications = [];

    for (const donation of paypalDonations) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: donation.recipientId,
          type: 'donation',
          content: {
            path: ['donationId'],
            equals: donation.id
          }
        }
      });

      if (!existingNotification) {
        remainingDonationsWithoutNotifications.push(donation);
      }
    }

    if (remainingDonationsWithoutNotifications.length === 0) {
      console.log('✅ All PayPal donations now have notifications!');
    } else {
      console.log(`❌ ${remainingDonationsWithoutNotifications.length} donations still missing notifications`);
    }

  } catch (error) {
    console.error('❌ Error fixing missing notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixMissingPayPalNotifications();
