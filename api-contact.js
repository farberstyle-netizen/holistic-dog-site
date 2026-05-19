/**
 * api-contact.js — Cloudflare Worker: Contact Form Handler
 *
 * Accepts POST /api/contact with JSON body:
 *   { name, email, subject, message }
 *
 * Current behavior: validates payload, logs to Worker console, returns 200.
 *
 * TO WIRE EMAIL IN PRODUCTION:
 *   Option A — Mailchannels (free, Cloudflare-native):
 *     1. Add `send_email` binding in wrangler-api-contact.toml (see .sample file)
 *     2. Uncomment the MailChannels fetch block below
 *     3. Set CONTACT_TO_EMAIL secret: wrangler secret put CONTACT_TO_EMAIL
 *
 *   Option B — SendGrid / Postmark / Resend:
 *     1. Set API key secret: wrangler secret put EMAIL_API_KEY
 *     2. Replace the stub block below with the provider's API call
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://holistictherapydogassociation.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return json({ success: false, error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const { name, email, subject, message } = body;

    // Basic validation
    if (!name || !email || !message) {
      return json({ success: false, error: 'name, email, and message are required' }, 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, error: 'Invalid email address' }, 422);
    }
    if (message.length > 5000) {
      return json({ success: false, error: 'Message too long (max 5000 chars)' }, 422);
    }

    // Log payload to Cloudflare Worker logs (visible in wrangler tail or CF dashboard)
    console.log('contact_form_submission', JSON.stringify({
      name,
      email,
      subject: subject || '(no subject)',
      message_length: message.length,
      timestamp: new Date().toISOString(),
    }));

    /*
     * ── PRODUCTION EMAIL STUB (MailChannels) ──────────────────────────────
     * Uncomment and configure once CONTACT_TO_EMAIL secret is set.
     *
     * const toEmail = env.CONTACT_TO_EMAIL;
     * if (toEmail) {
     *   await fetch('https://api.mailchannels.net/tx/v1/send', {
     *     method: 'POST',
     *     headers: { 'Content-Type': 'application/json' },
     *     body: JSON.stringify({
     *       personalizations: [{ to: [{ email: toEmail }] }],
     *       from: { email: 'noreply@holistictherapydogassociation.com', name: 'HTDA Contact Form' },
     *       reply_to: { email, name },
     *       subject: `[HTDA Contact] ${subject || 'New message from ' + name}`,
     *       content: [{ type: 'text/plain', value: `From: ${name} <${email}>\n\n${message}` }],
     *     }),
     *   });
     * }
     * ─────────────────────────────────────────────────────────────────────
     */

    return json({ success: true, message: 'Message received. We will respond within 24–48 hours.' });
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
