import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// Create a transporter using SMTP settings
async function createTransporter() {
  // Check if required email configuration is available
  if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) {
    console.error('Email server configuration is missing. Please check your environment variables.');
    throw new Error('Email server configuration is missing');
  }

  // Create and return the transporter with SMTP settings
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
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}
