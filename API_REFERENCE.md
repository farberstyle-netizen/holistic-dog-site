# HTDA API Reference
**Version:** 1.0
**Base URL:** Cloudflare Workers (various endpoints)
**Authentication:** Bearer token in Authorization header

---

## Table of Contents
1. [Authentication](#authentication)
2. [Account Management](#account-management)
3. [Dog Certification](#dog-certification)
4. [Admin Endpoints](#admin-endpoints)
5. [Error Codes](#error-codes)

---

## Authentication

### Session Token Storage
**Current:** localStorage (⚠️ Security Issue)
**Recommended:** HttpOnly cookies

**Headers:**
```
Authorization: Bearer {session_token}
```

---

## Account Management

Base URL: `https://api-account.{domain}.workers.dev`

### GET /profile
Get user profile, dogs, and orders

**Request:**
```http
GET /profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "address": "123 Main St",
    "city": "Boston",
    "state": "MA",
    "zip": "02101",
    "billing_name": "John Doe",
    "billing_address": "123 Main St",
    "billing_city": "Boston",
    "billing_state": "MA",
    "billing_zip": "02101"
  },
  "dogs": [
    {
      "id": 42,
      "dog_name": "Max",
      "license_id": "12345678",
      "state_of_licensure": "MA",
      "photo_url": "https://...",
      "paid_at": "2025-01-15T10:30:00Z",
      "expires_at": "2027-01-15",
      "breed": "Golden Retriever",
      "weight": "70",
      "height": "24",
      "eye_color": "Brown",
      "birthday": "2020-05-15"
    }
  ],
  "orders": [
    {
      "dog_name": "Max",
      "license_id": "12345678",
      "state_of_licensure": "MA",
      "paid_at": "2025-01-15T10:30:00Z",
      "expires_at": "2027-01-15"
    }
  ],
  "saved_addresses": [
    {
      "id": 1,
      "label": "Home",
      "name": "John Doe",
      "address": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "zip": "02101"
    }
  ]
}
```

**Errors:**
- `401`: Invalid or expired token
- `404`: User not found

---

### PUT /update
Update shipping address

**Request:**
```http
PUT /update
Authorization: Bearer {token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "address": "456 Oak Ave",
  "city": "Cambridge",
  "state": "MA",
  "zip": "02138"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated"
}
```

**Errors:**
- `401`: Unauthorized
- `500`: Database error

---

### PUT /update-billing
Update billing address

**Request:**
```http
PUT /update-billing
Authorization: Bearer {token}
Content-Type: application/json

{
  "billing_name": "John Doe",
  "billing_address": "456 Oak Ave",
  "billing_city": "Cambridge",
  "billing_state": "MA",
  "billing_zip": "02138"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Billing address updated"
}
```

---

### PUT /update-dog
Update dog details

**Request:**
```http
PUT /update-dog
Authorization: Bearer {token}
Content-Type: application/json

{
  "dog_id": 42,
  "breed": "Golden Retriever",
  "weight": "72",
  "height": "24",
  "eye_color": "Brown",
  "birthday": "2020-05-15"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dog details updated"
}
```

**Errors:**
- `400`: Missing dog_id
- `404`: Dog not found or doesn't belong to user

---

### POST /saved-address
Add a new saved address

**Request:**
```http
POST /saved-address
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Work",
  "name": "John Doe",
  "address": "789 Business Blvd",
  "city": "Boston",
  "state": "MA",
  "zip": "02101"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address saved",
  "id": 2
}
```

**Errors:**
- `400`: Missing required fields

---

### PUT /saved-address
Update an existing saved address

**Request:**
```http
PUT /saved-address
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 2,
  "label": "Office",
  "name": "John Doe",
  "address": "790 Business Blvd",
  "city": "Boston",
  "state": "MA",
  "zip": "02101"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address updated"
}
```

**Errors:**
- `400`: Missing address id
- `404`: Address not found or doesn't belong to user

---

### DELETE /saved-address
Delete a saved address

**Request:**
```http
DELETE /saved-address
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Address deleted"
}
```

---

### GET /saved-addresses
List all saved addresses

**Request:**
```http
GET /saved-addresses
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "addresses": [
    {
      "id": 1,
      "label": "Home",
      "name": "John Doe",
      "address": "123 Main St",
      "city": "Boston",
      "state": "MA",
      "zip": "02101"
    }
  ]
}
```

---

### PUT /change-password
Change user password

⚠️ **SECURITY WARNING:** Currently uses SHA-256 without salt. See [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md)

**Request:**
```http
PUT /change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldPassword123",
  "new_password": "newSecurePassword456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Current password is incorrect
- `404`: User not found

---

## Dog Certification

Base URL: `https://api-checkout.{domain}.workers.dev`

### POST /
Submit a new dog for certification

**Request:**
```http
POST /
Authorization: Bearer {token}
Content-Type: application/json

{
  "dog_name": "Max",
  "state": "MA",
  "photo_url": "https://...",
  "frame_orientation": "square",
  "coupon": "BETA2025",
  "is_gift": false,
  "gift_name": null,
  "gift_address": null,
  "gift_city": null,
  "gift_state": null,
  "gift_zip": null
}
```

**Response - Free Coupon (200):**
```json
{
  "success": true,
  "licenseId": "12345678",
  "free": true,
  "message": "Certification complete! BETA2025 coupon applied."
}
```

**Response - Test Coupon (200):**
```json
{
  "success": true,
  "sessionUrl": "https://checkout.stripe.com/...",
  "test": true,
  "message": "TEST99 coupon applied - $1.00 payment"
}
```

**Response - Regular Payment (200):**
```json
{
  "success": true,
  "sessionUrl": "https://checkout.stripe.com/..."
}
```

**Coupons:**
- `BETA2025` - Free certification
- `TEST99` / `TEST99PERCENT` - $1.00 test payment

**Gift Shipping:**
If `is_gift: true`, must provide:
- `gift_name`
- `gift_address`
- `gift_city`
- `gift_state`
- `gift_zip`

**Errors:**
- `401`: Invalid token
- `500`: Database or payment error

---

## Admin Endpoints

⚠️ **CRITICAL SECURITY ISSUE:** Admin access is currently client-side only. See [FORENSIC_ANALYSIS.md](./FORENSIC_ANALYSIS.md#12-admin-access-control---client-side-only--critical)

Base URL: `https://api-admin.{domain}.workers.dev`

### GET /stats
Get admin dashboard statistics

**Request:**
```http
GET /stats
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "total_certifications": 42,
  "active_dogs": 38
}
```

**Errors:**
- `403`: User is not admin ⚠️ NOT CURRENTLY ENFORCED

---

### GET /shipments
Get all shipments needing processing

**Request:**
```http
GET /shipments
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "shipments": [
    {
      "id": 1,
      "user_id": 123,
      "dog_name": "Max",
      "license_id": "12345678",
      "state_of_licensure": "MA",
      "photo_url": "https://...",
      "frame_orientation": "square",
      "is_gift": 0,
      "shipped": 0,
      "shipped_date": null
    }
  ]
}
```

---

### POST /mark-shipped
Mark a dog as shipped

**Request:**
```http
POST /mark-shipped
Authorization: Bearer {token}
Content-Type: application/json

{
  "dog_id": 42
}
```

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- `400`: Missing dog_id
- `403`: Not admin
- `404`: Dog not found

---

## Error Codes

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

### Common Error Response Format
```json
{
  "success": false,
  "error": "Error message here",
  "details": "Additional details (only in development)"
}
```

---

## Rate Limiting

**Current:** No rate limiting implemented
**Recommended:** Implement Cloudflare rate limiting rules

---

## CORS Configuration

All endpoints return the following CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

⚠️ **WARNING:** Wildcard CORS (`*`) allows any origin. Should be restricted to specific domains in production.

---

## Webhook Endpoints

### Stripe Webhook
`/stripe-webhook`

Handles payment confirmation from Stripe.

**Not documented here** - Internal use only

---

## Security Recommendations

See [SECURITY_REMEDIATION_PLAN.md](./SECURITY_REMEDIATION_PLAN.md) for:
- Password hashing improvements
- Session management with httpOnly cookies
- CSRF protection
- Admin role verification
- Rate limiting

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Dogs Table
```sql
CREATE TABLE dogs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  dog_name TEXT NOT NULL,
  license_id TEXT UNIQUE NOT NULL,
  state_of_licensure TEXT,
  payment_status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  expires_at DATE,
  photo_url TEXT,
  frame_orientation TEXT DEFAULT 'square',
  is_gift INTEGER DEFAULT 0,
  gift_name TEXT,
  gift_address TEXT,
  gift_city TEXT,
  gift_state TEXT,
  gift_zip TEXT,
  breed TEXT,
  weight TEXT,
  height TEXT,
  eye_color TEXT,
  birthday TEXT,
  shipped INTEGER DEFAULT 0,
  shipped_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Saved Addresses Table
```sql
CREATE TABLE saved_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

**End of API Reference**
