/**
 * Cloudflare Worker to send form entries to email before Paddle checkout
 * 
 * This worker receives VIN/Plate form data and sends it via email
 * using Web3Forms (free email service - no configuration needed)
 * 
 * Setup Instructions:
 * 1. Go to Cloudflare Workers dashboard
 * 2. Create a new Worker
 * 3. Copy and paste this entire code
 * 4. Deploy the worker
 * 5. Get the worker URL (e.g., https://cold-hat-5fd3.rmoto7817.workers.dev/)
 * 6. Update index.html with your worker URL
 *
 * Web3Forms Access Key: 8a31cfe9-5cd5-4f84-8f73-3fe00c6753e2
 * Sends to: car.check.store@gmail.com
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // Parse the request body
      const rawData = await request.json();
      console.log('Received data:', JSON.stringify(rawData, null, 2));

      // Normalize data: Handle both direct form submissions and Paddle webhooks
      let data = rawData;
      let isPaddleWebhook = false;

      if (rawData.event_type && rawData.data) {
        isPaddleWebhook = true;
        // It's a Paddle webhook, merge custom_data into top level for easier access
        const paddleData = rawData.data;
        const customData = paddleData.custom_data || {};

        data = {
          ...customData,
          transactionId: paddleData.id || paddleData.transaction_id,
          amount: paddleData.amount || (paddleData.details && paddleData.details.totals && paddleData.details.totals.total),
          customerEmail: paddleData.customer && paddleData.customer.email,
          customerName: paddleData.customer && (paddleData.customer.name || `${paddleData.customer.first_name} ${paddleData.customer.last_name}`),
          eventType: rawData.event_type,
          eventId: rawData.id,
          occurredAt: rawData.occurred_at || new Date().toISOString(),
          status: paddleData.status
        };

        // Extraction of Product Name from Paddle:
        // 1. From custom_data (which we just merged)
        // 2. From items[0].price.product.name
        if (!data.product_name && paddleData.items && paddleData.items.length > 0) {
          const firstItem = paddleData.items[0];
          if (firstItem.price && firstItem.price.product && firstItem.price.product.name) {
            data.product_name = firstItem.price.product.name;
          }
        }
      }

      // Extract form data (works for both normalized Paddle data and direct submissions)
      const {
        vin,
        plate,
        state,
        vehicleType,
        searchType,
        timestamp,
        product_name,
        productName,
        amount,
        transactionId,
        customerEmail,
        eventType,
        eventId,
        occurredAt,
        status,
        customerName
      } = data;

      const displayProduct = product_name || productName || 'EpicVIN Standard Report';
      const displayAmount = amount ? (typeof amount === 'object' ? `${amount.amount} ${amount.currency_code}` : amount) : 'N/A';
      const displayVIN = vin || plate || 'N/A';
      const displayTime = occurredAt || timestamp || new Date().toISOString();

      // Validate that we have at least VIN or Plate (for form submissions)
      // For webhooks, we proceed anyway but log it
      if (!vin && !plate && !isPaddleWebhook) {
        return new Response(JSON.stringify({ error: 'VIN or Plate required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Build email content
      const emailSubject = isPaddleWebhook
        ? `Payment Successful! New Vehicle Check — ${displayVIN}`
        : `New ${searchType === 'vin' ? 'VIN' : 'License Plate'} Check Request — ${displayVIN}`;

      let emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f6; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background-color: ${isPaddleWebhook ? '#00c853' : '#0084ff'}; color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .field { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
    .label { font-weight: bold; color: ${isPaddleWebhook ? '#00c853' : '#0084ff'}; font-size: 14px; text-transform: uppercase; margin-bottom: 5px; display: block; }
    .value { font-size: 16px; color: #333; font-weight: 500; }
    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    h1 { margin: 0; font-size: 24px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: #e8f5e9; color: #2e7d32; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isPaddleWebhook ? '🎉 Payment Successful!' : '🚗 New Check Request'}</h1>
      <p style="margin-top: 10px; opacity: 0.9;">${isPaddleWebhook ? 'A new vehicle history report has been purchased.' : 'A customer has initiated a vehicle history check.'}</p>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Product Name</span>
        <div class="value">${displayProduct}</div>
      </div>

      <div class="field">
        <span class="label">Vehicle Identification (VIN/Plate)</span>
        <div class="value" style="font-family: monospace; letter-spacing: 1px;">${displayVIN}</div>
      </div>

      ${isPaddleWebhook ? `
      <div class="field">
        <span class="label">Amount Paid</span>
        <div class="value">${displayAmount}</div>
      </div>
      <div class="field">
        <span class="label">Transaction ID</span>
        <div class="value">${transactionId || 'N/A'}</div>
      </div>
      <div class="field">
        <span class="label">Customer Email</span>
        <div class="value">${customerEmail || 'N/A'}</div>
      </div>
      ` : `
      <div class="field">
        <span class="label">Vehicle Type</span>
        <div class="value">${vehicleType || 'sedan'}</div>
      </div>
      `}

      ${state ? `
      <div class="field">
        <span class="label">State</span>
        <div class="value">${state}</div>
      </div>` : ''}

      <div class="field">
        <span class="label">Timestamp</span>
        <div class="value">${new Date(displayTime).toLocaleString()}</div>
      </div>

      ${isPaddleWebhook ? `
      <div class="field" style="border: none;">
        <span class="label">Status</span>
        <div class="status-badge">${status || 'completed'}</div>
      </div>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated notification from <strong>EpicVINrecord</strong>.</p>
      <p>&copy; ${new Date().getFullYear()} EpicVINrecord Admin Portal</p>
    </div>
  </div>
</body>
</html>
`;


      // Send email using Web3Forms - Free, No configuration needed
      // Web3Forms is completely free and doesn't require any setup
      const body = new URLSearchParams({
        access_key: 'b396a128-42aa-46b7-8925-4cbd91f02d4e',
        subject: emailSubject,
        from_name: 'EpicVIN Report',
        to: 'car.check.store@gmail.com',
        message: isPaddleWebhook
          ? `Payment successful for ${displayVIN}. Amount: ${displayAmount}. Product: ${displayProduct}`
          : `New check request for ${displayVIN}. Type: ${vehicleType || 'sedan'}`,
        html: emailBody
      });

      const emailResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body
      });

      // Check if email was sent successfully
      const result = await emailResponse.json();

      if (emailResponse.ok && result.success) {
        console.log('✅ Email sent successfully via Web3Forms to car.check.store@gmail.com');
        return new Response(JSON.stringify({
          success: true,
          emailSent: true,
          message: 'Email sent successfully to car.check.store@gmail.com'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        // Log detailed error
        console.error('❌ Web3Forms API error:', result.message || 'Unknown error');
        console.error('Response status:', emailResponse.status);
        console.error('Full response:', result);

        // Still return success to not block the checkout, but flag email failure
        return new Response(JSON.stringify({
          success: true,  // Don't block user
          emailSent: false,  // But indicate email failed
          message: 'Request processed but email failed',
          error: result.message || 'Email failed'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

    } catch (error) {
      console.error('❌ Worker error:', error);
      console.error('Error details:', error.message);

      // Return success even on error to not block the user's checkout
      return new Response(JSON.stringify({
        success: true,
        emailSent: false,
        message: 'Request processed but encountered error',
        error: error.message
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};
