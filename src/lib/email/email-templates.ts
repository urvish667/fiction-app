interface VerificationEmailData {
  username?: string;
  verificationUrl: string;
}

interface PasswordResetEmailData {
  username?: string;
  resetUrl: string;
}

interface WelcomeEmailData {
  username?: string;
  loginUrl: string;
}

// Verification Email Template
export function getVerificationEmailTemplate(data: VerificationEmailData) {
  const greeting = data.username ? `Hello ${data.username},` : 'Hello,';
  
  return {
    subject: 'Verify your FableSpace account',
    text: `
${greeting}

Thank you for signing up for FableSpace! Please verify your email address by clicking the link below:

${data.verificationUrl}

This link will expire in 24 hours.

If you did not sign up for FableSpace, please ignore this email.

Best regards,
The FableSpace Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your FableSpace account</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FableSpace</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Thank you for signing up for FableSpace! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center;">
        <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">${data.verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not sign up for FableSpace, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} FableSpace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

// Password Reset Email Template
export function getPasswordResetEmailTemplate(data: PasswordResetEmailData) {
  const greeting = data.username ? `Hello ${data.username},` : 'Hello,';
  
  return {
    subject: 'Reset your FableSpace password',
    text: `
${greeting}

We received a request to reset your password for your FableSpace account. Click the link below to reset your password:

${data.resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.

Best regards,
The FableSpace Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your FableSpace password</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FableSpace</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>We received a request to reset your password for your FableSpace account. Click the button below to reset your password:</p>
      <div style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px;">${data.resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} FableSpace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}

// Welcome Email Template (sent after verification)
export function getWelcomeEmailTemplate(data: WelcomeEmailData) {
  const greeting = data.username ? `Hello ${data.username},` : 'Hello,';
  
  return {
    subject: 'Welcome to FableSpace!',
    text: `
${greeting}

Thank you for verifying your email address. Your FableSpace account is now active!

You can now log in and start sharing your stories:
${data.loginUrl}

Best regards,
The FableSpace Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FableSpace!</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    .header h1 {
      color: #4f46e5;
      margin: 0;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
    }
    .button {
      display: inline-block;
      background-color: #4f46e5;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>FableSpace</h1>
    </div>
    <div class="content">
      <p>${greeting}</p>
      <p>Thank you for verifying your email address. Your FableSpace account is now active!</p>
      <p>You can now log in and start sharing your stories:</p>
      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="button">Log In to FableSpace</a>
      </div>
      <p>We're excited to have you join our community of storytellers and readers.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} FableSpace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
  };
}
