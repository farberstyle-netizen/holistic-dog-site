/**
 * API Logout Worker
 * Handles user logout by clearing session cookie and invalidating session in database
 */

import { getCORSHeaders, handleCORSPreflight, parseCookies } from './auth.js';

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request);
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: getCORSHeaders(request)
      });
    }

    try {
      // Get session token from cookie
      const cookieHeader = request.headers.get('Cookie');
      const cookies = {};

      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.trim().split('=');
          if (name && rest.length > 0) {
            cookies[name] = rest.join('=');
          }
        });
      }

      const sessionToken = cookies.session_token;

      // Delete session from database if it exists
      if (sessionToken) {
        try {
          await env.DB.prepare(
            'DELETE FROM sessions WHERE token = ?'
          ).bind(sessionToken).run();
        } catch (dbError) {
          console.error('Error deleting session:', dbError);
          // Continue anyway to clear cookie
        }
      }

      // Clear session cookie
      const headers = getCORSHeaders(request);
      headers['Set-Cookie'] = 'session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out successfully'
      }), {
        status: 200,
        headers
      });

    } catch (error) {
      console.error('Logout error:', error);

      // Still clear cookie even if there was an error
      const headers = getCORSHeaders(request);
      headers['Set-Cookie'] = 'session_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

      return new Response(JSON.stringify({
        success: true,
        message: 'Logged out (with errors)'
      }), {
        status: 200,
        headers
      });
    }
  }
};
