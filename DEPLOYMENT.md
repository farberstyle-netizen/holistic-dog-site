# HTDA Platform - Deployment Guide
**Version:** 1.0
**Platform:** Cloudflare Workers + Pages
**Last Updated:** 2025-12-19

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedure](#rollback-procedure)
9. [Monitoring](#monitoring)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      HTDA Platform                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌──────────────────────┐          │
│  │  Static HTML │────────▶│  Cloudflare Pages    │          │
│  │  CSS/JS      │         │  (Frontend Hosting)  │          │
│  └──────────────┘         └──────────────────────┘          │
│                                      │                        │
│                                      │ API Calls              │
│                                      ▼                        │
│  ┌────────────────────────────────────────────┐             │
│  │         Cloudflare Workers (APIs)           │             │
│  ├────────────────────────────────────────────┤             │
│  │  • api-account.js    (Account Management)  │             │
│  │  • api-checkout.js   (Payment & Checkout)  │             │
│  │  • api-admin.js      (Admin Operations)    │             │
│  │  • stripe-webhook.js (Payment Webhooks)    │             │
│  │  • api-admin-shipments.js (Shipping)       │             │
│  └────────────────────────────────────────────┘             │
│                           │                                   │
│                           │ Database Queries                  │
│                           ▼                                   │
│  ┌────────────────────────────────────────────┐             │
│  │          Cloudflare D1 Database             │             │
│  │  (SQLite-compatible Serverless Database)   │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
│  ┌────────────────────────────────────────────┐             │
│  │           Stripe Payment Gateway            │             │
│  │         (External Payment Processing)       │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Tools
- [ ] Node.js 18+ installed
- [ ] Cloudflare account with Workers/Pages enabled
- [ ] Wrangler CLI installed: `npm install -g wrangler`
- [ ] Git installed
- [ ] Stripe account (for payments)

### Required Access
- [ ] Cloudflare API token with Workers/Pages permissions
- [ ] Stripe API keys (test + production)
- [ ] GitHub repository access (for automated deployments)

---

## Environment Setup

### 1. Install Wrangler CLI
```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 2. Configure Environment Variables

Create `.env` file (DO NOT commit this):
```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PAYMENT_LINK=https://buy.stripe.com/...
STRIPE_PAYMENT_TEST_LINK=https://buy.stripe.com/test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Database
DATABASE_ID=your_d1_database_id
```

### 3. Update .gitignore
Ensure `.env` is in `.gitignore`:
```
node_modules/
.env
*.db
.wrangler/
.DS_Store
.claude/
```

---

## Database Setup

### Create D1 Database
```bash
# Create new D1 database
wrangler d1 create htda-production-db

# Note the database ID from output
# Add to .env file
```

### Initialize Schema
```bash
# Apply schema to D1 database
wrangler d1 execute htda-production-db --file=./database/schema.sql
```

### Database Schema
```sql
-- See database/schema.sql for full schema
-- Key tables:
-- - users
-- - dogs
-- - sessions
-- - saved_addresses
-- - orders (if needed)
```

### Verify Database
```bash
# List tables
wrangler d1 execute htda-production-db --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check users table
wrangler d1 execute htda-production-db --command="SELECT COUNT(*) FROM users"
```

---

## Cloudflare Workers Deployment

### 1. Configure wrangler.toml for Each Worker

**api-account** (`wrangler-api-account.toml`):
```toml
name = "api-account"
main = "api-account.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "htda-production-db"
database_id = "your_database_id"

[env.production]
vars = { ENVIRONMENT = "production" }
```

**api-checkout** (`wrangler-api-checkout.toml`):
```toml
name = "api-checkout"
main = "api-checkout.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "htda-production-db"
database_id = "your_database_id"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.production.vars]
STRIPE_PAYMENT_LINK = "https://buy.stripe.com/..."
STRIPE_PAYMENT_TEST_LINK = "https://buy.stripe.com/test_..."
```

### 2. Deploy Workers

```bash
# Deploy api-account
wrangler deploy --config wrangler-api-account.toml

# Deploy api-checkout
wrangler deploy --config wrangler-api-checkout.toml

# Deploy api-admin
wrangler deploy --config wrangler-api-admin.toml

# Deploy api-admin-shipments
wrangler deploy --config wrangler-admin-shipments.toml

# Deploy stripe-webhook
wrangler deploy --config wrangler-stripe-webhook.toml
```

### 3. Configure Secrets

```bash
# Set Stripe secret key
wrangler secret put STRIPE_SECRET_KEY --config wrangler-api-checkout.toml

# Set Stripe webhook secret
wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler-stripe-webhook.toml
```

### 4. Verify Worker Deployment

```bash
# Test api-account
curl https://api-account.your-subdomain.workers.dev/health

# Check logs
wrangler tail api-account
```

---

## Frontend Deployment

### Option A: Cloudflare Pages (Recommended)

#### 1. Connect GitHub Repository
1. Go to Cloudflare Dashboard → Pages
2. Click "Create a project"
3. Connect GitHub account
4. Select `farberstyle-netizen/holistic-dog-site` repository
5. Configure build settings:
   - Build command: (leave empty - static HTML)
   - Build output directory: `/`
   - Root directory: `/`

#### 2. Configure Environment Variables
In Cloudflare Pages settings:
- `NODE_ENV`: `production`
- (Add any frontend-specific vars)

#### 3. Deploy
```bash
# Pages auto-deploys on git push to main
git push origin claude/fix-htda-platform-bfTbu

# Or manual deploy
npx wrangler pages publish . --project-name htda-platform
```

### Option B: Manual Upload to Pages

```bash
# Deploy current directory
wrangler pages publish . --project-name htda-platform
```

### Update Frontend API URLs

Update all HTML files to point to production Workers:
```javascript
// Before
const API_URL = 'http://localhost:8787';

// After
const API_URL = 'https://api-account.your-subdomain.workers.dev';
```

---

## Post-Deployment Verification

### Checklist

#### Frontend Tests
- [ ] Homepage loads without errors
- [ ] All CSS/JS files load
- [ ] Images load correctly
- [ ] Video background works (without auto-loading all videos)
- [ ] Navigation works
- [ ] Mobile responsive design works

#### Authentication Tests
- [ ] User can sign up
- [ ] User can log in
- [ ] Session persists across pages
- [ ] User can log out
- [ ] Password reset works

#### Certification Flow Tests
- [ ] Quiz loads and works
- [ ] User can add dog after quiz
- [ ] Checkout flow works
- [ ] Stripe payment processes
- [ ] Webhook confirms payment
- [ ] User sees dog in account

#### Admin Tests
- [ ] Admin can access admin.html
- [ ] Non-admin cannot access admin pages ⚠️ Currently NOT enforced server-side
- [ ] Admin can view shipments
- [ ] Admin can mark as shipped

#### API Health Tests
```bash
# Test each API endpoint
curl https://api-account.your-subdomain.workers.dev/health
curl https://api-checkout.your-subdomain.workers.dev/health
curl https://api-admin.your-subdomain.workers.dev/health
```

---

## Rollback Procedure

### Rollback Workers

```bash
# List deployments
wrangler deployments list --config wrangler-api-account.toml

# Rollback to specific deployment
wrangler rollback <deployment-id> --config wrangler-api-account.toml
```

### Rollback Frontend (Cloudflare Pages)

1. Go to Cloudflare Dashboard → Pages → htda-platform
2. Click "View builds"
3. Find previous successful build
4. Click "..." → "Rollback to this deployment"

### Rollback Database

⚠️ **WARNING:** D1 does not support automated rollbacks

**Procedure:**
1. Restore from backup (if available)
2. Re-run schema migrations
3. Manually fix data if needed

**Prevention:** Always backup before schema changes

---

## Monitoring

### Cloudflare Analytics

1. Go to Workers & Pages → Analytics
2. Monitor:
   - Request count
   - Error rate (should be < 1%)
   - Response time (should be < 200ms p95)
   - Status codes

### Worker Logs

```bash
# Real-time logs
wrangler tail api-account

# Filter for errors
wrangler tail api-account --status error
```

### Alerts (Recommended Setup)

**Cloudflare Workers:**
- Alert on error rate > 5%
- Alert on response time > 500ms
- Alert on request count anomalies

**External Monitoring:**
- Set up UptimeRobot for homepage
- Set up Pingdom for API endpoints
- Set up Sentry for error tracking

### Health Check Endpoints

**TODO:** Add health check endpoints to each worker:

```javascript
// api-account.js
if (path === '/health' && request.method === 'GET') {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## Automated Deployment (CI/CD)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy-workers:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          npx wrangler deploy --config wrangler-api-account.toml
          npx wrangler deploy --config wrangler-api-checkout.toml
          npx wrangler deploy --config wrangler-api-admin.toml

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
        run: |
          npx wrangler pages publish . --project-name htda-platform
```

---

## Troubleshooting

### Common Issues

**Workers not deploying:**
- Check wrangler.toml syntax
- Verify API token permissions
- Check account limits

**Database connection errors:**
- Verify database_id in wrangler.toml
- Check D1 database exists
- Verify binding name is "DB"

**CORS errors:**
- Check Access-Control-Allow-Origin headers
- Verify API URLs in frontend
- Check browser console for details

**Stripe webhook not working:**
- Verify webhook URL in Stripe dashboard
- Check webhook secret matches
- Check webhook signature validation

---

## Security Checklist

Before deploying to production:
- [ ] Change all default passwords
- [ ] Rotate all API keys
- [ ] Enable Cloudflare WAF rules
- [ ] Set up rate limiting
- [ ] Enable HTTPS only
- [ ] Review CORS settings (should NOT be `*`)
- [ ] Enable Cloudflare Bot Management
- [ ] Set up DDoS protection
- [ ] Review [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md)

---

## Performance Optimization

- [ ] Enable Cloudflare caching for static assets
- [ ] Set proper Cache-Control headers
- [ ] Enable Brotli compression
- [ ] Minify CSS/JS
- [ ] Optimize images (WebP format)
- [ ] Lazy-load videos
- [ ] Enable HTTP/3

---

**End of Deployment Guide**
