# Email Configuration Guide

The forgot password functionality requires email configuration to send password reset links. Here's how to set it up:

## Environment Variables Required

Add these environment variables to your `.env` file or Replit Secrets:

### Option 1: Gmail (Easiest)
```
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Motor Claims Platform <your-gmail@gmail.com>
```

### Option 2: Custom SMTP Server
```
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@your-domain.com
EMAIL_PASS=your-password
EMAIL_FROM=Motor Claims Platform <your-email@your-domain.com>
```

## Setup Instructions

### For Gmail:
**Note: Gmail has been phasing out App Passwords for newer accounts. If you don't see the App Passwords option, use one of the alternatives below.**

If App Passwords are available:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this app password as `EMAIL_PASS`

If App Passwords are NOT available:
- Use Gmail's SMTP with OAuth2 (complex setup)
- Or switch to one of the alternative providers below

### Alternative Email Providers (Recommended):

**Option A: Outlook/Hotmail (Requires App Password)**
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-outlook-app-password
EMAIL_FROM=Motor Claims <your-email@outlook.com>
```

**To get Outlook App Password:**
1. Go to Microsoft Account Security settings
2. Enable two-factor authentication
3. Go to Security → App passwords → Create new app password
4. Use the generated app password (not your regular password)

**Note:** Outlook also requires app passwords like Gmail for SMTP access.

**Option B: Yahoo Mail**
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-yahoo-app-password
EMAIL_FROM=Motor Claims <your-email@yahoo.com>
```
- Requires app password: Yahoo Account → Security → Generate app password

**Option C: Professional Services**
| Provider | SMTP Host | Port | Notes |
|----------|-----------|------|--------|
| SendGrid | smtp.sendgrid.net | 587 | Free tier: 100 emails/day |
| Mailgun | smtp.mailgun.org | 587 | Free tier: 5,000 emails/month |
| AWS SES | email-smtp.region.amazonaws.com | 587 | Pay per email |

### For Development/Testing:
**Mailtrap (Free Email Testing)**
1. Sign up at mailtrap.io (free account)
2. Create an inbox
3. Use these settings:
```
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=test@example.com
```
- Emails won't be delivered to real addresses
- Perfect for testing without sending real emails

## Security Notes

⚠️ **Never commit email credentials to version control!**

- Use environment variables or Replit Secrets
- For production, use proper SMTP services
- Consider using services like SendGrid, Mailgun, or AWS SES for production
- App passwords are safer than regular passwords for Gmail

## Testing

After configuration, test the forgot password functionality:

1. Go to the login page
2. Click "Forgot your password?"
3. Enter a valid email address
4. Check your email for the reset link
5. In development, the link will also be logged to console if email fails

## Troubleshooting

**Email not sending?**
- Check that all environment variables are set correctly
- Verify SMTP settings with your email provider
- Check console logs for error messages
- For Gmail, ensure you're using an App Password, not your regular password

**Common Errors:**
- `Invalid login`: Wrong username/password
- `Connection timeout`: Check host/port settings
- `Authentication failed`: Verify credentials and 2FA setup

## Production Recommendations

For production deployments:
- Use dedicated email services (SendGrid, Mailgun, AWS SES)
- Set up proper domain authentication (SPF, DKIM)
- Monitor email delivery rates
- Implement email templates with proper branding