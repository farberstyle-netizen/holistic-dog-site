# API Configuration Migration Guide

## Overview
All hardcoded `.workers.dev` and `.r2.dev` URLs must be replaced with references to `api-config.js`.

## Implementation Pattern

### 1. Add api-config.js script to every HTML page
```html
<script src="api-config.js"></script>
<script src="header.js"></script>
<script src="footer.js"></script>
```

### 2. Replace hardcoded API URLs

**BEFORE:**
```javascript
const response = await fetch('https://api-account.farberstyle.workers.dev/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

**AFTER:**
```javascript
const response = await fetch(`${API_CONFIG.endpoints.account}/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
});
```

### 3. Replace hardcoded R2 URLs

**BEFORE:**
```html
<img src="https://pub-6ce181398b9b4e588bcc0db8db53f07a.r2.dev/${dog.photo_url}">
```

**AFTER:**
```html
<img src="${API_CONFIG.getPhotoUrl(dog.photo_url)}">
```

## Files Requiring Updates

- [ ] login.html - Line 127
- [ ] signup.html - Line 245
- [ ] verify.html - Lines 266, 273, 282
- [ ] account.html - Lines 160, 229, 268, 291, 314, 341
- [ ] checkout.html - Lines 438, 509
- [ ] admin.html - Line 87
- [ ] admin-shipments.html - Lines 146, 263
- [ ] forgot-password.html - Line 72
- [ ] reset-password.html - Line 89
- [ ] add-dog.html - Line 487
- [ ] add-dog-congrats.html - Lines 284, 301
- [ ] order-history.html - Line 81
- [ ] gallery.js - Line 18
- [ ] header.js - Line 155 (R2_URL)

## Production Deployment

After migrating to api-config.js, update Cloudflare Workers routes to serve from `api.holistictherapydogassociation.com` subdomain instead of `.workers.dev`.
