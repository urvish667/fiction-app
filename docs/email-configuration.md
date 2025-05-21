# Email Configuration for FableSpace

This document explains how to configure email sending for the FableSpace application.

> **Note:** FableSpace has migrated from SMTP-based email sending to Azure Communication Service (ACS) Email. This document is kept for reference purposes. For the current email configuration, please refer to [Azure Communication Service Email Configuration](./azure-communication-service-email.md).

## Email Configuration (Legacy SMTP Method)

Previously, FableSpace used a real SMTP server for sending emails in both development and production environments.

### Legacy SMTP Configuration

If you need to revert to the SMTP method for any reason, add the following variables to your environment:

```
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_username
EMAIL_SERVER_PASSWORD=your_password
EMAIL_SERVER_SECURE=true  # Use 'true' for SSL/TLS
EMAIL_FROM=FableSpace <noreply@yourdomain.com>
```

### Supported Email Services (Legacy)

The SMTP method supports any SMTP service, including:

- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [Postmark](https://postmarkapp.com/)
- [Mailchimp Transactional](https://mailchimp.com/features/transactional-email/)
- [SMTP2GO](https://www.smtp2go.com/)

### SendGrid Example (Legacy)

If using SendGrid with the SMTP method, your configuration would look like:

```
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASSWORD=your_sendgrid_api_key
EMAIL_SERVER_SECURE=false
EMAIL_FROM=FableSpace <noreply@yourdomain.com>
```

## Email Templates

The application includes templates for:

1. **Verification Email** - Sent when a user signs up with email/password
2. **Password Reset Email** - Sent when a user requests a password reset
3. **Welcome Email** - Sent after a user verifies their email

These templates can be customized in `src/lib/email/email-templates.ts`.

## Development Testing with Ethereal

For development and testing, you can use [Ethereal](https://ethereal.email/) - a fake SMTP service that captures emails instead of sending them.

### Setting Up Ethereal Email

1. Run the setup script:
   ```bash
   node scripts/setup-email.js
   ```

2. Add the generated credentials to your `.env.local` file:
   ```
   ETHEREAL_EMAIL=your_generated_email@ethereal.email
   ETHEREAL_PASSWORD=your_generated_password
   ```

3. When emails are "sent" during development, you'll see a preview URL in the console that you can use to view the email.

## Troubleshooting

- If emails aren't being sent, check your SMTP configuration in the environment variables
- Verify that your email service is operational and accessible from your server
- Ensure your email service allows sending from the domain specified in `EMAIL_FROM`
- Some email services require domain verification before sending emails
- Check server logs for any error messages related to email sending
- For ProtonMail specifically, make sure you're using the correct authentication settings and port
- If using Ethereal for testing, make sure the credentials are correct and check the console for preview URLs
