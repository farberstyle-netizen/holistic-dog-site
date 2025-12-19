export default {
  async fetch(request, env) {
    // Restrict CORS to production origin
    const origin = request.headers.get('Origin');
    const allowedOrigins = [
      'https://holistictherapydogassociation.com',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1:8080'
    ];
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return jsonResponse({ success: false, error: 'Email and password required' }, 400, corsHeaders);
      }

      // Fetch user with password hash
      const user = await env.DB.prepare(
        'SELECT id, email, password_hash, first_name, is_admin FROM users WHERE email = ?'
      ).bind(email.toLowerCase().trim()).first();

      if (!user) {
        return jsonResponse({ success: false, error: 'Invalid email or password' }, 401, corsHeaders);
      }

      // Verify password using constant-time comparison
      const isValid = await verifyPassword(password, user.password_hash);

      if (!isValid) {
        return jsonResponse({ success: false, error: 'Invalid email or password' }, 401, corsHeaders);
      }

      // Generate secure session token
      const tokenBytes = new Uint8Array(32);
      crypto.getRandomValues(tokenBytes);
      const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

      // Create session (expires in 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await env.DB.prepare(
        'INSERT INTO sessions (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))'
      ).bind(user.id, token, expiresAt.toISOString()).run();

      // Set HttpOnly, Secure, SameSite cookie for session
      const sessionCookie = `session_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`;

      return new Response(JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          is_admin: user.is_admin || false
        }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return jsonResponse({ success: false, error: 'Internal server error' }, 500, corsHeaders);
    }
  }
};

// Verify password using PBKDF2 with constant-time comparison
async function verifyPassword(password, storedHash) {
  try {
    // Parse stored hash: algo$iterations$salt$derivedKey
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      // Fallback for legacy SHA-256 hashes (migration path)
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return constantTimeCompare(hashHex, storedHash);
    }

    const iterations = parseInt(parts[1]);
    const salt = hexToBytes(parts[2]);
    const storedKey = parts[3];

    // Derive key from password
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
        iterations: iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      256
    );

    const derivedKey = Array.from(new Uint8Array(derivedBits))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return constantTimeCompare(derivedKey, storedKey);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Constant-time string comparison to prevent timing attacks
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Convert hex string to Uint8Array
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
}
