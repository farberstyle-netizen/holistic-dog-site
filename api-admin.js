import { requireAdmin, getCORSHeaders, handleCORSPreflight } from './auth.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request);
    }

    // SECURITY: Require admin authentication via cookie
    const authResult = await requireAdmin(request, env);
    if (authResult instanceof Response) {
      return authResult; // Auth failed, return error response
    }

    const { user, session } = authResult;
    const corsHeaders = getCORSHeaders(request);

    try {

      // GET /stats - Get admin dashboard statistics
      if (path === '/stats' && request.method === 'GET') {
        
        // Count total certifications (all dogs)
        const totalCerts = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM dogs WHERE paid_at IS NOT NULL'
        ).first();

        // Count active dogs (not expired)
        const activeDogs = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM dogs WHERE expires_at > datetime("now") AND paid_at IS NOT NULL'
        ).first();

        // Count pending shipments
        const pendingShipments = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM dogs WHERE shipped_at IS NULL AND paid_at IS NOT NULL'
        ).first();

        // Get recent certifications (last 30 days)
        const recentCerts = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM dogs WHERE paid_at > datetime("now", "-30 days")'
        ).first();

        return jsonResponse({
          success: true,
          total_certifications: totalCerts?.count || 0,
          active_dogs: activeDogs?.count || 0,
          pending_shipments: pendingShipments?.count || 0,
          recent_certifications: recentCerts?.count || 0
        }, 200, corsHeaders);
      }

      // GET /recent-dogs - Get recently certified dogs
      if (path === '/recent-dogs' && request.method === 'GET') {
        const dogs = await env.DB.prepare(
          'SELECT dog_name, license_id, state_of_licensure, paid_at FROM dogs WHERE paid_at IS NOT NULL ORDER BY paid_at DESC LIMIT 10'
        ).all();

        return jsonResponse({
          success: true,
          dogs: dogs.results || []
        }, 200, corsHeaders);
      }

      return jsonResponse({ success: false, error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Admin API Error:', error);
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
