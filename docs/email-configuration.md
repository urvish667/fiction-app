# Email Configuration for FableSpace

This document explains how to configure email sending for the FableSpace application.

## Development Environment

For development, the application uses [Ethereal](https://ethereal.email/) - a fake SMTP service that captures emails instead of sending them. This allows you to test email functionality without actually sending emails.

### Setting Up Ethereal Email

1. Run the setup script:
   ```bash
   npx ts-node src/scripts/setup-test-email.ts
   ```

2. Add the generated credentials to your `.env.local` file:
   ```
   ETHEREAL_EMAIL=your_generated_email@ethereal.email
   ETHEREAL_PASSWORD=your_generated_password
   ```

3. When emails are "sent" during development, you'll see a preview URL in the console that you can use to view the email.

## Production Environment

For production, you'll need to configure a real email service. The application supports any SMTP service.

### SMTP Configuration

Add the following variables to your production environment:

```
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your_username
EMAIL_SERVER_PASSWORD=your_password
EMAIL_SERVER_SECURE=true  # Use 'true' for SSL/TLS
EMAIL_FROM=FableSpace <noreply@yourdomain.com>
```

### Supported Email Services

You can use any SMTP service, including:

- [SendGrid](https://sendgrid.com/)
- [Mailgun](https://www.mailgun.com/)
- [Amazon SES](https://aws.amazon.com/ses/)
- [Postmark](https://postmarkapp.com/)
- [Mailchimp Transactional](https://mailchimp.com/features/transactional-email/)
- [SMTP2GO](https://www.smtp2go.com/)

### SendGrid Example

If using SendGrid, your configuration would look like:

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

## Troubleshooting

- If emails aren't being sent in development, check the console for the Ethereal preview URL
- If emails aren't being sent in production, check your SMTP configuration
- Ensure your email service allows sending from the domain specified in `EMAIL_FROM`
- Some email services require domain verification before sending emails
