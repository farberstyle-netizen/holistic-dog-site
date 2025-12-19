export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

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
      // POST /request - Request password reset
      if (path === '/request') {
        const { email } = await request.json();

        if (!email) {
          return jsonResponse({ success: false, error: 'Email required' }, 400, corsHeaders);
        }

        const user = await env.DB.prepare(
          'SELECT id, email, first_name FROM users WHERE email = ?'
        ).bind(email.toLowerCase().trim()).first();

        // Always return success to prevent email enumeration
        if (!user) {
          return jsonResponse({
            success: true,
            message: 'If that email exists, a reset link has been sent'
          }, 200, corsHeaders);
        }

        // Generate secure reset token
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');

        // Store reset token (expires in 1 hour)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await env.DB.prepare(
          'INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at) VALUES (?, ?, ?, datetime("now"))'
        ).bind(user.id, resetToken, expiresAt.toISOString()).run();

        // TODO: Send reset email via SendGrid
        // For now, just log the reset link
        console.log(`Password reset requested for ${user.email}. Token: ${resetToken}`);

        return jsonResponse({
          success: true,
          message: 'If that email exists, a reset link has been sent'
        }, 200, corsHeaders);
      }

      // POST /reset - Reset password with token
      if (path === '/reset') {
        const { token, new_password } = await request.json();

        if (!token || !new_password) {
          return jsonResponse({ success: false, error: 'Token and new password required' }, 400, corsHeaders);
        }

        if (new_password.length < 8) {
          return jsonResponse({ success: false, error: 'Password must be at least 8 characters' }, 400, corsHeaders);
        }

        // Verify reset token
        const resetRecord = await env.DB.prepare(
          'SELECT user_id FROM password_reset_tokens WHERE token = ? AND expires_at > datetime("now") AND used_at IS NULL'
        ).bind(token).first();

        if (!resetRecord) {
          return jsonResponse({ success: false, error: 'Invalid or expired reset token' }, 400, corsHeaders);
        }

        // Hash new password with PBKDF2
        const newPasswordHash = await hashPassword(new_password);

        // Update user password
        await env.DB.prepare(
          'UPDATE users SET password_hash = ? WHERE id = ?'
        ).bind(newPasswordHash, resetRecord.user_id).run();

        // Mark token as used
        await env.DB.prepare(
          'UPDATE password_reset_tokens SET used_at = datetime("now") WHERE token = ?'
        ).bind(token).run();

        // Invalidate all existing sessions for this user
        await env.DB.prepare(
          'DELETE FROM sessions WHERE user_id = ?'
        ).bind(resetRecord.user_id).run();

        return jsonResponse({
          success: true,
          message: 'Password reset successful. Please log in with your new password'
        }, 200, corsHeaders);
      }

      return jsonResponse({ success: false, error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Reset password error:', error);
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
