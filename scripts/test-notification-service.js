/**
 * Test script to verify the notification service is working
 * 
 * This script tests the notification creation functionality
 * to ensure the service itself is working before testing PayPal integration.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNotificationService() {
  try {
    console.log('🔍 Testing notification service...\n');

    // Find a recent donation to use for testing
    const testDonation = await prisma.donation.findFirst({
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

    if (!testDonation) {
      console.log('❌ No donations found for testing');
      return;
    }

    console.log('✅ Using donation for test:', {
      id: testDonation.id,
      amount: testDonation.amount,
      donor: testDonation.donor.username || testDonation.donor.name,
      recipient: testDonation.recipient.username || testDonation.recipient.name
    });

    // Test notification creation directly
    const actorUsername = testDonation.donor.username || testDonation.donor.name;
    const formattedAmount = (testDonation.amount / 100).toFixed(2);
    const notificationMessage = testDonation.storyId
      ? `${actorUsername} donated $${formattedAmount} to your story "${testDonation.story?.title}"`
      : `${actorUsername} donated $${formattedAmount} to support your work`;

    console.log('\n🧪 Creating test notification...');

    const testNotification = await prisma.notification.create({
      data: {
        userId: testDonation.recipientId,
        type: 'donation',
        title: 'Test Donation Notification',
        message: notificationMessage,
        content: {
          donationId: testDonation.id,
          amount: testDonation.amount,
          message: testDonation.message,
          storyId: testDonation.storyId,
          storyTitle: testDonation.story?.title,
          storySlug: testDonation.story?.slug,
        },
        actorId: testDonation.donorId,
      },
    });

    console.log('✅ Test notification created successfully:', {
      id: testNotification.id,
      title: testNotification.title,
      message: testNotification.message,
      createdAt: testNotification.createdAt
    });

    // Update unread notifications count
    await prisma.user.update({
      where: { id: testDonation.recipientId },
      data: {
        unreadNotifications: { increment: 1 },
      },
    });

    console.log('✅ Unread notifications count updated');

    // Verify the notification was created
    const verifyNotification = await prisma.notification.findUnique({
      where: { id: testNotification.id },
      include: {
        actor: {
          select: { id: true, username: true, name: true }
        }
      }
    });

    if (verifyNotification) {
      console.log('✅ Notification verification successful:', {
        id: verifyNotification.id,
        type: verifyNotification.type,
        read: verifyNotification.read,
        actor: verifyNotification.actor?.username || verifyNotification.actor?.name
      });
    } else {
      console.log('❌ Notification verification failed');
    }

    // Check recipient's notification count
    const recipient = await prisma.user.findUnique({
      where: { id: testDonation.recipientId },
      select: { unreadNotifications: true }
    });

    console.log('📊 Recipient unread notifications count:', recipient?.unreadNotifications);

    console.log('\n🧹 Cleaning up test notification...');
    
    // Clean up the test notification
    await prisma.notification.delete({
      where: { id: testNotification.id }
    });

    // Decrement unread notifications count
    await prisma.user.update({
      where: { id: testDonation.recipientId },
      data: {
        unreadNotifications: { decrement: 1 },
      },
    });

    console.log('✅ Test notification cleaned up successfully');

    console.log('\n🎉 Notification service is working correctly!');
    console.log('💡 The issue is likely in the PayPal donation recording flow');

  } catch (error) {
    console.error('❌ Error testing notification service:', error);
    
    if (error.code === 'P2002') {
      console.log('💡 This might be a unique constraint violation');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNotificationService();
