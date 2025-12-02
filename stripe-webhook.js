// =========================================
// Cloudflare Worker: stripe-webhook
// Purpose: Handle Stripe payment completion + send confirmation email
// =========================================

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.text();
      const event = JSON.parse(body);

      // Handle successful payment
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const licenseId = session.client_reference_id;

        if (!licenseId) {
          console.error('No license ID in payment session');
          return new Response(JSON.stringify({ received: true }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Get dog record by license_id (set during checkout)
        const dog = await env.DB.prepare(
          'SELECT id, dog_name, user_id, state_of_licensure, is_gift, gift_name FROM dogs WHERE license_id = ?'
        ).bind(licenseId).first();

        if (!dog) {
          console.error('No dog found for license_id:', licenseId);
          return new Response(JSON.stringify({ received: true }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Get user email
        const user = await env.DB.prepare(
          'SELECT email, first_name FROM users WHERE id = ?'
        ).bind(dog.user_id).first();

        // Calculate expiry date (2 years from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
        const expiryDateStr = expiryDate.toISOString().split('T')[0];
        const expiryFormatted = expiryDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        // Update dog record
        await env.DB.prepare(`
          UPDATE dogs
          SET payment_status = 'paid',
              expires_at = ?,
              paid_at = datetime('now')
          WHERE id = ?
        `).bind(expiryDateStr, dog.id).run();

        console.log(`✅ Payment successful - Dog: ${dog.dog_name}, License: ${licenseId}`);

        // Send confirmation email
        if (user && user.email) {
          await sendConfirmationEmail(user, dog, licenseId, expiryFormatted);
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Webhook error:', error);
      return new Response(`Webhook Error: ${error.message}`, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

async function sendConfirmationEmail(user, dog, licenseId, expiryDate) {
  const giftNote = dog.is_gift 
    ? `<p style="background: #fef3c7; padding: 12px; border-radius: 6px; margin: 20px 0;">🎁 <strong>Gift Order:</strong> This certification will be shipped to ${dog.gift_name}.</p>`
    : '';

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #5C1E2C 0%, #8B2942 100%); padding: 30px; text-align: center;">
              <h1 style="color: #B89A6A; margin: 0; font-size: 28px; font-weight: normal;">Holistic Therapy Dog Association</h1>
            </td>
          </tr>
          
          <!-- Gold Bar -->
          <tr>
            <td style="background-color: #B89A6A; height: 4px;"></td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #5C1E2C; margin: 0 0 20px 0; font-size: 24px;">Order Confirmed!</h2>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear ${user.first_name || 'Friend'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for your order. We are honored to certify <strong>${dog.dog_name}</strong> as an official Holistic Therapy Dog.
              </p>

              ${giftNote}
              
              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #faf6f0; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #5C1E2C; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #B89A6A; padding-bottom: 10px;">Certification Details</h3>
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="color: #666; width: 140px;">Dog's Name:</td>
                        <td style="color: #333; font-weight: bold;">${dog.dog_name}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">License Number:</td>
                        <td style="color: #333; font-weight: bold;">${licenseId}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">State:</td>
                        <td style="color: #333; font-weight: bold;">${dog.state_of_licensure}</td>
                      </tr>
                      <tr>
                        <td style="color: #666;">Valid Through:</td>
                        <td style="color: #333; font-weight: bold;">${expiryDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Shipping Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff8e7; border-left: 4px solid #B89A6A; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #5a4a2a; margin: 0; font-size: 15px;">
                      📦 <strong>Shipping:</strong> Your official embossed diploma will ship within 3-5 business days. You'll receive tracking information once it's on its way.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                You can verify your dog's certification anytime at our public registry.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://holistictherapydogassociation.com/verify.html?q=${licenseId}" 
                       style="background-color: #B89A6A; color: #5C1E2C; padding: 14px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; display: inline-block;">
                      View Certification
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                Questions? Reply to this email or visit our <a href="https://holistictherapydogassociation.com/contact.html" style="color: #B89A6A;">Contact Page</a>.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #5C1E2C; padding: 25px; text-align: center;">
              <p style="color: #B89A6A; margin: 0 0 10px 0; font-size: 14px;">
                Holistic Therapy Dog Association
              </p>
              <p style="color: #999; margin: 0; font-size: 12px;">
                245 Park Ave, New York, NY 10167
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: user.email }],
          subject: `🎓 ${dog.dog_name} is Now Certified!`
        }],
        from: { 
          email: 'noreply@holistictherapydogassociation.com', 
          name: 'Holistic Therapy Dog Association' 
        },
        reply_to: {
          email: 'support@holistictherapydogassociation.com',
          name: 'HTDA Support'
        },
        content: [{
          type: 'text/html',
          value: emailHtml
        }]
      })
    });

    if (response.ok) {
      console.log(`✅ Confirmation email sent to ${user.email}`);
    } else {
      const errorText = await response.text();
      console.error('SendGrid error:', response.status, errorText);
    }
  } catch (error) {
    console.error('Email send error:', error);
  }
}
