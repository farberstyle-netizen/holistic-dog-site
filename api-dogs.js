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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Require authentication
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        return jsonResponse({ success: false, error: 'No token provided' }, 401, corsHeaders);
      }

      const session = await env.DB.prepare(
        'SELECT user_id FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      ).bind(token).first();

      if (!session) {
        return jsonResponse({ success: false, error: 'Invalid or expired token' }, 401, corsHeaders);
      }

      // POST /upload-photo - Upload dog photo to R2
      if (path === '/upload-photo' && request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('photo');

        if (!file) {
          return jsonResponse({ success: false, error: 'No photo provided' }, 400, corsHeaders);
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return jsonResponse({
            success: false,
            error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image'
          }, 400, corsHeaders);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          return jsonResponse({
            success: false,
            error: 'File too large. Maximum size is 5MB'
          }, 400, corsHeaders);
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomBytes = new Uint8Array(8);
        crypto.getRandomValues(randomBytes);
        const randomStr = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
        const ext = file.type.split('/')[1];
        const filename = `${session.user_id}-${timestamp}-${randomStr}.${ext}`;

        // Upload to R2
        await env.R2_BUCKET.put(filename, file.stream(), {
          httpMetadata: {
            contentType: file.type
          }
        });

        return jsonResponse({
          success: true,
          filename: filename,
          url: filename
        }, 200, corsHeaders);
      }

      return jsonResponse({ success: false, error: 'Endpoint not found' }, 404, corsHeaders);

    } catch (error) {
      console.error('Dogs API error:', error);
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
