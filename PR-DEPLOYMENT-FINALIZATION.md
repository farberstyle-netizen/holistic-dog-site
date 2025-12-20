# PR: Finalize Deployment Correctness & Eliminate Dev-Scent

## Executive Summary

This PR finalizes deployment correctness by:
1. **Eliminating all dev-scent** from runtime code (0 hardcoded .workers.dev or r2.dev URLs)
2. **Making api-logout.js deployable** with wrangler config
3. **Configuring production routes** for all 12 Workers
4. **Ensuring /api/* paths work** via explicit Cloudflare routing

**Result**: Site is fully deployable with zero development domain leakage and complete production routing configuration.

---

## Issue → Fix → Files Changed Mapping

| Issue | Root Cause | Fix | Files/Lines Changed |
|-------|-----------|-----|---------------------|
| **A. Dev-scent in runtime code** | api-config.js contained hardcoded .workers.dev and r2.dev URLs | Replaced with environment variables: `window.DEV_API_BASE` and `window.DEV_R2_ORIGIN` with fallback placeholders | api-config.js:11-12, 46-50 |
| **B. api-logout.js not deployable** | No wrangler configuration existed | Created wrangler-api-logout.toml with D1 bindings and routes | wrangler-api-logout.toml (NEW) |
| **C. api-admin.js not deployable** | No wrangler configuration existed | Created wrangler-api-admin.toml with D1 bindings and routes | wrangler-api-admin.toml (NEW) |
| **D. Production /api/* routes undefined** | All wrangler configs lacked route declarations | Added `routes = [...]` to all 12 wrangler configs mapping to holistictherapydogassociation.com/api/* | 12 wrangler*.toml files (lines 5-9 added to each) |
| **E. Missing /api/logout endpoint mapping** | api-config.js production endpoints didn't include logout | Added logout: '/api/logout' to production endpoints | api-config.js:42 |

---

## Complete File Change List

### Configuration Files (14 files)

1. **api-config.js** - Removed dev-scent, added logout endpoint
   - **Line 2**: Changed comment to remove mention of .workers.dev and r2.dev
   - **Lines 11-12**: Replaced `'https://farberstyle.workers.dev'` with `window.DEV_API_BASE || 'https://dev-api.example.com'`
   - **Line 26**: Added `logout: ${devBase}/api-logout` to dev endpoints
   - **Line 42**: Added `logout: '/api/logout'` to production endpoints
   - **Lines 49-50**: Replaced `'https://pub-...r2.dev'` with `window.DEV_R2_ORIGIN || 'https://dev-r2.example.com'`

2. **wrangler-api-logout.toml** (NEW) - Logout Worker configuration
   - Routes: `/api/logout`
   - Bindings: D1 database

3. **wrangler-api-admin.toml** (NEW) - Admin stats Worker configuration
   - Routes: `/api/admin/*`
   - Bindings: D1 database

4-14. **All 12 wrangler configs** - Added production routes:
   - wrangler-api-login.toml → `/api/login`
   - wrangler-api-signup.toml → `/api/signup`
   - wrangler-api-verify.toml → `/api/verify`
   - wrangler-api-account.toml → `/api/account/*`
   - wrangler-api-checkout.toml → `/api/checkout`
   - wrangler-api-dogs.toml → `/api/dogs/*`
   - wrangler-api-reset-password.toml → `/api/reset-password/*`
   - wrangler-api-gallery.toml → `/api/gallery`
   - wrangler-api-admin.toml → `/api/admin/*`
   - wrangler-admin-shipments.toml → `/api/admin-shipments`
   - wrangler-stripe-webhook.toml → `/stripe/webhook`

---

## Verification Checklist

All commands run from repository root `/home/user/holistic-dog-site`:

### ✅ A. Dev-scent eliminated from runtime code
```bash
rg -n "\.workers\.dev" . --glob="!*.md"
```
**Result**: `0 matches` (previously 3 in api-config.js)

```bash
rg -n "r2\.dev" . --glob="!*.md"
```
**Result**: `0 matches` (previously 3 in api-config.js)

### ✅ B. api-logout.js has wrangler config
```bash
ls -l wrangler-api-logout.toml
```
**Result**: `-rw------- 1 root root 357 Dec 20 [TIME] wrangler-api-logout.toml`

### ✅ C. All Workers have production routes configured
```bash
rg "^routes = " wrangler*.toml | wc -l
```
**Result**: `12` (all wrangler configs have routes)

```bash
ls -1 wrangler*.toml | wc -l
```
**Result**: `12` (total wrangler configs)

### ✅ D. Routes configured (detailed)

| Worker | Route(s) | Config File | Lines |
|--------|----------|-------------|-------|
| api-login | `/api/login` | wrangler-api-login.toml | 6-9 |
| api-signup | `/api/signup` | wrangler-api-signup.toml | 6-9 |
| api-verify | `/api/verify` | wrangler-api-verify.toml | 6-9 |
| api-account | `/api/account/*` | wrangler-api-account.toml | 6-9 |
| api-checkout | `/api/checkout` | wrangler-api-checkout.toml | 6-9 |
| api-dogs | `/api/dogs/*` | wrangler-api-dogs.toml | 6-9 |
| api-reset-password | `/api/reset-password/*` | wrangler-api-reset-password.toml | 6-9 |
| api-gallery | `/api/gallery` | wrangler-api-gallery.toml | 6-9 |
| api-admin | `/api/admin/*` | wrangler-api-admin.toml | 6-9 |
| api-admin-shipments | `/api/admin-shipments` | wrangler-admin-shipments.toml | 6-9 |
| api-logout | `/api/logout` | wrangler-api-logout.toml | 6-9 |
| stripe-webhook | `/stripe/webhook` | wrangler-stripe-webhook.toml | 10-13 |

**All routes:**
- Include both `holistictherapydogassociation.com` and `www.holistictherapydogassociation.com` variants
- Match api-config.js production endpoints exactly
- Support wildcard paths (`/*`) where needed for sub-routes

### ✅ E. Logout endpoint configured
```bash
rg "logout:" api-config.js
```
**Result**:
```
26:        logout: `${devBase}/api-logout`
42:      logout: '/api/logout'
```

---

## Deployment Instructions

### Prerequisites

1. **Cloudflare Account**: Ensure account has access to Workers and D1
2. **Wrangler CLI**: Install via `npm install -g wrangler`
3. **Authentication**: Run `wrangler login` and authenticate
4. **Secrets**: Set required secrets for workers that need them

### Step 1: Set Required Secrets

**For stripe-webhook:**
```bash
cd /home/user/holistic-dog-site
wrangler secret put STRIPE_WEBHOOK_SECRET --config wrangler-stripe-webhook.toml
# Enter: whsec_... (from Stripe dashboard)

wrangler secret put SENDGRID_API_KEY --config wrangler-stripe-webhook.toml
# Enter: SG.... (from SendGrid dashboard)
```

**For Workers requiring JWT secrets** (if not already set):
```bash
wrangler secret put JWT_SECRET --config wrangler-api-login.toml
# Enter: your-secure-random-string

# Repeat for other auth Workers:
wrangler secret put JWT_SECRET --config wrangler-api-signup.toml
wrangler secret put JWT_SECRET --config wrangler-api-account.toml
```

### Step 2: Deploy All Workers

**Deploy in dependency order:**

```bash
# 1. Deploy auth helper (imported by other Workers - no wrangler config)
#    (auth.js is imported, not deployed directly)

# 2. Deploy authentication Workers
wrangler deploy --config wrangler-api-login.toml
wrangler deploy --config wrangler-api-signup.toml
wrangler deploy --config wrangler-api-logout.toml
wrangler deploy --config wrangler-api-verify.toml
wrangler deploy --config wrangler-api-reset-password.toml

# 3. Deploy data Workers
wrangler deploy --config wrangler-api-account.toml
wrangler deploy --config wrangler-api-dogs.toml
wrangler deploy --config wrangler-api-gallery.toml
wrangler deploy --config wrangler-api-checkout.toml

# 4. Deploy admin Workers
wrangler deploy --config wrangler-api-admin.toml
wrangler deploy --config wrangler-admin-shipments.toml

# 5. Deploy webhook
wrangler deploy --config wrangler-stripe-webhook.toml
```

**Or deploy all at once:**
```bash
for config in wrangler*.toml; do
  echo "Deploying $config..."
  wrangler deploy --config "$config"
done
```

### Step 3: Verify Routes in Cloudflare Dashboard

1. Navigate to Cloudflare Dashboard → Workers & Pages → Overview
2. For each Worker, click to view details
3. Verify "Routes" section shows:
   - `holistictherapydogassociation.com/api/[endpoint]`
   - `www.holistictherapydogassociation.com/api/[endpoint]`

### Step 4: Test Production Endpoints

```bash
# Test public endpoints
curl https://holistictherapydogassociation.com/api/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}'

curl https://holistictherapydogassociation.com/api/gallery

# Test authenticated endpoints (requires valid session cookie)
curl https://holistictherapydogassociation.com/api/logout -X POST \
  -H "Cookie: session_token=..." \
  -H "Content-Type: application/json"
```

### Step 5: Configure Frontend for Development (Optional)

For local development, set environment variables in browser console or create a local config:

```html
<!-- Add to HTML <head> for local dev -->
<script>
  if (window.location.hostname === 'localhost') {
    window.DEV_API_BASE = 'https://your-dev-subdomain.workers.dev';
    window.DEV_R2_ORIGIN = 'https://pub-your-r2-bucket.r2.dev';
  }
</script>
<script src="api-config.js"></script>
```

Or use the defaults:
- `DEV_API_BASE`: Falls back to `https://dev-api.example.com` (update as needed)
- `DEV_R2_ORIGIN`: Falls back to `https://dev-r2.example.com` (update as needed)

---

## Technical Implementation Details

### 1. Environment-Based Configuration Pattern

**Before (hardcoded dev domains):**
```javascript
const devBase = 'https://farberstyle.workers.dev';
const r2Url = 'https://pub-6ce181398b9b4e588bcc0db8db53f07a.r2.dev';
```

**After (environment variables):**
```javascript
const devBase = isDev ? (window.DEV_API_BASE || 'https://dev-api.example.com') : '';
const r2Origin = isDev ? (window.DEV_R2_ORIGIN || 'https://dev-r2.example.com') : '/cdn';
```

**Benefits:**
- Zero hardcoded development domains in runtime code
- Configurable via window globals (can be set per environment)
- Safe fallbacks to placeholder domains
- Production always uses same-origin paths

### 2. Cloudflare Routes Configuration

**Format:**
```toml
routes = [
  "holistictherapydogassociation.com/api/endpoint",
  "www.holistictherapydogassociation.com/api/endpoint"
]
```

**Why both domains:**
- Covers both www and non-www variants
- Ensures consistent routing regardless of user's URL
- Cloudflare will route both to same Worker

**Wildcard paths:**
```toml
routes = [
  "holistictherapydogassociation.com/api/account/*"
]
```
- Used for Workers handling multiple sub-paths (e.g., `/api/account/profile`, `/api/account/update`)
- Matches any path under the prefix

### 3. Cookie-Based Auth with Same-Origin Routes

**Frontend:**
```javascript
const response = await fetch('/api/logout', {
  method: 'POST',
  credentials: 'include'  // Browser includes session_token cookie
});
```

**Worker (auth.js):**
```javascript
export async function requireAuth(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session_token;
  // ... validate against D1 sessions table
}
```

**Benefits:**
- No CORS complexity (same-origin requests)
- HttpOnly cookies prevent XSS attacks
- Automatic credential inclusion by browser
- No manual token management in frontend

### 4. Production Routing Flow

```
User Browser
    ↓
https://holistictherapydogassociation.com/api/login
    ↓
Cloudflare Edge (routes matcher)
    ↓
api-login Worker (wrangler-api-login.toml)
    ↓
D1 Database (holistic-dog-db)
    ↓
Response with Set-Cookie: session_token=...
    ↓
User Browser (stores HttpOnly cookie)
```

---

## Development vs Production Behavior

### Development (localhost)

**Detection:**
```javascript
isDev: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
```

**Endpoint URLs:**
```javascript
login: 'https://dev-api.example.com/api-login'  // Or window.DEV_API_BASE
```

**R2 Origin:**
```javascript
'https://dev-r2.example.com'  // Or window.DEV_R2_ORIGIN
```

**Developer sets:**
```javascript
window.DEV_API_BASE = 'https://your-dev-workers.workers.dev';
window.DEV_R2_ORIGIN = 'https://pub-your-bucket.r2.dev';
```

### Production (holistictherapydogassociation.com)

**Endpoint URLs:**
```javascript
login: '/api/login'  // Same-origin, routed by Cloudflare
```

**R2 Origin:**
```javascript
'/cdn'  // Same-origin, should be configured as Cloudflare R2 custom domain
```

**Routing:**
- All `/api/*` requests routed to respective Workers via routes config
- `/cdn/*` should be configured as R2 bucket custom domain (separate from this PR)

---

## Remaining Configuration (Not in This PR)

### R2 CDN Configuration

**Current state:** Production uses `/cdn` path for R2 assets

**Required:** Configure R2 bucket with custom domain or path routing

**Option A: R2 Custom Domain**
1. In Cloudflare Dashboard → R2 → holistic-dog-photos bucket
2. Add custom domain: `cdn.holistictherapydogassociation.com`
3. Update DNS: Add CNAME for `cdn` pointing to R2
4. Update api-config.js: `return 'https://cdn.holistictherapydogassociation.com'`

**Option B: Path-Based Routing (Recommended)**
1. Create a Worker to serve R2 at `/cdn/*`:
   ```javascript
   export default {
     async fetch(request, env) {
       const url = new URL(request.url);
       const key = url.pathname.replace('/cdn/', '');
       const object = await env.R2_BUCKET.get(key);
       if (!object) return new Response('Not Found', { status: 404 });
       return new Response(object.body, {
         headers: { 'Content-Type': object.httpMetadata.contentType }
       });
     }
   };
   ```
2. Add route: `holistictherapydogassociation.com/cdn/*`
3. Bind R2 bucket in wrangler config

**Option C: Use Existing R2 Public URL**
- If bucket is already public, can keep using direct R2 URL
- Update `window.DEV_R2_ORIGIN` to point to production R2 URL
- Not recommended for production (no caching, no CDN)

### DNS Configuration

Ensure DNS has:
- `A` record: `holistictherapydogassociation.com` → Cloudflare proxy
- `CNAME` record: `www.holistictherapydogassociation.com` → `holistictherapydogassociation.com`

---

## Deployment Verification Commands

After deployment, verify everything works:

```bash
# 1. Check Worker deployment status
wrangler deployments list --config wrangler-api-login.toml

# 2. Test each endpoint (replace with actual domain)
DOMAIN="holistictherapydogassociation.com"

# Public endpoints
curl -I "https://$DOMAIN/api/login"
curl -I "https://$DOMAIN/api/signup"
curl -I "https://$DOMAIN/api/gallery"

# Protected endpoints (should return 401 without cookie)
curl -I "https://$DOMAIN/api/logout"
curl -I "https://$DOMAIN/api/account/profile"
curl -I "https://$DOMAIN/api/admin/stats"

# Stripe webhook (should return 405 for GET)
curl -I "https://$DOMAIN/stripe/webhook"
```

Expected responses:
- Public endpoints: `200 OK` or `405 Method Not Allowed` (if wrong method)
- Protected endpoints without auth: `401 Unauthorized`
- Protected endpoints with valid cookie: `200 OK`

---

## Rollback Procedure

If deployment fails:

### 1. Rollback Specific Worker
```bash
wrangler rollback --config wrangler-api-login.toml
```

### 2. Rollback All Workers
```bash
for config in wrangler*.toml; do
  echo "Rolling back $config..."
  wrangler rollback --config "$config"
done
```

### 3. Check Deployment History
```bash
wrangler deployments list --config wrangler-api-login.toml
```

---

## Security Notes

### 1. HttpOnly Cookies
- Session cookies are HttpOnly (cannot be accessed by JavaScript)
- Prevents XSS attacks from stealing session tokens
- Automatic inclusion by browser on same-origin requests

### 2. CORS Configuration
- All Workers use `getCORSHeaders()` from auth.js
- Explicit origin allowlist (no wildcard with credentials)
- `Vary: Origin` header for proper caching

### 3. Route Specificity
- Each Worker has explicit routes (no catch-all)
- Prevents unintended Worker invocations
- Easy to audit which Worker handles which endpoint

### 4. Secrets Management
- Stripe webhook secret and SendGrid API key stored as Cloudflare secrets
- Not exposed in code or configs
- Rotatable via `wrangler secret put`

---

## Files Changed Summary

**Total**: 14 files modified/created

**New Files** (2):
- wrangler-api-logout.toml
- wrangler-api-admin.toml

**Modified Files** (12):
- api-config.js (dev-scent removal, logout endpoint added)
- wrangler-api-login.toml (routes added)
- wrangler-api-signup.toml (routes added)
- wrangler-api-verify.toml (routes added)
- wrangler-api-account.toml (routes added)
- wrangler-api-checkout.toml (routes added)
- wrangler-api-dogs.toml (routes added)
- wrangler-api-reset-password.toml (routes added)
- wrangler-api-gallery.toml (routes added)
- wrangler-admin-shipments.toml (routes added)
- wrangler-stripe-webhook.toml (routes added)

---

## PR Merge Checklist

- [x] Dev-scent eliminated from runtime code (0 .workers.dev, 0 r2.dev)
- [x] api-logout.js has wrangler config (wrangler-api-logout.toml)
- [x] api-admin.js has wrangler config (wrangler-api-admin.toml)
- [x] All 12 Workers have production routes configured
- [x] Routes match api-config.js production endpoints exactly
- [x] Logout endpoint added to api-config.js
- [x] Environment variable pattern for dev URLs (window.DEV_API_BASE, window.DEV_R2_ORIGIN)
- [ ] All Workers deployed to Cloudflare (post-merge)
- [ ] Routes verified in Cloudflare dashboard (post-merge)
- [ ] Production endpoints tested (post-merge)
- [ ] R2 CDN path configured (separate task, documented above)

---

## Questions & Next Steps

**For questions about:**
- Deployment procedure → See "Deployment Instructions" section
- Route configuration → See "Technical Implementation Details" section
- Development setup → See "Step 5: Configure Frontend for Development"

**Next steps after merge:**
1. Deploy all Workers to Cloudflare following deployment instructions
2. Verify routes in Cloudflare dashboard
3. Test production endpoints
4. Configure R2 CDN path (see "Remaining Configuration" section)
5. Update DNS if not already configured
