export default {
  async fetch(request, env) {
    // Public endpoint - allow all origins for gallery embeds
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ success: false, error: 'Method not allowed' }, 405, corsHeaders);
    }

    try {
      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Fetch certified dogs with photos
      const dogs = await env.DB.prepare(`
        SELECT
          dogs.id,
          dogs.dog_name,
          dogs.license_id,
          dogs.state_of_licensure,
          dogs.photo_url,
          dogs.frame_orientation,
          dogs.paid_at,
          users.first_name,
          users.last_name
        FROM dogs
        JOIN users ON dogs.user_id = users.id
        WHERE
          dogs.payment_status = 'paid'
          AND dogs.photo_url IS NOT NULL
        ORDER BY dogs.paid_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      // Get total count
      const countResult = await env.DB.prepare(`
        SELECT COUNT(*) as total
        FROM dogs
        WHERE payment_status = 'paid' AND photo_url IS NOT NULL
      `).first();

      return jsonResponse({
        success: true,
        dogs: dogs.results || [],
        total: countResult?.total || 0,
        limit,
        offset
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Gallery API error:', error);
      return jsonResponse({ success: false, error: 'Internal server error' }, 500, corsHeaders);
    }
  }
};

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders
    }
  });
}
