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
      const data = await request.json();
      const { email, password, first_name, last_name } = data;

      // Validation
      if (!email || !password || !first_name) {
        return jsonResponse({ success: false, error: 'Email, password, and first name required' }, 400, corsHeaders);
      }

      if (password.length < 8) {
        return jsonResponse({ success: false, error: 'Password must be at least 8 characters' }, 400, corsHeaders);
      }

      const emailLower = email.toLowerCase().trim();

      // Check if user already exists
      const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(emailLower).first();

      if (existing) {
        return jsonResponse({ success: false, error: 'Email already registered' }, 409, corsHeaders);
      }

      // Hash password with PBKDF2 (100,000 iterations)
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await env.DB.prepare(
        `INSERT INTO users (email, password_hash, first_name, last_name, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`
      ).bind(emailLower, passwordHash, first_name, last_name || null).run();

      if (!result.success) {
        return jsonResponse({ success: false, error: 'Failed to create account' }, 500, corsHeaders);
      }

      // Get the created user
      const user = await env.DB.prepare(
        'SELECT id, email, first_name FROM users WHERE email = ?'
      ).bind(emailLower).first();

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

      // Set HttpOnly, Secure, SameSite cookie
      const sessionCookie = `session_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`;

      return new Response(JSON.stringify({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name
        }
      }), {
        status: 201,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Set-Cookie': sessionCookie
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      return jsonResponse({ success: false, error: 'Internal server error' }, 500, corsHeaders);
    }
  }
};

// Hash password using PBKDF2 with 100,000 iterations
async function hashPassword(password) {
  const iterations = 100000;
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);

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
      salt: saltBytes,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    256
  );

  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const derivedKey = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Format: algo$iterations$salt$derivedKey
  return `pbkdf2$${iterations}$${salt}$${derivedKey}`;
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
