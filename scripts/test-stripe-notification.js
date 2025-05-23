/**
 * Test script to verify Stripe donation notification creation
 * 
 * This script helps test the notification creation for Stripe donations
 * by checking existing donations and their notifications.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testStripeNotificationCreation() {
  try {
    console.log('🔍 Testing Stripe donation notification creation...\n');

    // Find recent Stripe donations
    const stripeDonations = await prisma.donation.findMany({
      where: {
        paymentMethod: 'stripe',
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
      },
      take: 10
    });

    console.log(`📊 Found ${stripeDonations.length} Stripe donations`);

    if (stripeDonations.length === 0) {
      console.log('❌ No Stripe donations found in the database');
      console.log('💡 This might indicate:');
      console.log('   - No Stripe donations have been made yet');
      console.log('   - Stripe is not properly configured');
      console.log('   - Users prefer PayPal over Stripe');
      return;
    }

    // Check notifications for each Stripe donation
    let donationsWithNotifications = 0;
    let donationsWithoutNotifications = 0;
    const missingNotifications = [];

    for (const donation of stripeDonations) {
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

      if (existingNotification) {
        donationsWithNotifications++;
      } else {
        donationsWithoutNotifications++;
        missingNotifications.push(donation);
      }
    }

    console.log(`✅ Donations with notifications: ${donationsWithNotifications}`);
    console.log(`❌ Donations without notifications: ${donationsWithoutNotifications}\n`);

    // Show recent Stripe donations
    console.log('📋 Recent Stripe donations:');
    stripeDonations.forEach((donation, index) => {
      const donor = donation.donor.username || donation.donor.name || 'Anonymous';
      const recipient = donation.recipient.username || donation.recipient.name || 'Unknown';
      const amount = (donation.amount / 100).toFixed(2);
      const story = donation.story?.title || 'General donation';
      const hasNotification = !missingNotifications.find(d => d.id === donation.id);
      const status = hasNotification ? '✅' : '❌';
      
      console.log(`  ${index + 1}. ${status} $${amount} from ${donor} to ${recipient} for "${story}" (${donation.createdAt.toISOString().split('T')[0]})`);
      console.log(`     Payment Intent: ${donation.stripePaymentIntentId || 'N/A'}`);
    });

    if (missingNotifications.length > 0) {
      console.log('\n❌ Donations missing notifications:');
      missingNotifications.forEach((donation, index) => {
        const donor = donation.donor.username || donation.donor.name || 'Anonymous';
        const recipient = donation.recipient.username || donation.recipient.name || 'Unknown';
        const amount = (donation.amount / 100).toFixed(2);
        
        console.log(`  ${index + 1}. $${amount} from ${donor} to ${recipient} (ID: ${donation.id})`);
        console.log(`     Created: ${donation.createdAt}`);
        console.log(`     Payment Intent: ${donation.stripePaymentIntentId || 'N/A'}`);
      });

      console.log('\n💡 Possible causes for missing Stripe notifications:');
      console.log('   - Stripe webhook not properly configured');
      console.log('   - STRIPE_WEBHOOK_SECRET environment variable missing');
      console.log('   - Webhook endpoint not receiving events');
      console.log('   - Notification creation failing in webhook handler');
    }

    // Check Stripe webhook configuration
    console.log('\n🔧 Stripe Configuration Check:');
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log(`   STRIPE_SECRET_KEY: ${stripeSecretKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`   STRIPE_WEBHOOK_SECRET: ${stripeWebhookSecret ? '✅ Set' : '❌ Missing'}`);

    if (!stripeWebhookSecret) {
      console.log('\n⚠️  STRIPE_WEBHOOK_SECRET is missing!');
      console.log('   This means Stripe webhooks cannot be verified and processed.');
      console.log('   Add STRIPE_WEBHOOK_SECRET to your environment variables.');
    }

    // Check if there are any pending Stripe donations
    const pendingStripeDonations = await prisma.donation.findMany({
      where: {
        paymentMethod: 'stripe',
        status: 'pending',
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    if (pendingStripeDonations.length > 0) {
      console.log(`\n⏳ Found ${pendingStripeDonations.length} pending Stripe donations:`);
      pendingStripeDonations.forEach((donation, index) => {
        console.log(`  ${index + 1}. $${(donation.amount / 100).toFixed(2)} - ${donation.createdAt} (ID: ${donation.id})`);
      });
      console.log('   These donations are waiting for webhook confirmation.');
    }

    console.log('\n🔧 To fix Stripe notification issues:');
    console.log('1. Ensure STRIPE_WEBHOOK_SECRET is set in environment variables');
    console.log('2. Configure Stripe webhook endpoint in Stripe Dashboard');
    console.log('3. Test webhook delivery using Stripe CLI or Dashboard');
    console.log('4. Check webhook handler logs for errors');
    console.log('5. Verify webhook events include payment_intent.succeeded');

  } catch (error) {
    console.error('❌ Error testing Stripe notification creation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testStripeNotificationCreation();
