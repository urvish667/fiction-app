# Azure Communication Service Email Configuration for FableSpace

This document explains how to configure Azure Communication Service (ACS) for email sending in the FableSpace application.

## Overview

FableSpace uses Azure Communication Service Email to send:
- Email verification messages
- Password reset emails
- Welcome emails after verification

## Prerequisites

Before configuring ACS Email, you need:

1. An Azure account with an active subscription
2. An Azure Communication Services resource
3. An Email Communication Services resource with a provisioned domain
4. A connection string for your Azure Communication Service

## Environment Variables

Add the following variables to your environment:

```env
AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING=your_acs_connection_string
AZURE_COMMUNICATION_SERVICE_SENDER_ADDRESS=donotreply@your-domain.azurecomm.net
EMAIL_FROM=FableSpace <donotreply@your-domain.azurecomm.net>
```

### Connection String

The connection string can be found in the Azure Portal:
1. Go to your Azure Communication Service resource
2. Navigate to "Keys" under "Settings"
3. Copy the "Connection string" value

The connection string should look like this:
```
endpoint=https://your-resource-name.communication.azure.com/;accessKey=your-access-key
```

### Sender Address

The sender address must be from a domain that you've verified and connected to your Azure Communication Service. It typically looks like:
```
donotreply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net
```

You can find this address in the Azure Portal:
1. Go to your Email Communication Service resource
2. Navigate to "Provision domains" 
3. Look for the "MailFrom" address of your verified domain

## Email Templates

The application includes templates for:

1. **Verification Email** - Sent when a user signs up with email/password
2. **Password Reset Email** - Sent when a user requests a password reset
3. **Welcome Email** - Sent after a user verifies their email

These templates can be customized in `src/lib/email/email-templates.ts`.

## Testing the Configuration

You can test your Azure Communication Service Email configuration by:

1. Signing up with a new email address
2. Requesting a password reset
3. Checking the Azure Portal for email delivery status:
   - Go to your Email Communication Service resource
   - Navigate to "Monitoring" > "Metrics"
   - Select "Email Sent" metric to view delivery statistics

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check that your connection string is correct
   - Verify that your sender address is properly configured
   - Check Azure Portal for any service outages

2. **Authentication errors**
   - Ensure your connection string is valid and not expired
   - Check that your resource has proper permissions

3. **Domain verification issues**
   - Make sure your domain is properly verified in Azure
   - Check that the domain is connected to your Communication Service

### Monitoring

You can monitor email delivery using:

1. **Azure Portal Metrics**
   - Navigate to your Email Communication Service resource
   - Go to "Monitoring" > "Metrics"
   - Add metrics for "Email Sent", "Email Delivered", etc.

2. **Application Logs**
   - The application logs email sending operations
   - Check logs for any errors or warnings

## References

- [Azure Communication Service Email Documentation](https://learn.microsoft.com/en-us/azure/communication-services/concepts/email/email-overview)
- [Send an email using Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email)
- [Azure Communication Email SDK for JavaScript](https://www.npmjs.com/package/@azure/communication-email)
