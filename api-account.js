export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    try {
      const authHeader = request.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (!token) {
        return jsonResponse({ success: false, error: "No token provided" }, 401, corsHeaders);
      }
      const session = await env.DB.prepare(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      ).bind(token).first();
      if (!session) {
        return jsonResponse({ success: false, error: "Invalid or expired token" }, 401, corsHeaders);
      }
      const userId = session.user_id;

      // GET /profile - Get user profile, dogs, orders, and saved addresses
      if (path === "/profile" && request.method === "GET") {
        const user = await env.DB.prepare(
          "SELECT id, email, first_name, last_name, address, city, state, zip, billing_name, billing_address, billing_city, billing_state, billing_zip FROM users WHERE id = ?"
        ).bind(userId).first();
        if (!user) {
          return jsonResponse({ success: false, error: "User not found" }, 404, corsHeaders);
        }
        
        // Get dogs with all fields needed by account.html
        const dogs = await env.DB.prepare(
          "SELECT id, dog_name, license_id, state_of_licensure, photo_url, paid_at, expires_at, breed, weight, height, eye_color, birthday FROM dogs WHERE user_id = ? AND payment_status = 'paid' ORDER BY paid_at DESC"
        ).bind(userId).all();
        
        // Get orders
        const orders = await env.DB.prepare(
          "SELECT dog_name, license_id, state_of_licensure, paid_at, expires_at FROM dogs WHERE user_id = ? AND payment_status = 'paid' ORDER BY paid_at DESC"
        ).bind(userId).all();
        
        // Get saved addresses
        const addresses = await env.DB.prepare(
          "SELECT id, label, name, address, city, state, zip FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all();
        
        return jsonResponse({
          success: true,
          user,
          dogs: dogs.results || [],
          orders: orders.results || [],
          saved_addresses: addresses.results || []
        }, 200, corsHeaders);
      }

      // PUT /update - Update shipping address
      if (path === "/update" && request.method === "PUT") {
        const data = await request.json();
        const result = await env.DB.prepare(
          `UPDATE users 
           SET first_name = ?, last_name = ?, address = ?, city = ?, state = ?, zip = ?
           WHERE id = ?`
        ).bind(
          data.first_name || null,
          data.last_name || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.zip || null,
          userId
        ).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Profile updated" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to update profile" }, 500, corsHeaders);
        }
      }

      // PUT /update-billing - Update billing address
      if (path === "/update-billing" && request.method === "PUT") {
        const data = await request.json();
        const result = await env.DB.prepare(
          `UPDATE users 
           SET billing_name = ?, billing_address = ?, billing_city = ?, billing_state = ?, billing_zip = ?
           WHERE id = ?`
        ).bind(
          data.billing_name || null,
          data.billing_address || null,
          data.billing_city || null,
          data.billing_state || null,
          data.billing_zip || null,
          userId
        ).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Billing address updated" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to update billing address" }, 500, corsHeaders);
        }
      }

      // PUT /update-dog - Update dog details
      if (path === "/update-dog" && request.method === "PUT") {
        const data = await request.json();
        if (!data.dog_id) {
          return jsonResponse({ success: false, error: "Missing dog_id" }, 400, corsHeaders);
        }
        // Verify dog belongs to user
        const dog = await env.DB.prepare(
          "SELECT id FROM dogs WHERE id = ? AND user_id = ?"
        ).bind(data.dog_id, userId).first();
        if (!dog) {
          return jsonResponse({ success: false, error: "Dog not found" }, 404, corsHeaders);
        }
        const result = await env.DB.prepare(
          `UPDATE dogs 
           SET breed = ?, weight = ?, height = ?, eye_color = ?, birthday = ?
           WHERE id = ? AND user_id = ?`
        ).bind(
          data.breed || null,
          data.weight || null,
          data.height || null,
          data.eye_color || null,
          data.birthday || null,
          data.dog_id,
          userId
        ).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Dog details updated" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to update dog" }, 500, corsHeaders);
        }
      }

      // POST /saved-address - Add a new saved address
      if (path === "/saved-address" && request.method === "POST") {
        const data = await request.json();
        if (!data.label || !data.name || !data.address || !data.city || !data.state || !data.zip) {
          return jsonResponse({ success: false, error: "Missing required fields" }, 400, corsHeaders);
        }
        const result = await env.DB.prepare(
          `INSERT INTO saved_addresses (user_id, label, name, address, city, state, zip, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          userId,
          data.label,
          data.name,
          data.address,
          data.city,
          data.state,
          data.zip
        ).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Address saved", id: result.meta.last_row_id }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to save address" }, 500, corsHeaders);
        }
      }

      // PUT /saved-address - Update a saved address
      if (path === "/saved-address" && request.method === "PUT") {
        const data = await request.json();
        if (!data.id) {
          return jsonResponse({ success: false, error: "Missing address id" }, 400, corsHeaders);
        }
        // Verify address belongs to user
        const addr = await env.DB.prepare(
          "SELECT id FROM saved_addresses WHERE id = ? AND user_id = ?"
        ).bind(data.id, userId).first();
        if (!addr) {
          return jsonResponse({ success: false, error: "Address not found" }, 404, corsHeaders);
        }
        const result = await env.DB.prepare(
          `UPDATE saved_addresses 
           SET label = ?, name = ?, address = ?, city = ?, state = ?, zip = ?
           WHERE id = ? AND user_id = ?`
        ).bind(
          data.label || null,
          data.name || null,
          data.address || null,
          data.city || null,
          data.state || null,
          data.zip || null,
          data.id,
          userId
        ).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Address updated" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to update address" }, 500, corsHeaders);
        }
      }

      // DELETE /saved-address - Delete a saved address
      if (path === "/saved-address" && request.method === "DELETE") {
        const data = await request.json();
        if (!data.id) {
          return jsonResponse({ success: false, error: "Missing address id" }, 400, corsHeaders);
        }
        const result = await env.DB.prepare(
          "DELETE FROM saved_addresses WHERE id = ? AND user_id = ?"
        ).bind(data.id, userId).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Address deleted" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to delete address" }, 500, corsHeaders);
        }
      }

      // GET /saved-addresses - List all saved addresses
      if (path === "/saved-addresses" && request.method === "GET") {
        const addresses = await env.DB.prepare(
          "SELECT id, label, name, address, city, state, zip FROM saved_addresses WHERE user_id = ? ORDER BY created_at DESC"
        ).bind(userId).all();
        return jsonResponse({
          success: true,
          addresses: addresses.results || []
        }, 200, corsHeaders);
      }

      // PUT /change-password - Change password
      if (path === "/change-password" && request.method === "PUT") {
        const data = await request.json();
        if (!data.current_password || !data.new_password) {
          return jsonResponse({ success: false, error: "Missing required fields" }, 400, corsHeaders);
        }

        // Validate new password strength
        if (data.new_password.length < 8) {
          return jsonResponse({ success: false, error: "Password must be at least 8 characters" }, 400, corsHeaders);
        }

        const user = await env.DB.prepare(
          "SELECT password_hash FROM users WHERE id = ?"
        ).bind(userId).first();
        if (!user) {
          return jsonResponse({ success: false, error: "User not found" }, 404, corsHeaders);
        }

        // Verify current password using new verification function
        const passwordMatch = await verifyPassword(data.current_password, user.password_hash);
        if (!passwordMatch) {
          return jsonResponse({ success: false, error: "Current password is incorrect" }, 401, corsHeaders);
        }

        // Hash new password with PBKDF2
        const newHash = await hashPassword(data.new_password);
        const result = await env.DB.prepare(
          "UPDATE users SET password_hash = ? WHERE id = ?"
        ).bind(newHash, userId).run();
        if (result.success) {
          return jsonResponse({ success: true, message: "Password changed successfully" }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: "Failed to change password" }, 500, corsHeaders);
        }
      }

      return jsonResponse({ success: false, error: "Endpoint not found" }, 404, corsHeaders);
    } catch (error) {
      console.error("API Error:", error);
      return jsonResponse({
        success: false,
        error: "Internal server error",
        details: error.message
      }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}

// Secure password hashing using PBKDF2 with salt
// Format: salt:hash (both hex-encoded)
async function hashPassword(password) {
  // Generate random 16-byte salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to key material
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2 with 100,000 iterations
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    256 // 32 bytes
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${hashHex}`;
}

// Verify password against stored hash
async function verifyPassword(password, storedHash) {
  // Handle legacy SHA-256 hashes (64 hex chars, no colon)
  if (storedHash.length === 64 && !storedHash.includes(':')) {
    // Legacy verification
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hash === storedHash;
  }

  // New PBKDF2 verification
  const [saltHex, expectedHashHex] = storedHash.split(':');
  if (!saltHex || !expectedHashHex) return false;

  // Convert hex salt back to Uint8Array
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));

  // Derive key with same parameters
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex === expectedHashHex;
}
