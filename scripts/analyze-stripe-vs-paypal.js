/**
 * Analysis script to compare Stripe vs PayPal implementation
 * and identify potential issues with Stripe notification creation
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeStripeVsPayPal() {
  try {
    console.log('🔍 Analyzing Stripe vs PayPal implementation differences...\n');

    // Check all donations by payment method
    const donationStats = await prisma.donation.groupBy({
      by: ['paymentMethod', 'status'],
      _count: {
        id: true
      },
      orderBy: {
        paymentMethod: 'asc'
      }
    });

    console.log('📊 Donation Statistics by Payment Method:');
    donationStats.forEach(stat => {
      console.log(`   ${stat.paymentMethod || 'unknown'} (${stat.status}): ${stat._count.id} donations`);
    });

    // Check notification statistics
    const notificationStats = await prisma.notification.groupBy({
      by: ['type'],
      _count: {
        id: true
      },
      where: {
        type: 'donation'
      }
    });

    console.log('\n📊 Donation Notification Statistics:');
    notificationStats.forEach(stat => {
      console.log(`   ${stat.type}: ${stat._count.id} notifications`);
    });

    // Check users with different donation methods
    const userPaymentMethods = await prisma.user.groupBy({
      by: ['donationMethod'],
      _count: {
        id: true
      },
      where: {
        donationsEnabled: true
      }
    });

    console.log('\n📊 Users by Payment Method:');
    userPaymentMethods.forEach(method => {
      console.log(`   ${method.donationMethod || 'none'}: ${method._count.id} users`);
    });

    // Check for donations without stripePaymentIntentId
    const stripeDonationsWithoutIntentId = await prisma.donation.findMany({
      where: {
        paymentMethod: 'stripe',
        stripePaymentIntentId: null
      },
      take: 5
    });

    if (stripeDonationsWithoutIntentId.length > 0) {
      console.log(`\n⚠️  Found ${stripeDonationsWithoutIntentId.length} Stripe donations without payment intent ID:`);
      stripeDonationsWithoutIntentId.forEach((donation, index) => {
        console.log(`   ${index + 1}. ID: ${donation.id}, Status: ${donation.status}, Created: ${donation.createdAt}`);
      });
      console.log('   This indicates the webhook might not be updating donations properly.');
    }

    // Check for donations with stripePaymentIntentId but no notifications
    const stripeDonationsWithIntent = await prisma.donation.findMany({
      where: {
        paymentMethod: 'stripe',
        stripePaymentIntentId: { not: null },
        status: 'succeeded'
      },
      include: {
        donor: { select: { username: true, name: true } },
        recipient: { select: { username: true, name: true } }
      },
      take: 5
    });

    if (stripeDonationsWithIntent.length > 0) {
      console.log(`\n✅ Found ${stripeDonationsWithIntent.length} Stripe donations with payment intent ID:`);
      
      for (const donation of stripeDonationsWithIntent) {
        const notification = await prisma.notification.findFirst({
          where: {
            userId: donation.recipientId,
            type: 'donation',
            content: {
              path: ['donationId'],
              equals: donation.id
            }
          }
        });

        const hasNotification = notification ? '✅' : '❌';
        const donor = donation.donor.username || donation.donor.name || 'Anonymous';
        const recipient = donation.recipient.username || donation.recipient.name || 'Unknown';
        
        console.log(`   ${hasNotification} $${(donation.amount / 100).toFixed(2)} from ${donor} to ${recipient}`);
        console.log(`      Intent ID: ${donation.stripePaymentIntentId}`);
        console.log(`      Created: ${donation.createdAt}`);
      }
    }

    // Compare PayPal vs Stripe flows
    console.log('\n🔄 Flow Comparison:');
    console.log('\n   PayPal Flow:');
    console.log('   1. User pays via PayPal SDK');
    console.log('   2. Frontend calls /api/donations/record-paypal ✅ Creates notification');
    console.log('   3. PayPal webhook calls /api/webhooks/paypal ✅ Backup notification');
    console.log('   4. Both routes have duplicate prevention ✅');

    console.log('\n   Stripe Flow:');
    console.log('   1. User pays via Stripe Elements');
    console.log('   2. Payment processed by Stripe');
    console.log('   3. Stripe webhook calls /api/webhooks/stripe ✅ Creates notification');
    console.log('   4. No frontend recording route ⚠️  Single point of failure');

    console.log('\n🔍 Key Differences:');
    console.log('   ❌ Stripe has NO equivalent to /api/donations/record-paypal');
    console.log('   ❌ Stripe relies ONLY on webhooks for notification creation');
    console.log('   ❌ If Stripe webhook fails, NO notification is created');
    console.log('   ✅ PayPal has redundant notification creation (frontend + webhook)');

    console.log('\n💡 Potential Issues with Stripe:');
    console.log('   1. STRIPE_WEBHOOK_SECRET not configured');
    console.log('   2. Stripe webhook endpoint not receiving events');
    console.log('   3. Webhook signature verification failing');
    console.log('   4. Network issues preventing webhook delivery');
    console.log('   5. Stripe webhook handler throwing errors');

    console.log('\n🔧 Recommendations:');
    console.log('   1. Add immediate notification creation in Stripe payment flow');
    console.log('   2. Create /api/donations/record-stripe route similar to PayPal');
    console.log('   3. Add duplicate prevention in Stripe webhook');
    console.log('   4. Implement the same redundancy pattern as PayPal');

  } catch (error) {
    console.error('❌ Error analyzing Stripe vs PayPal:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
analyzeStripeVsPayPal();
