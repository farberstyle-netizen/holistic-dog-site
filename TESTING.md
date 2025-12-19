# HTDA Platform - Testing Guide

## Overview

This document provides comprehensive testing procedures for the Holistic Therapy Dog Association platform, covering security, functionality, accessibility, and performance testing.

---

## Table of Contents

1. [Manual Test Cases](#manual-test-cases)
2. [Security Testing](#security-testing)
3. [API Endpoint Tests](#api-endpoint-tests)
4. [Accessibility Testing](#accessibility-testing)
5. [Performance Testing](#performance-testing)
6. [Cross-Browser Testing](#cross-browser-testing)

---

## Manual Test Cases

### 1. Authentication Flow

#### Test Case 1.1: User Registration
**Steps:**
1. Navigate to `/signup.html`
2. Enter email: `testuser@example.com`
3. Enter password: `SecurePass123!`
4. Click "Create Account"

**Expected Result:**
- User account created successfully
- Password stored as PBKDF2 hash (format: `saltHex:hashHex`, length > 64 chars)
- Session token returned and stored in localStorage
- Redirect to account dashboard

**SQL Verification:**
```sql
SELECT email, LENGTH(password_hash), password_hash
FROM users
WHERE email = 'testuser@example.com';
-- Should show hash length > 64 (PBKDF2 format with salt)
```

#### Test Case 1.2: User Login
**Steps:**
1. Navigate to `/login.html`
2. Enter registered email and password
3. Click "Login"

**Expected Result:**
- Session token created in database
- Token stored in localStorage with key `session_token`
- User redirected to `/account.html`
- Session expires_at set to 30 minutes from now

**API Test:**
```bash
curl -X POST https://api-auth.workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePass123!"
  }'

# Expected response:
# {
#   "success": true,
#   "token": "abc123...",
#   "user": { "id": 1, "email": "testuser@example.com" }
# }
```

#### Test Case 1.3: Password Change
**Steps:**
1. Log in as user
2. Navigate to Account > Change Password tab
3. Enter current password
4. Enter new password (min 8 chars)
5. Submit form

**Expected Result:**
- Password updated successfully
- New password hash uses PBKDF2 (format verified in database)
- User can log in with new password
- Old password no longer works

**Security Verification:**
```sql
-- Check password hash changed
SELECT password_hash FROM users WHERE id = 1;
-- New hash should be different and in PBKDF2 format
```

### 2. Admin Access Control

#### Test Case 2.1: Non-Admin Access Denied
**Steps:**
1. Log in as regular user (is_admin = 0)
2. Attempt to access `/admin.html`
3. Attempt API call to `/api/admin/stats`

**Expected Result:**
- Admin page returns 403 Forbidden or redirects
- API returns 403 with error: "Admin access required"

**API Test:**
```bash
# Get token from regular user login
TOKEN="[regular-user-token]"

curl -X GET https://api-admin.workers.dev/stats \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
# {
#   "success": false,
#   "error": "Admin access required"
# }
# HTTP Status: 403
```

#### Test Case 2.2: Admin Access Granted
**Steps:**
1. Set user as admin: `UPDATE users SET is_admin = 1 WHERE email = 'admin@example.com'`
2. Log in as admin user
3. Access `/admin.html`
4. Call `/api/admin/stats`

**Expected Result:**
- Admin dashboard loads successfully
- API returns statistics data
- Can view pending shipments
- Can access admin-shipments endpoint

**API Test:**
```bash
# Get token from admin user login
ADMIN_TOKEN="[admin-user-token]"

curl -X GET https://api-admin.workers.dev/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Expected response:
# {
#   "success": true,
#   "total_certifications": 150,
#   "active_dogs": 120,
#   "pending_shipments": 5
# }
# HTTP Status: 200
```

### 3. Dog Certification Flow

#### Test Case 3.1: Add Dog and Checkout
**Steps:**
1. Log in as user
2. Navigate to `/add-dog.html`
3. Fill out dog information:
   - Name: "Max"
   - State: "California"
   - Upload photo (optional)
4. Submit form
5. Proceed to checkout
6. Complete Stripe payment

**Expected Result:**
- Dog record created with status `payment_status='pending'`
- License ID generated (format: `CA-XXXXXX`)
- Stripe payment link opened with correct `client_reference_id`
- After payment webhook: dog status updated to `paid`, expiry date set to +24 months

**Database Verification:**
```sql
-- Before payment
SELECT dog_name, license_id, payment_status, paid_at
FROM dogs
WHERE dog_name = 'Max';
-- payment_status should be 'pending', paid_at should be NULL

-- After payment (webhook processed)
SELECT dog_name, license_id, payment_status, paid_at, expires_at
FROM dogs
WHERE dog_name = 'Max';
-- payment_status should be 'paid', paid_at should have timestamp
```

### 4. XSS Protection

#### Test Case 4.1: XSS in Dog Name
**Steps:**
1. Add dog with name: `<script>alert('XSS')</script>`
2. Submit form
3. View dog on account page
4. View dog on gallery page

**Expected Result:**
- Script does NOT execute on any page
- Dog name displayed as plain text: `<script>alert('XSS')</script>`
- HTML is escaped in output

**Verification:**
```bash
# Check page source
curl https://htda-frontend.pages.dev/gallery.html | grep "script"
# Should show escaped HTML: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

#### Test Case 4.2: XSS in Form Inputs
**Steps:**
1. Enter in any input field: `"><img src=x onerror=alert('XSS')>`
2. Submit form
3. View data on page

**Expected Result:**
- No alert() executes
- Data is HTML-escaped
- `escapeHtml()` function properly sanitizes input

---

## Security Testing

### SQL Injection Testing

#### Test Case S1: Login SQL Injection
**Attack Vector:**
```bash
curl -X POST https://api-auth.workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com OR 1=1--",
    "password": "anything"
  }'
```

**Expected Result:**
- Login fails with "Invalid credentials"
- SQL injection prevented by parameterized queries (`.bind()`)
- No database error exposed

#### Test Case S2: Search Field SQL Injection
**Attack Vector:**
Try injecting into any search or filter field:
```
'; DROP TABLE users; --
' UNION SELECT password_hash FROM users--
```

**Expected Result:**
- Query returns no results or error
- Tables not affected
- All queries use `.bind()` parameterization

### CSRF Protection Testing

#### Test Case S3: Form Submission Without CSRF Token
**Steps:**
1. Create external HTML file:
```html
<form action="https://api-account.workers.dev/update" method="POST">
  <input name="address" value="Hacker Address">
  <input type="submit">
</form>
```
2. Submit form from external site

**Expected Result:**
- Request rejected with error
- No data updated in database
- CSRF token validation required

### Password Security Testing

#### Test Case S4: Password Hash Strength
**Verification:**
```sql
-- Check password hashes use PBKDF2
SELECT
  id,
  email,
  LENGTH(password_hash) as hash_length,
  CASE
    WHEN password_hash LIKE '%:%' THEN 'PBKDF2'
    WHEN LENGTH(password_hash) = 64 THEN 'SHA-256 (WEAK)'
    ELSE 'Unknown'
  END as hash_type
FROM users;
```

**Expected Result:**
- All hashes show `PBKDF2` type
- Hash length > 64 characters
- Contains colon separator (salt:hash format)

#### Test Case S5: Password Complexity
**Steps:**
1. Try to set weak password: `123456`
2. Try to set password without special chars: `Password123`

**Expected Result:**
- Weak passwords rejected
- Minimum 8 characters enforced
- Complexity requirements displayed

---

## API Endpoint Tests

### Authentication Endpoints

```bash
# POST /api/auth/login
curl -X POST https://api-auth.workers.dev/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
# Expected: {"success":true,"token":"...","user":{...}}

# POST /api/auth/register
curl -X POST https://api-auth.workers.dev/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","password":"SecurePass123!"}'
# Expected: {"success":true}

# POST /api/auth/logout
curl -X POST https://api-auth.workers.dev/logout \
  -H "Authorization: Bearer [token]"
# Expected: {"success":true}
```

### Account Management Endpoints

```bash
# GET /api/account/profile
curl -X GET https://api-account.workers.dev/profile \
  -H "Authorization: Bearer [token]"
# Expected: {"success":true,"user":{...},"dogs":[...],"orders":[...]}

# PUT /api/account/update
curl -X PUT https://api-account.workers.dev/update \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"John","last_name":"Doe","address":"123 Main St"}'
# Expected: {"success":true,"message":"Profile updated"}

# PUT /api/account/change-password
curl -X PUT https://api-account.workers.dev/change-password \
  -H "Authorization: Bearer [token]" \
  -H "Content-Type: application/json" \
  -d '{"current_password":"old","new_password":"NewPass123!"}'
# Expected: {"success":true,"message":"Password changed successfully"}
```

### Admin Endpoints

```bash
# GET /api/admin/stats (requires admin)
curl -X GET https://api-admin.workers.dev/stats \
  -H "Authorization: Bearer [admin-token]"
# Expected: {"success":true,"total_certifications":100,"active_dogs":80,...}

# GET /api/admin-shipments (requires admin)
curl -X GET https://api-admin-shipments.workers.dev \
  -H "Authorization: Bearer [admin-token]"
# Expected: {"success":true,"shipments":[...]}

# POST /api/admin-shipments (update tracking)
curl -X POST https://api-admin-shipments.workers.dev \
  -H "Authorization: Bearer [admin-token]" \
  -H "Content-Type: application/json" \
  -d '{"dog_id":123,"tracking_number":"1Z999AA10123456784","carrier":"UPS"}'
# Expected: {"success":true}
```

---

## Accessibility Testing

### Keyboard Navigation

#### Test Case A1: Tab Navigation
**Steps:**
1. Press Tab key repeatedly on homepage
2. Verify focus moves through all interactive elements
3. Press Enter on focused button

**Expected Result:**
- All buttons, links, form inputs are keyboard accessible
- Focus outline visible on all elements
- No keyboard traps (can Tab backwards with Shift+Tab)

#### Test Case A2: Modal Focus Trap
**Steps:**
1. Open modal dialog
2. Press Tab key
3. Try to Tab outside modal

**Expected Result:**
- Focus stays within modal
- Can cycle through modal elements
- Escape key closes modal
- Focus returns to trigger element

### Screen Reader Testing

Test with NVDA (Windows) or VoiceOver (Mac):

#### Test Case A3: Form Labels
**Expected:**
- All form inputs have associated labels
- Error messages announced when validation fails
- Required fields marked with `aria-required="true"`

#### Test Case A4: ARIA Attributes
**Verification:**
```bash
# Check for proper ARIA usage
grep -r "aria-" *.html

# Should include:
# - aria-label on icon buttons
# - aria-labelledby on modals
# - aria-describedby on form hints
# - role="tab" on tab buttons
# - role="tabpanel" on tab content
```

### Color Contrast

#### Test Case A5: WCAG AA Compliance
**Tools:** Use WebAIM Contrast Checker

**Requirements:**
- Normal text: minimum 4.5:1 contrast ratio
- Large text (18pt+): minimum 3:1 contrast ratio

**Check:**
- Primary maroon (#800000) on white background
- Gold accent (#B8860B) on dark backgrounds
- Button text on button backgrounds

---

## Performance Testing

### Page Load Time

#### Test Case P1: Homepage Load Time
**Tool:** Lighthouse in Chrome DevTools

**Metrics:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Command:**
```bash
# Using Lighthouse CLI
lighthouse https://htda-frontend.pages.dev --view
```

### API Response Time

#### Test Case P2: API Latency
**Test:**
```bash
# Measure response time
time curl -X GET https://api-account.workers.dev/profile \
  -H "Authorization: Bearer [token]"

# Should complete in < 500ms
```

### Database Query Performance

#### Test Case P3: Query Execution Time
**Verification:**
```sql
-- Enable query timing
.timer on

-- Test common queries
SELECT * FROM dogs WHERE user_id = 1;
SELECT * FROM users WHERE email = 'test@example.com';
SELECT * FROM sessions WHERE token = 'abc123' AND expires_at > datetime('now');

-- All queries should complete in < 100ms
```

---

## Cross-Browser Testing

Test in the following browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Verify:**
- Page layouts render correctly
- Forms submit successfully
- JavaScript executes without errors
- CSS variables supported
- Video backgrounds work (or gracefully degrade)

---

## Automated Testing Scripts

### Basic Health Check Script

```bash
#!/bin/bash
# health-check.sh

API_BASE="https://api-account.workers.dev"

# Test 1: API is reachable
echo "Testing API health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $API_BASE/health)
if [ $STATUS -eq 200 ]; then
  echo "✅ API is healthy"
else
  echo "❌ API returned $STATUS"
fi

# Test 2: Database connectivity
echo "Testing database..."
# Add database test here

# Test 3: Authentication
echo "Testing auth endpoint..."
RESPONSE=$(curl -s -X POST $API_BASE/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}')

if echo $RESPONSE | grep -q "success"; then
  echo "✅ Authentication working"
else
  echo "❌ Authentication failed"
fi
```

---

## Test Data Setup

### Create Test Users

```sql
-- Regular user
INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
VALUES ('test@example.com', '[hash]', 'Test', 'User', 0);

-- Admin user
INSERT INTO users (email, password_hash, first_name, last_name, is_admin)
VALUES ('admin@example.com', '[hash]', 'Admin', 'User', 1);

-- User with certified dogs
INSERT INTO dogs (user_id, dog_name, license_id, state_of_licensure, payment_status, paid_at, expires_at)
VALUES (1, 'Max', 'CA-123456', 'California', 'paid', datetime('now'), datetime('now', '+24 months'));
```

---

## Reporting Issues

When reporting bugs, include:
1. Test case number
2. Steps to reproduce
3. Expected vs actual result
4. Browser/device information
5. Screenshots or error messages
6. Database state (if applicable)

**Example Bug Report:**
```
Test Case: S1 (SQL Injection)
Steps: Attempted SQL injection in login email field
Expected: Request rejected, no SQL error
Actual: Database error message exposed
Browser: Chrome 120
Screenshot: [attached]
```
