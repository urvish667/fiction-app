import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getPayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const url = `${process.env.PAYPAL_API_BASE}/v1/oauth2/token`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to get PayPal access token', { status: response.status, body: errorBody });
    throw new Error('Failed to authenticate with PayPal');
  }

  const data = await response.json();
  return data.access_token;
}

async function runPayPalPayout() {
  console.info('Starting PayPal payout job...');

  try {
    const collectedDonations = await prisma.donation.findMany({
      where: {
        status: 'collected',
        payoutId: null,
      },
      include: {
        recipient: {
          select: { id: true, email: true },
        },
      },
    });

    if (collectedDonations.length === 0) {
      console.info('No collected donations found for payout.');
      return;
    }

    const payoutsByRecipient = new Map();

    for (const donation of collectedDonations) {
      const recipientId = donation.recipientId;
      const recipientEmail = donation.recipient?.email;

      if (!recipientEmail) {
        console.warn(`Recipient for donation ${donation.id} has no email, skipping.`);
        continue;
      }

      if (!payoutsByRecipient.has(recipientId)) {
        payoutsByRecipient.set(recipientId, { totalAmountCents: 0, donations: [], recipientEmail });
      }
      const entry = payoutsByRecipient.get(recipientId);
      if (entry) {
        entry.totalAmountCents += donation.netAmountCents;
        entry.donations.push(donation);
      }
    }

    const accessToken = await getPayPalAccessToken();

    for (const [recipientId, data] of payoutsByRecipient.entries()) {
      const { totalAmountCents, donations, recipientEmail } = data;
      const MIN_PAYOUT_THRESHOLD_CENTS = 300;

      if (totalAmountCents < MIN_PAYOUT_THRESHOLD_CENTS) {
        console.info(`Recipient ${recipientId} total amount ${totalAmountCents / 100} is below payout threshold, skipping.`);
        continue;
      }

      const payout = await prisma.payout.create({
        data: {
          userId: recipientId,
          totalAmountCents,
          status: 'pending',
          method: 'PAYPAL_EMAIL',
        },
      });

      const payoutData = {
        sender_batch_header: {
          sender_batch_id: `FABLESPACE_PAYOUT_${payout.id}`,
          email_subject: 'You have a payout from FableSpace!',
          email_message: 'You have received a payout for your donations on FableSpace. Thank you for being a FableSpace author!',
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              value: (totalAmountCents / 100).toFixed(2),
              currency: 'USD',
            },
            receiver: recipientEmail,
            note: `Payout for ${donations.length} donations.`,
            sender_item_id: payout.id,
          },
        ],
      };

      try {
        const response = await fetch(`${process.env.PAYPAL_API_BASE}/v1/payments/payouts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payoutData),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(JSON.stringify(responseData));
        }

        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'paid_out',
            externalId: responseData.batch_header.payout_batch_id,
            completedAt: new Date(),
          },
        });

        await prisma.$transaction(
          donations.map((d) =>
            prisma.donation.update({
              where: { id: d.id },
              data: { payoutId: payout.id, paidOutAt: new Date() },
            })
          )
        );
        console.info(`Updated ${donations.length} donations with payoutId ${payout.id}`);
      } catch (error) {
        console.error(`Error processing payout for recipient ${recipientId}:`, error);
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'failed',
          },
        });
      }
    }
  } catch (error) {
    console.error('Error in PayPal payout job:', error);
  }

  console.info('PayPal payout job finished.');
}

runPayPalPayout().catch((e) => {
  console.error('Failed to run PayPal payout job', e);
  process.exit(1);
});
