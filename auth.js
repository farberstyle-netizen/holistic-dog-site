/**
 * Shared authentication helper for cookie-based session validation
 * Used by all protected Cloudflare Workers
 */

/**
 * Parse cookies from Cookie header into an object
 * @param {string} cookieHeader - Raw Cookie header value
 * @returns {Object} Parsed cookies as key-value pairs
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}

/**
 * Validate session token from cookie against D1 database
 * @param {Request} request - Incoming request
 * @param {Object} env - Cloudflare environment bindings (must include DB)
 * @returns {Promise<{valid: boolean, user?: Object, session?: Object}>}
 */
export async function validateSession(request, env) {
  const cookieHeader = request.headers.get('Cookie');
  const cookies = parseCookies(cookieHeader);
  const sessionToken = cookies.session_token;

  if (!sessionToken) {
    return { valid: false, error: 'No session token' };
  }

  try {
    // Get session from database with user info
    const session = await env.DB.prepare(`
      SELECT
        s.token,
        s.user_id,
        s.expires_at,
        u.id,
        u.email,
        u.full_name,
        u.is_admin,
        u.photo_filename
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).bind(sessionToken).first();

    if (!session) {
      return { valid: false, error: 'Invalid or expired session' };
    }

    // Return session and user data
    return {
      valid: true,
      session: {
        token: session.token,
        user_id: session.user_id,
        expires_at: session.expires_at
      },
      user: {
        id: session.id,
        email: session.email,
        full_name: session.full_name,
        is_admin: session.is_admin === 1 || session.is_admin === true,
        photo_filename: session.photo_filename
      }
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Database error' };
  }
}

/**
 * Require authentication - returns 401 if not authenticated
 * @param {Request} request - Incoming request
 * @param {Object} env - Cloudflare environment bindings
 * @returns {Promise<{user: Object, session: Object} | Response>}
 */
export async function requireAuth(request, env) {
  const result = await validateSession(request, env);

  if (!result.valid) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Unauthorized - please log in'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return { user: result.user, session: result.session };
}

/**
 * Require admin authentication - returns 403 if not admin
 * @param {Request} request - Incoming request
 * @param {Object} env - Cloudflare environment bindings
 * @returns {Promise<{user: Object, session: Object} | Response>}
 */
export async function requireAdmin(request, env) {
  const authResult = await requireAuth(request, env);

  // If requireAuth returned a Response (error), return it
  if (authResult instanceof Response) {
    return authResult;
  }

  if (!authResult.user.is_admin) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Forbidden - admin access required'
    }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return authResult;
}

/**
 * Get CORS headers for authenticated endpoints
 * @param {Request} request - Incoming request
 * @param {boolean} allowCredentials - Whether to allow credentials
 * @returns {Object} CORS headers
 */
export function getCORSHeaders(request, allowCredentials = true) {
  const origin = request.headers.get('Origin');

  // Allowed origins for CORS
  const allowedOrigins = [
    'https://holistictherapydogassociation.com',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ];

  const headers = {
    'Content-Type': 'application/json'
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    if (allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    headers['Vary'] = 'Origin';
  }

  return headers;
}

/**
 * Handle OPTIONS preflight requests
 * @param {Request} request - Incoming request
 * @returns {Response} CORS preflight response
 */
export function handleCORSPreflight(request) {
  const headers = getCORSHeaders(request, true);
  headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Cookie';
  headers['Access-Control-Max-Age'] = '86400';

  return new Response(null, { status: 204, headers });
}
