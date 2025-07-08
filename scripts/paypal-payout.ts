import { prisma } from '@/lib/prisma';
import paypal from '@paypal/paypal-rest-sdk';
import { logger } from '@/lib/logger';

// Configure PayPal SDK
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox', //sandbox or live
  client_id: process.env.PAYPAL_CLIENT_ID || '',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || '',
});

async function runPayPalPayout() {
  logger.info('Starting PayPal payout job...');

  try {
    // 1. Select eligible donations
    const collectedDonations = await prisma.donation.findMany({
      where: {
        status: 'collected',
        payoutId: null,
      },
      include: {
        recipient: {
          select: { id: true, paypalEmail: true },
        },
      },
    });

    if (collectedDonations.length === 0) {
      logger.info('No collected donations found for payout.');
      return;
    }

    // 2. Group by recipient and sum netAmountCents
    const payoutsByRecipient = new Map<string, { totalAmountCents: number; donations: typeof collectedDonations }>();

    for (const donation of collectedDonations) {
      const recipientId = donation.recipientId;
      if (!recipientId) {
        logger.warn(`Donation ${donation.id} has no recipientId, skipping.`);
        continue;
      }

      const recipientPaypalEmail = donation.recipient?.paypalEmail;
      if (!recipientPaypalEmail) {
        logger.warn(`Recipient for donation ${donation.id} has no PayPal email, skipping.`);
        continue;
      }

      if (!payoutsByRecipient.has(recipientId)) {
        payoutsByRecipient.set(recipientId, { totalAmountCents: 0, donations: [] });
      }
      const entry = payoutsByRecipient.get(recipientId)!;
      entry.totalAmountCents += donation.netAmountCents;
      entry.donations.push(donation);
    }

    for (const [recipientId, data] of payoutsByRecipient.entries()) {
      const { totalAmountCents, donations } = data;
      const recipientPaypalEmail = donations[0].recipient?.paypalEmail; // All donations for this recipient will have the same email

      if (!recipientPaypalEmail) {
        logger.error(`Recipient ${recipientId} has no PayPal email despite checks, skipping payout.`);
        continue;
      }

      // Optional: implement minimum payout threshold (e.g. $5)
      const MIN_PAYOUT_THRESHOLD_CENTS = 500; // $5.00
      if (totalAmountCents < MIN_PAYOUT_THRESHOLD_CENTS) {
        logger.info(`Recipient ${recipientId} total amount ${totalAmountCents / 100} is below payout threshold, skipping.`);
        continue;
      }

      // 3. Create Payout record and call PayPal Payouts API
      try {
        const payout = await prisma.payout.create({
          data: {
            recipientId: recipientId,
            amountCents: totalAmountCents,
            processor: 'PAYPAL',
            status: 'pending',
          },
        });

        const create_payout_json = {
          sender_batch_header: {
            email_subject: 'You have a payout from FableSpace!',
            email_message: 'You have received a payout for your donations on FableSpace.',
            sender_batch_id: `FABLESPACE_PAYOUT_${payout.id}`,
          },
          items: [
            {
              recipient_type: 'EMAIL',
              receiver: recipientPaypalEmail,
              amount: {
                value: (totalAmountCents / 100).toFixed(2),
                currency: 'USD',
              },
              note: 'Thank you for being a FableSpace author!',
              sender_item_id: payout.id, // Link to our payout record
            },
          ],
        };

        paypal.payout.create(create_payout_json, true, async function (error: any, payoutResponse: any) {
          if (error) {
            logger.error('PayPal payout creation error:', error.response ? error.response.details : error);
            await prisma.payout.update({
              where: { id: payout.id },
              data: { status: 'failed', errorMessage: JSON.stringify(error.response || error) },
            });
          } else {
            logger.info('PayPal payout initiated successfully:', payoutResponse);
            await prisma.payout.update({
              where: { id: payout.id },
              data: {
                status: 'paid_out',
                paypalBatchId: payoutResponse.batch_header.payout_batch_id,
                completedAt: new Date(),
              },
            });

            // 4. Update Donation.payoutId and set paidOutAt
            await prisma.$transaction(
              donations.map((d) =>
                prisma.donation.update({
                  where: { id: d.id },
                  data: { payoutId: payout.id, paidOutAt: new Date() },
                })
              )
            );
            logger.info(`Updated ${donations.length} donations with payoutId ${payout.id}`);
          }
        });
      } catch (error) {
        logger.error(`Error processing payout for recipient ${recipientId}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in PayPal payout job:', error);
  }

  logger.info('PayPal payout job finished.');
}

runPayPalPayout();
