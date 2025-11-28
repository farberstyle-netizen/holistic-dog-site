export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Get token from Authorization header
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return jsonResponse({ success: false, error: 'No token provided' }, 401, corsHeaders);
      }

      // Verify session token
      const session = await env.DB.prepare(
        'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      ).bind(token).first();

      if (!session) {
        return jsonResponse({ success: false, error: 'Invalid or expired token' }, 401, corsHeaders);
      }

      const userId = session.user_id;

      // GET /profile - Get user profile with dogs and orders
      if (path === '/profile' && request.method === 'GET') {
        const user = await env.DB.prepare(
          'SELECT id, email, first_name, last_name, address, city, state, zip, billing_name, billing_address, billing_city, billing_state, billing_zip FROM users WHERE id = ?'
        ).bind(userId).first();

        if (!user) {
          return jsonResponse({ success: false, error: 'User not found' }, 404, corsHeaders);
        }

        // Get user's certified dogs
        const dogs = await env.DB.prepare(
          'SELECT dog_name, license_id, state_of_licensure, photo_url, paid_at, expires_at FROM dogs WHERE user_id = ? ORDER BY paid_at DESC'
        ).bind(userId).all();

        // Get user's orders (same as dogs for now)
        const orders = await env.DB.prepare(
          'SELECT dog_name, license_id, state_of_licensure, paid_at, expires_at FROM dogs WHERE user_id = ? ORDER BY paid_at DESC'
        ).bind(userId).all();

        return jsonResponse({
          success: true,
          user,
          dogs: dogs.results || [],
          orders: orders.results || []
        }, 200, corsHeaders);
      }

      // PUT /update - Update user profile/shipping address
      if (path === '/update' && request.method === 'PUT') {
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
          return jsonResponse({ success: true, message: 'Profile updated' }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: 'Failed to update profile' }, 500, corsHeaders);
        }
      }

      // PUT /update-billing - Update billing address
      if (path === '/update-billing' && request.method === 'PUT') {
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
          return jsonResponse({ success: true, message: 'Billing address updated' }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: 'Failed to update billing address' }, 500, corsHeaders);
        }
      }

      // PUT /change-password - Change user password
      if (path === '/change-password' && request.method === 'PUT') {
        const data = await request.json();
        
        if (!data.current_password || !data.new_password) {
          return jsonResponse({ success: false, error: 'Missing required fields' }, 400, corsHeaders);
        }

        // Get current password hash
        const user = await env.DB.prepare(
          'SELECT password_hash FROM users WHERE id = ?'
        ).bind(userId).first();

        if (!user) {
          return jsonResponse({ success: false, error: 'User not found' }, 404, corsHeaders);
        }

        // Verify current password (simple comparison - in production use proper hashing)
        // NOTE: This assumes passwords are hashed. If using plain text during testing, adjust accordingly.
        const currentHash = await hashPassword(data.current_password);
        
        if (user.password_hash !== data.current_password && user.password_hash !== currentHash) {
          return jsonResponse({ success: false, error: 'Current password is incorrect' }, 401, corsHeaders);
        }

        // Hash new password (in production use bcrypt or similar)
        const newHash = await hashPassword(data.new_password);

        // Update password
        const result = await env.DB.prepare(
          'UPDATE users SET password_hash = ? WHERE id = ?'
        ).bind(newHash, userId).run();

        if (result.success) {
          return jsonResponse({ success: true, message: 'Password changed successfully' }, 200, corsHeaders);
        } else {
          return jsonResponse({ success: false, error: 'Failed to change password' }, 500, corsHeaders);
        }
      }

      return jsonResponse({ success: false, error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }, 500, corsHeaders);
    }
  }
};

// Helper function for JSON responses
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
}

// Simple password hashing (in production use bcrypt or Cloudflare's Web Crypto API)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
