# HTDA Security Remediation Plan
**Date:** 2025-12-19
**Priority:** CRITICAL
**Environment:** Cloudflare Workers

---

## OVERVIEW

This document outlines the remediation strategy for 5 critical security vulnerabilities discovered in the HTDA platform.

---

## VULNERABILITY 1: Password Hashing (CRITICAL)

### Current State
```javascript
// api-account.js:273-279
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
```

**Problem:** No salt, vulnerable to rainbow table attacks

### Cloudflare Workers Solution

Cloudflare Workers supports Web Crypto API but not Node.js `bcrypt`. We have three options:

**Option A: @cloudflare/workers-bcrypt (NOT AVAILABLE)**
- Package doesn't exist in Workers runtime

**Option B: Use scrypt from Web Crypto API (RECOMMENDED)**
```javascript
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);

  // Store: salt:hash
  return `${saltArray.map(b => b.toString(16).padStart(2, '0')).join('')}:${hashArray.map(b => b.toString(16).padStart(2, '0')).join('')}`;
}

async function verifyPassword(password, storedHash) {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return computedHash === hashHex;
}
```

**Option C: External bcrypt WASM module**
- Requires adding external dependency
- More complex deployment

### RECOMMENDATION: Option B (PBKDF2 with 100,000 iterations)

### Migration Strategy
1. Add new `hashPassword()` and `verifyPassword()` functions
2. Create migration endpoint for existing users
3. On first login after migration, re-hash password with new method
4. Mark old hashes with a flag in database
5. After 90 days, force password reset for unmigrated accounts

---

## VULNERABILITY 2: Admin Access Control (CRITICAL)

### Current State
```javascript
// admin.html:74-82
const isAdmin = localStorage.getItem('is_admin');
if (isAdmin !== '1') {
    alert('Access denied. Admin privileges required.');
    window.location.href = 'account.html';
}
```

**Problem:** Client-side only, easily bypassed via DevTools

### Solution: Server-Side Middleware

```javascript
// api-admin.js (NEW MIDDLEWARE)
async function requireAdmin(request, env, userId) {
  const user = await env.DB.prepare(
    'SELECT role FROM users WHERE id = ?'
  ).bind(userId).first();

  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized: Admin privileges required'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null; // Continue
}

// Apply to every admin endpoint:
export default {
  async fetch(request, env) {
    // ... auth check ...

    // Admin check
    const adminError = await requireAdmin(request, env, userId);
    if (adminError) return adminError;

    // ... rest of admin logic ...
  }
}
```

### Database Schema Update
```sql
-- Ensure users table has role column
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'));
CREATE INDEX idx_users_role ON users(role);
```

---

## VULNERABILITY 3: XSS via innerHTML (CRITICAL)

### Current State
12 files use `innerHTML` with potentially user-controlled data:
- `quiz.html` (lines 48, 57)
- `account.html`
- `verify.html`
- `header.js`
- `footer.js`
- etc.

### Solution: Replace with textContent or createElement

**BAD:**
```javascript
container.innerHTML = `<h3>${userName}</h3>`;
```

**GOOD:**
```javascript
const h3 = document.createElement('h3');
h3.textContent = userName;
container.appendChild(h3);
```

**OR use template literals for static HTML:**
```javascript
// Safe if no user input
container.innerHTML = `
  <div class="question-box" style="text-align: center;">
    <h3>Does your dog bring comfort?</h3>
  </div>
`;
```

### Remediation Checklist
- [ ] quiz.html: Replace dynamic innerHTML (SAFE - no user input in this case)
- [ ] account.html: Use textContent for user names
- [ ] verify.html: Use textContent for license data
- [ ] header.js: Use textContent for user email
- [ ] footer.js: (Check if user data used)
- [ ] All others: Audit and fix

---

## VULNERABILITY 4: Session Management (CRITICAL)

### Current State
```javascript
// Stored in localStorage
localStorage.setItem('session_token', token);
```

**Problems:**
1. Accessible to JavaScript (XSS can steal)
2. Not httpOnly
3. No SameSite protection
4. No secure flag

### Solution: HttpOnly Cookies (Cloudflare Workers)

**Server-Side (Cloudflare Worker):**
```javascript
export default {
  async fetch(request, env) {
    // After successful login
    const sessionToken = crypto.randomUUID();

    // Store in database
    await env.DB.prepare(
      `INSERT INTO sessions (token, user_id, expires_at)
       VALUES (?, ?, datetime('now', '+30 minutes'))`
    ).bind(sessionToken, userId).run();

    // Set httpOnly cookie
    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=1800; Path=/`
      }
    });
  }
}
```

**Client-Side:**
```javascript
// NO LONGER STORE IN localStorage
// Cookie is automatically sent with requests
async function apiCall(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: 'include' // Send cookies
  });
}
```

**Migration:** Requires client-side code changes to remove localStorage usage

---

## VULNERABILITY 5: CSRF Protection (CRITICAL)

### Current State
No CSRF tokens on any forms

### Solution: Double Submit Cookie Pattern

**Server-Side:**
```javascript
// On page load, generate CSRF token
function generateCSRFToken() {
  return crypto.randomUUID();
}

// Set as cookie AND return in response
return new Response(html, {
  headers: {
    'Set-Cookie': `csrf_token=${csrfToken}; Secure; SameSite=Strict; Path=/`
  }
});

// Validate on POST
async function validateCSRF(request) {
  const cookie = request.headers.get('Cookie');
  const csrfCookie = cookie?.match(/csrf_token=([^;]+)/)?.[1];

  const body = await request.json();
  const csrfBody = body._csrf;

  if (!csrfCookie || !csrfBody || csrfCookie !== csrfBody) {
    return new Response(JSON.stringify({
      error: 'CSRF token mismatch'
    }), { status: 403 });
  }

  return null; // Valid
}
```

**Client-Side:**
```javascript
// Add to all forms
<input type="hidden" name="_csrf" id="csrf-token">

<script>
  // Get CSRF token from cookie
  function getCSRFToken() {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf_token='))
      ?.split('=')[1];
  }

  document.getElementById('csrf-token').value = getCSRFToken();

  // Or for fetch requests
  fetch('/api/endpoint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      _csrf: getCSRFToken()
    })
  });
</script>
```

---

## IMPLEMENTATION PRIORITY

### Phase 1: Immediate (This Sprint)
1. ✅ Document vulnerabilities (this file)
2. ⏳ Fix admin role verification (add middleware)
3. ⏳ Fix XSS in critical paths (account.html, verify.html)
4. ⏳ Add CSRF to checkout/payment flows

### Phase 2: Next Sprint
1. ⏳ Implement PBKDF2 password hashing
2. ⏳ Create password migration script
3. ⏳ Migrate to httpOnly cookies
4. ⏳ Update all client-side code

### Phase 3: Monitoring
1. ⏳ Add security logging
2. ⏳ Monitor for attacks
3. ⏳ Regular security audits

---

## TESTING CHECKLIST

### Password Hashing
- [ ] New passwords hashed with PBKDF2
- [ ] Old passwords still work (during migration)
- [ ] Password verification works correctly
- [ ] Salt is unique per user

### Admin Access
- [ ] Admin endpoints reject non-admin users (403)
- [ ] Admin endpoints work for admin users (200)
- [ ] Client-side check removed/supplementary only
- [ ] Database role column exists

### XSS Protection
- [ ] User names display correctly
- [ ] Special characters don't break layout
- [ ] Scripts in user input don't execute
- [ ] All innerHTML usages audited

### Session Management
- [ ] Cookies set with HttpOnly flag
- [ ] Cookies set with Secure flag
- [ ] Cookies set with SameSite=Strict
- [ ] Sessions expire after 30 minutes
- [ ] Logout clears session

### CSRF Protection
- [ ] Forms include CSRF token
- [ ] POST requests without token rejected (403)
- [ ] Token validates correctly
- [ ] Token refreshes on each request

---

**End of Security Remediation Plan**
