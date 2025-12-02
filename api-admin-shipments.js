/**
 * API Admin Shipments Worker
 * Fetches all paid dogs with user info and gift addresses for shipment management
 * Deploy to: api-admin-shipments.farberstyle.workers.dev
 * Bindings needed: DB (holistic-dog-db)
 */

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (request.method === 'GET') {
        // Fetch all paid dogs with user info AND gift shipping info
        const { results } = await env.DB.prepare(`
          SELECT 
            dogs.id,
            dogs.dog_name,
            dogs.license_id,
            dogs.delivery_status,
            dogs.tracking_number,
            dogs.shipped_at,
            dogs.paid_at,
            dogs.is_gift,
            dogs.gift_name,
            dogs.gift_address,
            dogs.gift_city,
            dogs.gift_state,
            dogs.gift_zip,
            users.first_name,
            users.last_name,
            users.address,
            users.city,
            users.state,
            users.zip,
            users.email
          FROM dogs
          JOIN users ON dogs.user_id = users.id
          WHERE dogs.payment_status = 'paid'
          ORDER BY dogs.paid_at DESC
        `).all();

        // Transform results to include computed shipping address
        const shipments = results.map(row => ({
          id: row.id,
          dog_name: row.dog_name,
          license_id: row.license_id,
          delivery_status: row.delivery_status,
          tracking_number: row.tracking_number,
          shipped_at: row.shipped_at,
          paid_at: row.paid_at,
          is_gift: row.is_gift,
          email: row.email,
          // User's address (always include)
          owner_first_name: row.first_name,
          owner_last_name: row.last_name,
          owner_address: row.address,
          owner_city: row.city,
          owner_state: row.state,
          owner_zip: row.zip,
          // Ship-to address (gift address if is_gift, else user address)
          ship_to_name: row.is_gift ? row.gift_name : `${row.first_name} ${row.last_name}`,
          ship_to_address: row.is_gift ? row.gift_address : row.address,
          ship_to_city: row.is_gift ? row.gift_city : row.city,
          ship_to_state: row.is_gift ? row.gift_state : row.state,
          ship_to_zip: row.is_gift ? row.gift_zip : row.zip,
          // Legacy fields for backward compatibility
          first_name: row.first_name,
          last_name: row.last_name,
          address: row.is_gift ? row.gift_address : row.address,
          city: row.is_gift ? row.gift_city : row.city,
          state: row.is_gift ? row.gift_state : row.state,
          zip: row.is_gift ? row.gift_zip : row.zip
        }));

        return new Response(JSON.stringify({
          success: true,
          shipments: shipments
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (request.method === 'POST') {
        // Update tracking info
        const body = await request.json();
        const { dog_id, tracking_number, carrier } = body;

        if (!dog_id || !tracking_number) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Missing dog_id or tracking_number'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Update dog with tracking info
        await env.DB.prepare(`
          UPDATE dogs 
          SET 
            tracking_number = ?,
            shipped_at = datetime('now'),
            delivery_status = 'shipped'
          WHERE id = ?
        `).bind(tracking_number, dog_id).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Tracking updated'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Admin shipments error:', error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Server error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
