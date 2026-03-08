/**
 * Cloudflare Worker to send form entries to email before Paddle checkout
 * 
 * Sends formatted email with:
 * - Product Name
 * - Amount
 * - Customer Email
 * - VIN Number
 *
 * Web3Forms Access Key: b396a128-42aa-46b7-8925-4cbd91f02d4e
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
            const {
                vin,
                plate,
                state,
                vehicleType,
                searchType,
                timestamp,
                // These may come from Paddle webhook or be passed manually
                productName,
                amount,
                customerEmail,
                customerName,
                transactionId
            } = data;

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

            // ─── Build display values ───────────────────────────────────────────────
            const displayProduct = productName || 'EpicVINrecord-standard';
            const displayAmount = amount ? `USD ${amount}` : 'USD 50.00';
            const displayEmail = customerEmail || 'N/A';
            const displayName = customerName || 'Valued Customer';
            const displayVIN = vin || plate || 'N/A';
            const displayTxnId = transactionId || 'N/A';
            const displayTime = timestamp
                ? new Date(timestamp).toLocaleString()
                : new Date().toLocaleString();

            // ─── Email subject ──────────────────────────────────────────────────────
            const emailSubject = `Payment Successful! New Vehicle Check — ${displayVIN}`;

            // ─── Email HTML (matching Image 2 template) ─────────────────────────────
            const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #1a1a2e;
      color: #e0e0e0;
      margin: 0;
      padding: 0;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      padding: 30px 20px;
    }
    .title {
      font-size: 26px;
      font-weight: bold;
      color: #00c853;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 15px;
      color: #cccccc;
      margin-bottom: 25px;
    }
    .card {
      background-color: #2a2a3e;
      border-radius: 10px;
      padding: 25px;
      margin-bottom: 20px;
    }
    .card-title {
      font-size: 17px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 18px;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    }
    .field {
      margin-bottom: 14px;
    }
    .label {
      font-weight: bold;
      color: #ffffff;
      font-size: 14px;
      display: block;
      margin-bottom: 3px;
    }
    .value {
      color: #90caf9;
      font-size: 14px;
    }
    .value.plain {
      color: #e0e0e0;
    }
    .footer {
      font-size: 12px;
      color: #777;
      text-align: center;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="title">Payment Successful! 🎉</div>
    <div class="subtitle">Hello Admin,<br>A new payment has been received for a vehicle history report.</div>

    <div class="card">
      <div class="card-title">Payment Details:</div>

      <div class="field">
        <span class="label">Transaction ID:</span>
        <span class="value plain">${displayTxnId}</span>
      </div>

      <div class="field">
        <span class="label">Product:</span>
        <span class="value plain">${displayProduct}</span>
      </div>

      <div class="field">
        <span class="label">Amount:</span>
        <span class="value plain">${displayAmount}</span>
      </div>

      <div class="field">
        <span class="label">Customer Email:</span>
        <span class="value">${displayEmail}</span>
      </div>

      <div class="field">
        <span class="label">Customer Name:</span>
        <span class="value plain">${displayName}</span>
      </div>

      ${vin ? `
      <div class="field">
        <span class="label">VIN:</span>
        <span class="value plain">${vin}</span>
      </div>` : ''}

      ${plate ? `
      <div class="field">
        <span class="label">License Plate:</span>
        <span class="value plain">${plate}</span>
      </div>` : ''}

      ${state ? `
      <div class="field">
        <span class="label">State:</span>
        <span class="value plain">${state}</span>
      </div>` : ''}

      ${vehicleType ? `
      <div class="field">
        <span class="label">Vehicle Type:</span>
        <span class="value plain">${vehicleType}</span>
      </div>` : ''}

      <div class="field">
        <span class="label">Timestamp:</span>
        <span class="value plain">${displayTime}</span>
      </div>
    </div>

    <div class="footer">
      This email was automatically generated from EpicVIN vehicle history check form.
    </div>
  </div>
</body>
</html>
`;

            // ─── Send via Web3Forms ─────────────────────────────────────────────────
            const body = new URLSearchParams({
                access_key: 'b396a128-42aa-46b7-8925-4cbd91f02d4e',
                subject: emailSubject,
                from_name: 'EpicVIN Report',
                to: 'car.check.store@gmail.com',
                message: `New payment received. VIN: ${displayVIN} | Email: ${displayEmail} | Amount: ${displayAmount}`,
                html: emailBody
            });

            const emailResponse = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body
            });

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
                console.error('❌ Web3Forms API error:', result.message || 'Unknown error');

                return new Response(JSON.stringify({
                    success: true,
                    emailSent: false,
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
            console.error('❌ Worker error:', error.message);

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