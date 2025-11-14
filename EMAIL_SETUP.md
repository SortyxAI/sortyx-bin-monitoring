# Email Notification Setup Guide

This guide explains how to configure email notifications for the Sortyx Smart Bin Monitoring Dashboard.

## Overview

The system sends automated emails for:
- **Welcome Emails**: Sent automatically when new users register
- **Alert Notifications**: Sent when smart bins require attention (can be configured)

## Email Service Configuration

### SMTP Settings (Hostinger)

The application uses Hostinger's SMTP service with the following configuration:

```
Host: smtp.hostinger.com
Port: 465
Encryption: SSL
Username: admin@sortyx.com
Password: Admin@Sortyx2025
```

### Environment Variables

Configure the following environment variables in `backend/.env`:

```env
# Email Configuration (Hostinger SMTP)
EMAIL_USER=admin@sortyx.com
EMAIL_PASSWORD=Admin@Sortyx2025

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:5173
# For production: FRONTEND_URL=https://your-production-domain.com

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Features

### 1. Welcome Email on Registration

When a new user registers:
- A beautiful HTML welcome email is automatically sent
- Includes the user's name and getting started information
- Features a professional gradient design with the Sortyx branding
- Contains key features overview and call-to-action button

**Automatic Trigger**: Fires when user completes registration via:
- Email/password signup
- Google OAuth signup (email sent after profile creation)

### 2. Alert Notification Emails

Smart bin alerts can trigger email notifications with:
- Alert severity (critical, warning, info)
- Bin name and location
- Alert message and timestamp
- Color-coded urgency indicators

**Manual Trigger**: Can be sent via API endpoint (see API section below)

## Email Templates

### Welcome Email Features
- 🎨 Professional gradient header (purple to indigo)
- 📝 Personalized greeting with user's name
- ✨ Feature highlights with icons
- 🔘 Call-to-action button to dashboard
- 📧 Support contact information
- 📱 Responsive design for mobile devices
- 🌙 Works in both light and dark email clients

### Alert Email Features
- 🚨 Severity-based color coding (red, orange, blue)
- 📍 Bin identification and location
- ⏰ Timestamp of alert
- 📊 Alert details and recommendations
- 🔗 Quick link to dashboard

## API Endpoints

### Send Welcome Email
```http
POST /api/send-welcome-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "userName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Welcome email sent successfully"
}
```

### Send Alert Email
```http
POST /api/send-alert-email
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "userName": "John Doe",
  "alertDetails": {
    "binName": "Kitchen Bin #1",
    "alertType": "High Fill Level",
    "message": "Bin is 90% full and requires attention",
    "severity": "warning"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alert email sent successfully"
}
```

## Testing Email Configuration

### 1. Test SMTP Connection

Start the backend server and check the console output:

```bash
cd backend
npm start
```

**Expected Output:**
```
🚀 Sortyx Backend Server running on port 3001
✅ Email service is ready to send emails
```

**If you see an error:**
```
❌ Email service connection error: authentication failed
⚠️  Email notifications will not be sent. Please check your credentials.
```

**Troubleshooting:**
1. Verify `EMAIL_USER` and `EMAIL_PASSWORD` in `.env` file
2. Check if the email account exists and is active
3. Ensure the password is correct (no extra spaces)
4. Verify SMTP access is enabled in your Hostinger account

### 2. Test Welcome Email (Manual)

Use a REST client (Postman, Insomnia, or curl) to test:

```bash
curl -X POST http://localhost:3001/api/send-welcome-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "userName": "Test User"
  }'
```

### 3. Test Registration Flow

1. Go to the registration page in your app
2. Create a new account with a valid email address
3. Check the email inbox (and spam folder)
4. You should receive a welcome email within seconds

## Common Issues & Solutions

### Issue: "Invalid login: authentication failed"

**Causes:**
- Incorrect username or password
- SMTP access not enabled for the email account
- Two-factor authentication blocking access
- IP address restrictions

**Solutions:**
1. Double-check credentials in `.env` file
2. Log in to Hostinger webmail to verify account is active
3. Check if "Less secure app access" or "SMTP access" is enabled
4. Review Hostinger email settings and security options
5. Try generating an app-specific password if 2FA is enabled

### Issue: Emails not being received

**Causes:**
- Emails going to spam folder
- Email server delays
- Recipient email blocking the sender
- DNS/SPF record issues

**Solutions:**
1. Check spam/junk folder
2. Wait a few minutes (can be delayed)
3. Add admin@sortyx.com to safe senders list
4. Verify Hostinger email DNS settings
5. Check Hostinger email sending limits

### Issue: "Email service connection error: ETIMEDOUT"

**Causes:**
- Firewall blocking port 465
- Network connectivity issues
- VPN interference

**Solutions:**
1. Check firewall settings (allow port 465)
2. Verify internet connection
3. Try disabling VPN temporarily
4. Try alternative port 587 with STARTTLS

## Production Deployment

### 1. Update Environment Variables

For production (e.g., Render, Heroku):

```env
EMAIL_USER=admin@sortyx.com
EMAIL_PASSWORD=Admin@Sortyx2025
FRONTEND_URL=https://your-production-domain.com
NODE_ENV=production
```

### 2. Verify Email Sending Limits

Hostinger email accounts have sending limits:
- Check your plan's daily/hourly sending limits
- Monitor usage to avoid hitting limits
- Consider upgrading plan if sending many emails

### 3. Configure SPF and DKIM Records

For better email deliverability:
1. Add SPF record in your domain DNS settings
2. Configure DKIM signing in Hostinger
3. Set up DMARC policy for domain protection

### 4. Monitor Email Logs

The backend logs all email operations:
- Success: `✅ Welcome email sent successfully to: user@example.com`
- Failure: `❌ Error sending welcome email: [error details]`

## Email Content Customization

### Modify Welcome Email Template

Edit `backend/services/emailService.js`:

```javascript
getWelcomeEmailTemplate(userName) {
  // Customize HTML template here
  // Change colors, add/remove sections, update branding
}
```

### Modify Alert Email Template

```javascript
getAlertEmailTemplate(userName, alertDetails) {
  // Customize alert email HTML here
  // Adjust severity colors, layout, content
}
```

### Add Logo/Images

To include images in emails:
1. Host images on a CDN or public server
2. Use absolute URLs in `<img>` tags
3. Optimize images for email (small file size)

Example:
```html
<img src="https://yourdomain.com/logo.png" alt="Sortyx Logo" width="150" />
```

## Security Best Practices

1. **Never commit `.env` file to git** - Already in `.gitignore`
2. **Use environment variables** - Don't hardcode credentials
3. **Enable 2FA on email account** - Use app-specific passwords
4. **Rotate credentials regularly** - Update passwords periodically
5. **Monitor for suspicious activity** - Check email logs
6. **Use HTTPS** - Ensure all API calls are encrypted
7. **Validate email addresses** - Prevent spam/abuse

## Alternative Email Providers

If you want to switch from Hostinger to another provider:

### Gmail (with App Password)
```javascript
host: 'smtp.gmail.com'
port: 587
secure: false // use STARTTLS
```

### SendGrid
```javascript
host: 'smtp.sendgrid.net'
port: 587
auth: {
  user: 'apikey'
  pass: 'your-sendgrid-api-key'
}
```

### AWS SES
```javascript
host: 'email-smtp.us-east-1.amazonaws.com'
port: 587
auth: {
  user: 'your-smtp-username'
  pass: 'your-smtp-password'
}
```

## Support

For email-related issues:
- **Hostinger Support**: support@hostinger.com
- **Application Support**: support@sortyx.com
- **Documentation**: Check SMTP settings in Hostinger control panel

## Changelog

### Version 1.0.0 (Current)
- ✅ Welcome email on registration
- ✅ Alert notification emails
- ✅ Hostinger SMTP integration
- ✅ HTML email templates
- ✅ Plain text fallback
- ✅ Error handling and logging
- ✅ Non-blocking email sending

### Planned Features
- 🔜 Email preferences management
- 🔜 Digest emails (daily/weekly summaries)
- 🔜 Unsubscribe functionality
- 🔜 Email templates customization UI
- 🔜 Email tracking and analytics
