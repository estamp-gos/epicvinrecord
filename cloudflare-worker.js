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
      const data = await request.json();
      
      // Extract form data
      const { vin, plate, state, vehicleType, searchType, timestamp } = data;

      // Validate that we have at least VIN or Plate
      if (!vin && !plate) {
        return new Response(JSON.stringify({ error: 'VIN or Plate required' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Build email content
      const emailSubject = `New ${searchType === 'vin' ? 'VIN' : 'License Plate'} Check Request`;
      
      let emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #0084ff; color: white; padding: 20px; text-align: center; }
    .content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; border-radius: 5px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #0084ff; }
    .value { color: #333; padding: 5px 0; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 New Vehicle Check Request</h1>
    </div>
    <div class="content">
      <h2>Vehicle Information</h2>
`;

      // Add VIN if provided
      if (vin) {
        emailBody += `
      <div class="field">
        <div class="label">VIN Number:</div>
        <div class="value">${vin}</div>
      </div>
`;
      }

      // Add Plate if provided
      if (plate) {
        emailBody += `
      <div class="field">
        <div class="label">License Plate:</div>
        <div class="value">${plate}</div>
      </div>
`;
      }

      // Add State if provided
      if (state) {
        emailBody += `
      <div class="field">
        <div class="label">State:</div>
        <div class="value">${state}</div>
      </div>
`;
      }

      // Add Vehicle Type
      if (vehicleType) {
        emailBody += `
      <div class="field">
        <div class="label">Vehicle Type:</div>
        <div class="value">${vehicleType}</div>
      </div>
`;
      }

      // Add Search Type
      emailBody += `
      <div class="field">
        <div class="label">Search Type:</div>
        <div class="value">${searchType || 'N/A'}</div>
      </div>
`;

      // Add Timestamp
      if (timestamp) {
        emailBody += `
      <div class="field">
        <div class="label">Timestamp:</div>
        <div class="value">${new Date(timestamp).toLocaleString()}</div>
      </div>
`;
      }

      emailBody += `
    </div>
    <div class="footer">
      <p>This email was automatically generated from EpicVIN vehicle history check form.</p>
    </div>
  </div>
</body>
</html>
`;

      // Send email using Web3Forms - Free, No configuration needed
      // Web3Forms is completely free and doesn't require any setup
      const formData = new FormData();
      formData.append('access_key', '8a31cfe9-5cd5-4f84-8f73-3fe00c6753e2');
      formData.append('subject', emailSubject);
      formData.append('from_name', 'EpicVIN Report');
      formData.append('to', 'car.check.store@gmail.com');
      formData.append('message', emailBody);
      
      const emailResponse = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
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
          error: errorText
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
