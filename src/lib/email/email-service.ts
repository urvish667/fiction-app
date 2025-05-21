import { EmailClient } from '@azure/communication-email';
import { logError, logInfo } from '../error-logger';
import { randomUUID } from 'crypto';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Global EmailClient instance
let emailClient: EmailClient | null = null;

// Initialize the Azure Communication Service Email client
function getEmailClient(): EmailClient {
  if (!emailClient) {
    // Check if required email configuration is available
    if (!process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING) {
      logError('Azure Communication Service connection string is missing', { context: 'Creating email client' });
      throw new Error('Azure Communication Service connection string is missing');
    }

    // Create the EmailClient
    emailClient = new EmailClient(process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING);
    logInfo('Azure Communication Service Email client created', { context: 'Email service initialization' });
  }

  return emailClient;
}

// Send email function using Azure Communication Service
export async function sendEmail(options: EmailOptions) {
  try {
    // Get the email client
    const client = getEmailClient();

    // Generate a unique message ID for tracking
    const messageId = randomUUID();

    // Get sender address from environment or use default
    const senderAddress = process.env.AZURE_COMMUNICATION_SERVICE_SENDER_ADDRESS || process.env.EMAIL_FROM || 'donotreply@azurecomm.net';

    // Create the email message
    const message = {
      senderAddress,
      content: {
        subject: options.subject,
        plainText: options.text,
        html: options.html
      },
      recipients: {
        to: [
          {
            address: options.to
          }
        ]
      }
    };

    // Send the email
    const poller = await client.beginSend(message);

    // Wait for the operation to complete
    const result = await poller.pollUntilDone();

    // Log email info in development
    if (process.env.NODE_ENV !== 'production') {
      logInfo('Email sent using Azure Communication Service', {
        context: 'Sending email',
        messageId,
        status: result.status
      });
    }

    return {
      success: result.status === 'Succeeded',
      messageId
    };
  } catch (error) {
    logError('Error sending email with Azure Communication Service', { context: 'Sending email', error });
    return { success: false, error };
  }
}
