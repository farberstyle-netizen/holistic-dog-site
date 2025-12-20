import { requireAuth, getCORSHeaders, handleCORSPreflight } from './auth.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORSPreflight(request);
    }

    // SECURITY: Require authentication via cookie
    const authResult = await requireAuth(request, env);
    if (authResult instanceof Response) {
      return authResult; // Auth failed, return error response
    }

    const { user, session } = authResult;
    const corsHeaders = getCORSHeaders(request);

    try {

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
        const filename = `${user.id}-${timestamp}-${randomStr}.${ext}`;

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
