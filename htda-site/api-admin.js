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

      // Optional: Verify user is admin
      const user = await env.DB.prepare(
        'SELECT is_admin FROM users WHERE id = ?'
      ).bind(session.user_id).first();

      // If you have an is_admin column, uncomment this check:
      // if (!user?.is_admin) {
      //   return jsonResponse({ success: false, error: 'Unauthorized' }, 403, corsHeaders);
      // }

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
