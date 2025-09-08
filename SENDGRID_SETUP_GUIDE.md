# SendGrid Setup Guide for OhTopUp

## Current Issue
Your SendGrid integration is failing with a **403 Forbidden** error because the sender email `ohtopup@gmail.com` is not verified in SendGrid.

## Error Details
```
Error: 403 Forbidden
Message: "The from address does not match a verified Sender Identity. Mail cannot be sent until this error is resolved."
```

## Solutions

### Option 1: Verify Single Sender (Recommended for Testing)

1. **Log into SendGrid Dashboard**
   - Go to [https://app.sendgrid.com](https://app.sendgrid.com)
   - Sign in with your SendGrid account

2. **Navigate to Sender Authentication**
   - Click on "Settings" in the left sidebar
   - Click on "Sender Authentication"

3. **Verify Single Sender**
   - Click on "Verify a Single Sender"
   - Fill in the form:
     - **From Email**: `ohtopup@gmail.com`
     - **From Name**: `OhTopUp`
     - **Reply To**: `ohtopup@gmail.com`
     - **Company Address**: Your business address
     - **City**: Your city
     - **Country**: Nigeria
     - **Zip Code**: Your zip code
     - **Nickname**: `OhTopUp Main`

4. **Verify Your Email**
   - SendGrid will send a verification email to `ohtopup@gmail.com`
   - Click the verification link in the email

5. **Test Again**
   - Run: `node test_sendgrid_simple.js`

### Option 2: Domain Authentication (Recommended for Production)

For better deliverability and to avoid sender verification issues:

1. **Go to Domain Authentication**
   - In SendGrid dashboard, go to "Settings" → "Sender Authentication"
   - Click on "Authenticate Your Domain"

2. **Add Domain**
   - **Domain**: `ohtopup.com` (replace with your actual domain)
   - **Subdomain**: Leave blank or use `mail`

3. **Add DNS Records**
   - SendGrid will provide 2 CNAME records
   - Add these to your DNS settings:
     ```
     CNAME: s1._domainkey.ohtopup.com → s1.domainkey.u123456.wl123.sendgrid.net
     CNAME: s2._domainkey.ohtopup.com → s2.domainkey.u123456.wl123.sendgrid.net
     ```

4. **Verify Domain**
   - Click "Verify" after adding DNS records
   - This may take 24-48 hours to propagate

5. **Update Environment Variables**
   ```bash
   # In your .env file, you can use any email from your verified domain
   EMAIL_USER=noreply@ohtopup.com
   FROM_NAME=OhTopUp
   ```

### Option 3: Use SendGrid's Verified Senders

If you don't have domain access:

1. **Create Additional Verified Senders**
   - In SendGrid dashboard, go to "Marketing" → "Senders"
   - Add verified sender emails you have access to

2. **Update Environment Variables**
   ```bash
   EMAIL_USER=your-verified-email@example.com
   ```

## Testing Your Setup

After completing any of the above options:

```bash
# Test basic SendGrid functionality
node test_sendgrid_simple.js

# Test full email service (with logging)
node test_sendgrid.js
```

## Troubleshooting

### Still Getting 403 Forbidden?
- Ensure the email in `EMAIL_USER` matches exactly what's verified in SendGrid
- Check if your SendGrid account has sending limits or is suspended
- Verify your API key has "Mail Send" permissions

### Emails Going to Spam?
- Complete domain authentication (Option 2)
- Set up SPF, DKIM, and DMARC records
- Monitor your sender reputation

### Rate Limits?
- Free accounts: 100 emails/day
- Paid accounts: Higher limits based on plan
- Check your usage in SendGrid dashboard

## Environment Variables

Your current `.env` file should have:
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.YourApiKeyHere
EMAIL_USER=ohtopup@gmail.com  # Must be verified in SendGrid
FROM_NAME=OhTopUp
```

## Next Steps

1. Complete sender verification
2. Test email sending
3. Set up domain authentication for production
4. Monitor email deliverability metrics in SendGrid dashboard

## Support

- SendGrid Documentation: [https://docs.sendgrid.com](https://docs.sendgrid.com)
- Sender Authentication Guide: [https://sendgrid.com/docs/for-developers/sending-email/sender-identity/](https://sendgrid.com/docs/for-developers/sending-email/sender-identity/)