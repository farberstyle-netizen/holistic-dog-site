# HTDA Platform - Deployment Guide

## Overview

The Holistic Therapy Dog Association (HTDA) platform is a Cloudflare Workers-based application with:
- **Frontend**: Static HTML/CSS/JavaScript
- **Backend**: Cloudflare Workers (serverless functions)
- **Database**: Cloudflare D1 (SQLite at the edge)
- **Storage**: Cloudflare R2 (object storage for images/videos)
- **Payments**: Stripe integration
- **Email**: SendGrid integration

---

## Pre-Deployment Checklist

- [ ] All security fixes applied (password hashing, admin verification, XSS protection)
- [ ] Design system CSS file created and linked
- [ ] Environment variables configured in Cloudflare dashboard
- [ ] Database schema migrations tested
- [ ] Stripe webhooks configured
- [ ] SendGrid API key valid and tested
- [ ] Code reviewed and tested locally
- [ ] Git branch is clean (no uncommitted changes)

---

## Environment Configuration

### Required Environment Variables (Cloudflare Workers)

Configure these in your Cloudflare dashboard under Workers > [Worker Name] > Settings > Variables:

```
# Database Binding
DB = [holistic-dog-db]  # D1 database binding name

# Stripe Configuration
STRIPE_SECRET_KEY = sk_live_xxxxxxxxxxxxx
STRIPE_PAYMENT_LINK = https://buy.stripe.com/xxxxx
STRIPE_PAYMENT_TEST_LINK = https://buy.stripe.com/test_xxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxx

# SendGrid Configuration
SENDGRID_API_KEY = SG.xxxxxxxxxxxxx

# R2 Storage
PHOTOS_BUCKET = [photos-bucket]  # R2 bucket binding
```

### Database Schema

Ensure the D1 database has the following tables:

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_zip TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Sessions table
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Dogs table
CREATE TABLE dogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    dog_name TEXT NOT NULL,
    license_id TEXT UNIQUE,
    state_of_licensure TEXT,
    breed TEXT,
    weight TEXT,
    height TEXT,
    eye_color TEXT,
    birthday TEXT,
    photo_url TEXT,
    payment_status TEXT DEFAULT 'pending',
    paid_at TEXT,
    expires_at TEXT,
    shipped_at TEXT,
    tracking_number TEXT,
    delivery_status TEXT DEFAULT 'pending',
    is_gift INTEGER DEFAULT 0,
    gift_name TEXT,
    gift_address TEXT,
    gift_city TEXT,
    gift_state TEXT,
    gift_zip TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Saved addresses table
CREATE TABLE saved_addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    label TEXT,
    name TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Deployment Process

### 1. Deploy Cloudflare Workers

Each API endpoint is a separate Worker:

```bash
# Login to Cloudflare
wrangler login

# Deploy each worker
wrangler deploy api-account.js --name api-account
wrangler deploy api-admin.js --name api-admin
wrangler deploy api-admin-shipments.js --name api-admin-shipments
wrangler deploy api-checkout.js --name api-checkout
wrangler deploy stripe-webhook.js --name stripe-webhook
```

### 2. Deploy Static Assets

Upload HTML, CSS, and JavaScript files to Cloudflare Pages or R2:

```bash
# Using Cloudflare Pages
wrangler pages deploy ./ --project-name htda-frontend

# Or upload to R2 bucket for static hosting
wrangler r2 object put htda-static/index.html --file=./index.html
wrangler r2 object put htda-static/style.css --file=./style.css
wrangler r2 object put htda-static/design-system.css --file=./design-system.css
# ... repeat for all static files
```

### 3. Configure Stripe Webhooks

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://stripe-webhook.[your-subdomain].workers.dev`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET` environment variable

### 4. Verify Deployment

Run the post-deployment checklist:

```bash
# Test authentication endpoint
curl -X POST https://api-auth.[subdomain].workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

# Test admin endpoint (should return 403 without admin rights)
curl -X GET https://api-admin.[subdomain].workers.dev/stats \
  -H "Authorization: Bearer [token]"

# Test static site
curl https://htda-frontend.pages.dev/

# Verify database connectivity
wrangler d1 execute holistic-dog-db --command "SELECT COUNT(*) FROM users"
```

---

## Database Migration

### Migrating Existing Password Hashes

If you have existing users with SHA-256 password hashes, the new PBKDF2 implementation includes backward compatibility. Users will be automatically upgraded to PBKDF2 on their next login.

**To force migration of all passwords:**

```sql
-- Check current password hash format
SELECT id, email, LENGTH(password_hash), password_hash FROM users LIMIT 5;

-- If hashes are 64 characters (SHA-256), they will auto-migrate on login
-- No manual migration needed due to backward compatibility in verifyPassword()
```

### Adding Admin Users

```sql
-- Grant admin access to a user
UPDATE users SET is_admin = 1 WHERE email = 'admin@holistictherapydogassociation.com';

-- Verify admin status
SELECT email, is_admin FROM users WHERE is_admin = 1;
```

---

## Rollback Procedure

If critical issues are found post-deployment:

```bash
# Rollback Workers to previous version
wrangler rollback api-account --message "Rolling back due to [reason]"
wrangler rollback api-admin --message "Rolling back due to [reason]"

# Restore database from backup
wrangler d1 restore holistic-dog-db --from-backup [backup-id]

# Rollback Cloudflare Pages deployment
wrangler pages deployment list --project-name htda-frontend
wrangler pages deployment rollback [deployment-id]
```

---

## Post-Deployment Monitoring

### Critical Metrics to Monitor (First 24 Hours)

1. **Error Rates**
   - Worker error logs in Cloudflare dashboard
   - 4xx/5xx response rates
   - Failed authentication attempts

2. **Database Performance**
   - D1 query latency (should be < 100ms)
   - Connection errors
   - Query failures

3. **Security Indicators**
   - Failed admin access attempts (403 responses)
   - XSS injection attempts (escaped HTML in logs)
   - Password change requests

4. **User Experience**
   - Page load times (< 3 seconds)
   - API response times (< 500ms)
   - Form submission success rates

### Logging and Alerts

Set up alerts in Cloudflare dashboard:

```bash
# View real-time logs
wrangler tail api-account

# Monitor specific errors
wrangler tail api-account --format=json | grep "ERROR"
```

---

## Performance Baselines

Expected performance after deployment:

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| Homepage load time | < 2s | < 4s |
| API response time | < 300ms | < 1s |
| Database query time | < 50ms | < 200ms |
| Worker cold start | < 100ms | < 500ms |
| Time to Interactive | < 3s | < 6s |

---

## Security Hardening Checklist

Post-deployment security verification:

- [ ] Admin endpoints return 403 for non-admin users
- [ ] Password hashing uses PBKDF2 with 100,000 iterations
- [ ] XSS protection active (HTML escaped in user data)
- [ ] SQL injection prevented (all queries use parameterized statements)
- [ ] CORS headers properly configured
- [ ] Session tokens expire after inactivity
- [ ] Stripe webhook signature verified
- [ ] SendGrid API key not exposed in client-side code

---

## Common Issues and Solutions

### Issue: 401 Unauthorized on all API requests

**Solution**: Check that session token is being sent correctly:
```javascript
// Correct header format
headers: {
  'Authorization': `Bearer ${localStorage.getItem('session_token')}`
}
```

### Issue: Admin endpoints accessible to all users

**Solution**: Verify `is_admin` column exists and admin check is enabled:
```sql
-- Add column if missing
ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;

-- Verify admin check is not commented out in api-admin.js
```

### Issue: Password changes failing

**Solution**: Ensure PBKDF2 implementation is deployed:
```bash
wrangler tail api-account | grep "hashPassword"
# Should see "PBKDF2" in logs, not "SHA-256"
```

---

## Support and Troubleshooting

For deployment issues:
1. Check Cloudflare Workers logs
2. Verify environment variables are set correctly
3. Test each endpoint individually with curl
4. Review database schema matches expected structure
5. Contact Cloudflare support for platform issues

**Emergency Contacts:**
- Technical Lead: [email]
- Cloudflare Account Manager: [email]
- Database Administrator: [email]
