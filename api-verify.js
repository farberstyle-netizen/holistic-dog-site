export default {
  async fetch(request, env) {
    // Public endpoint - allow all origins for verification widget embeds
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
      const query = url.searchParams.get('q');

      if (!query) {
        return jsonResponse({ success: false, error: 'Query parameter required' }, 400, corsHeaders);
      }

      // Search by license ID, dog name, or owner name
      const searchTerm = `%${query}%`;

      const dogs = await env.DB.prepare(`
        SELECT
          dogs.dog_name,
          dogs.license_id,
          dogs.state_of_licensure,
          dogs.photo_url,
          dogs.paid_at,
          dogs.expires_at,
          users.first_name,
          users.last_name
        FROM dogs
        JOIN users ON dogs.user_id = users.id
        WHERE
          dogs.payment_status = 'paid'
          AND (
            dogs.license_id LIKE ?
            OR dogs.dog_name LIKE ?
            OR users.first_name LIKE ?
            OR users.last_name LIKE ?
          )
        ORDER BY dogs.paid_at DESC
        LIMIT 20
      `).bind(searchTerm, searchTerm, searchTerm, searchTerm).all();

      return jsonResponse({
        success: true,
        results: dogs.results || [],
        count: dogs.results?.length || 0
      }, 200, corsHeaders);

    } catch (error) {
      console.error('Verify API error:', error);
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
