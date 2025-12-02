export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    try {
      const token = request.headers.get('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'No token provided' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const session = await env.DB.prepare(`
        SELECT s.user_id, u.email, u.id
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `).bind(token).first();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const data = await request.json();
      const licenseId = Math.floor(10000000 + Math.random() * 90000000).toString();
      const frameOrientation = data.frame_orientation || 'square';
      
      // Gift shipping fields
      const isGift = data.is_gift ? 1 : 0;
      const giftName = data.gift_name || null;
      const giftAddress = data.gift_address || null;
      const giftCity = data.gift_city || null;
      const giftState = data.gift_state || null;
      const giftZip = data.gift_zip || null;

      if (data.coupon === 'BETA2025') {
        await env.DB.prepare(
          `INSERT INTO dogs (user_id, dog_name, license_id, state_of_licensure, payment_status, paid_at, expires_at, photo_url, frame_orientation, is_gift, gift_name, gift_address, gift_city, gift_state, gift_zip, created_at) 
           VALUES (?, ?, ?, ?, 'paid', datetime('now'), date('now', '+2 years'), ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
        ).bind(
          session.user_id,
          data.dog_name,
          licenseId,
          data.state,
          data.photo_url || null,
          frameOrientation,
          isGift,
          giftName,
          giftAddress,
          giftCity,
          giftState,
          giftZip
        ).run();

        return new Response(JSON.stringify({
          success: true,
          licenseId: licenseId,
          free: true,
          message: 'Certification complete! BETA2025 coupon applied.'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (data.coupon === 'TEST99' || data.coupon === 'TEST99PERCENT') {
        await env.DB.prepare(
          `INSERT INTO dogs (user_id, dog_name, license_id, state_of_licensure, payment_status, photo_url, frame_orientation, is_gift, gift_name, gift_address, gift_city, gift_state, gift_zip, created_at, expires_at) 
           VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), date('now', '+2 years'))`
        ).bind(
          session.user_id,
          data.dog_name,
          licenseId,
          data.state,
          data.photo_url || null,
          frameOrientation,
          isGift,
          giftName,
          giftAddress,
          giftCity,
          giftState,
          giftZip
        ).run();

        const testPaymentUrl = env.STRIPE_PAYMENT_TEST_LINK 
          ? `${env.STRIPE_PAYMENT_TEST_LINK}?client_reference_id=${licenseId}&prefilled_email=${encodeURIComponent(session.email)}`
          : `${env.STRIPE_PAYMENT_LINK}?client_reference_id=${licenseId}&prefilled_email=${encodeURIComponent(session.email)}`;

        return new Response(JSON.stringify({
          success: true,
          sessionUrl: testPaymentUrl,
          test: true,
          message: data.coupon + ' coupon applied - $1.00 payment'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await env.DB.prepare(
        `INSERT INTO dogs (user_id, dog_name, license_id, state_of_licensure, payment_status, photo_url, frame_orientation, is_gift, gift_name, gift_address, gift_city, gift_state, gift_zip, created_at, expires_at) 
         VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), date('now', '+2 years'))`
      ).bind(
        session.user_id,
        data.dog_name,
        licenseId,
        data.state,
        data.photo_url || null,
        frameOrientation,
        isGift,
        giftName,
        giftAddress,
        giftCity,
        giftState,
        giftZip
      ).run();

      const paymentUrl = `${env.STRIPE_PAYMENT_LINK}?client_reference_id=${licenseId}&prefilled_email=${encodeURIComponent(session.email)}`;

      return new Response(JSON.stringify({
        success: true,
        sessionUrl: paymentUrl
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Checkout error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        details: 'Please try again or contact support'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
