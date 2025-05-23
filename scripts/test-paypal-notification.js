/**
 * Test script to verify PayPal donation notification creation
 * 
 * This script helps test the notification creation for PayPal donations
 * by simulating the donation recording process.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationCreation() {
  try {
    console.log('🔍 Testing PayPal donation notification creation...\n');

    // Find a recent PayPal donation without a notification
    const recentDonation = await prisma.donation.findFirst({
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

    if (!recentDonation) {
      console.log('❌ No PayPal donations found in the database');
      return;
    }

    console.log('✅ Found PayPal donation:', {
      id: recentDonation.id,
      amount: recentDonation.amount,
      donor: recentDonation.donor.username || recentDonation.donor.name,
      recipient: recentDonation.recipient.username || recentDonation.recipient.name,
      story: recentDonation.story?.title || 'No story',
      createdAt: recentDonation.createdAt
    });

    // Check if notification already exists
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: recentDonation.recipientId,
        type: 'donation',
        content: {
          path: ['donationId'],
          equals: recentDonation.id
        }
      }
    });

    if (existingNotification) {
      console.log('✅ Notification already exists:', {
        id: existingNotification.id,
        title: existingNotification.title,
        message: existingNotification.message,
        createdAt: existingNotification.createdAt
      });
    } else {
      console.log('❌ No notification found for this donation');
      console.log('💡 This indicates the notification creation issue exists');
    }

    // Check all notifications for the recipient
    const allNotifications = await prisma.notification.findMany({
      where: {
        userId: recentDonation.recipientId,
        type: 'donation'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n📋 Recent donation notifications for recipient (${allNotifications.length} total):`);
    allNotifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. ${notification.title} - ${notification.message} (${notification.createdAt})`);
    });

    // Check all PayPal donations for the recipient
    const allPaypalDonations = await prisma.donation.findMany({
      where: {
        recipientId: recentDonation.recipientId,
        paymentMethod: 'paypal',
        status: 'succeeded'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n💰 Recent PayPal donations for recipient (${allPaypalDonations.length} total):`);
    allPaypalDonations.forEach((donation, index) => {
      console.log(`  ${index + 1}. $${(donation.amount / 100).toFixed(2)} - ${donation.createdAt} (ID: ${donation.id})`);
    });

    console.log('\n🔧 To fix the issue, ensure:');
    console.log('1. PAYPAL_WEBHOOK_ID is set in environment variables');
    console.log('2. PayPal webhook is properly configured');
    console.log('3. The record-paypal route creates notifications');
    console.log('4. The webhook handler processes both pending and succeeded donations');

  } catch (error) {
    console.error('❌ Error testing notification creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationCreation();
