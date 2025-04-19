import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create a transporter based on environment
async function createTransporter() {
  // For production, use actual SMTP settings
  if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: process.env.EMAIL_SERVER_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }

  // For development, use Ethereal (fake SMTP service)
  const etherealUser = process.env.ETHEREAL_EMAIL;
  const etherealPass = process.env.ETHEREAL_PASSWORD;

  if (!etherealUser || !etherealPass) {
    console.warn('Ethereal credentials not found. Creating a new test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('Created test account:', testAccount.user);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: etherealUser,
      pass: etherealPass,
    },
  });
}

// Send email function
export async function sendEmail(options: EmailOptions) {
  try {
    const transporter = await createTransporter();

    const from = process.env.EMAIL_FROM || 'FableSpace <noreply@fablespace.com>';

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    // Log email info in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Email sent:', info);

      // If using Ethereal, provide preview URL
      if (info.messageId && info.envelope && info.envelope.from?.includes('ethereal.email')) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Create Ethereal test account (for development)
export async function createTestAccount() {
  try {
    const testAccount = await nodemailer.createTestAccount();

    console.log('Ethereal Email Test Account:');
    console.log('- Email:', testAccount.user);
    console.log('- Password:', testAccount.pass);

    // Set environment variables for the current process
    process.env.ETHEREAL_EMAIL = testAccount.user;
    process.env.ETHEREAL_PASSWORD = testAccount.pass;

    return testAccount;
  } catch (error) {
    console.error('Error creating test account:', error);
    return null;
  }
}
