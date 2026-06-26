/**
 * Cloudflare Worker — EpicVINrecord
 *
 * Routes:
 *   POST /upload-proof  — payment proof upload (multipart) → email rmoto7817@gmail.com
 *   POST /              — VIN/plate check notification → email car.check.store@gmail.com
 *
 * Setup:
 * 1. Deploy to Cloudflare Workers
 * 2. Update PROOF_UPLOAD_API in main-site/js/payment-config.js with your worker URL
 */

const WEB3FORMS_ACCESS_KEY = 'b396a128-42aa-46b7-8925-4cbd91f02d4e';
const PROOF_EMAIL_TO = 'rmoto7817@gmail.com';
const NOTIFY_EMAIL_TO = 'car.check.store@gmail.com';
const MAX_PROOF_FILE_BYTES = 4 * 1024 * 1024;

const ALLOWED_PROOF_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function isUploadProofRequest(url) {
  const path = url.pathname.replace(/\/+$/, '');
  return path.endsWith('/upload-proof');
}

async function sendWeb3FormsEmail({ subject, to, message, html }) {
  const body = new URLSearchParams({
    access_key: WEB3FORMS_ACCESS_KEY,
    subject,
    from_name: 'EpicVINrecord',
    to,
    message,
    html,
  });

  const emailResponse = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  return emailResponse.json();
}

async function handleProofUpload(request) {
  const formData = await request.formData();

  const proof = formData.get('proof');
  const email = String(formData.get('email') || '').trim();
  const vin = String(formData.get('vin') || '').trim();
  const plate = String(formData.get('plate') || '').trim();
  const carModel = String(formData.get('carModel') || '').trim();
  const year = String(formData.get('year') || '').trim();
  const amount = String(formData.get('amount') || '52.99').trim();
  const notes = String(formData.get('notes') || '').trim();

  const identifier = vin || plate;

  if (!email || !identifier) {
    return jsonResponse({ success: false, message: 'Email and VIN/plate are required.' }, 400);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return jsonResponse({ success: false, message: 'Please provide a valid email address.' }, 400);
  }

  if (!proof || typeof proof === 'string') {
    return jsonResponse({ success: false, message: 'Payment proof file is required.' }, 400);
  }

  if (proof.size > MAX_PROOF_FILE_BYTES) {
    return jsonResponse({ success: false, message: 'File is too large. Maximum size is 4MB.' }, 400);
  }

  if (!ALLOWED_PROOF_TYPES.has(proof.type)) {
    return jsonResponse({ success: false, message: 'Invalid file type. Upload an image or PDF.' }, 400);
  }

  const formattedDate = new Date().toLocaleString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const fileBuffer = await proof.arrayBuffer();
  const bytes = new Uint8Array(fileBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const isImage = proof.type.startsWith('image/');

  let proofHtml = '';
  if (isImage) {
    proofHtml = `<p><strong>Payment Screenshot:</strong></p><img src="data:${proof.type};base64,${base64}" alt="Payment proof" style="max-width:100%;border:1px solid #ddd;border-radius:8px;" />`;
  } else {
    proofHtml = `<p><strong>Attachment:</strong> ${proof.name || 'payment-proof.pdf'} (${proof.type}, ${Math.round(proof.size / 1024)} KB)</p><p>PDF proof attached as base64 below for manual retrieval if needed.</p><textarea readonly style="width:100%;height:80px;font-size:10px;">data:${proof.type};base64,${base64.substring(0, 500)}…</textarea>`;
  }

  const emailSubject = `Payment Proof - ${identifier} (${carModel || 'Vehicle'}) - £${amount}`;
  const plainMessage = [
    'Payment Proof Submitted',
    '',
    `VIN/Plate: ${identifier}`,
    `Car Model: ${carModel || 'N/A'}`,
    `Year: ${year || 'N/A'}`,
    `Customer Email: ${email}`,
    `Amount Paid: £${amount}`,
    `Submitted: ${formattedDate}`,
    `Notes: ${notes || 'None'}`,
    `File: ${proof.name || 'payment-proof'} (${proof.type})`,
  ].join('\n');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#2563eb;">Payment Proof Submitted</h2>
  <p><strong>VIN/Plate:</strong> ${identifier}</p>
  <p><strong>Car Model:</strong> ${carModel || 'N/A'}</p>
  <p><strong>Year:</strong> ${year || 'N/A'}</p>
  <p><strong>Customer Email:</strong> ${email}</p>
  <p><strong>Amount Paid:</strong> £${amount}</p>
  <p><strong>Submitted:</strong> ${formattedDate}</p>
  <p><strong>Notes:</strong> ${notes || 'None'}</p>
  ${proofHtml}
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />
  <p style="font-size:12px;color:#666;">Automated notification from EpicVINrecord</p>
</body>
</html>`;

  const result = await sendWeb3FormsEmail({
    subject: emailSubject,
    to: PROOF_EMAIL_TO,
    message: plainMessage,
    html: htmlBody,
  });

  if (result.success) {
    return jsonResponse({ success: true, message: 'Payment proof submitted successfully.' });
  }

  console.error('Proof email failed:', result);
  return jsonResponse(
    { success: false, message: result.message || 'Failed to submit payment proof. Please try again.' },
    500
  );
}

async function handleVinNotify(request) {
  const rawData = await request.json();
  console.log('Received data:', JSON.stringify(rawData, null, 2));

  let data = rawData;
  let isPaddleWebhook = false;

  if (rawData.event_type && rawData.data) {
    isPaddleWebhook = true;
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
      status: paddleData.status,
    };

    if (!data.product_name && paddleData.items && paddleData.items.length > 0) {
      const firstItem = paddleData.items[0];
      if (firstItem.price && firstItem.price.product && firstItem.price.product.name) {
        data.product_name = firstItem.price.product.name;
      }
    }
  }

  const {
    vin, plate, state, vehicleType, searchType, timestamp,
    product_name, productName, amount, transactionId,
    customerEmail, occurredAt, status,
  } = data;

  const displayProduct = product_name || productName || 'EpicVIN Standard Report';
  const displayAmount = amount ? (typeof amount === 'object' ? `${amount.amount} ${amount.currency_code}` : amount) : 'N/A';
  const displayVIN = vin || plate || 'N/A';
  const displayTime = occurredAt || timestamp || new Date().toISOString();

  if (!vin && !plate && !isPaddleWebhook) {
    return jsonResponse({ error: 'VIN or Plate required' }, 400);
  }

  const emailSubject = isPaddleWebhook
    ? `Payment Successful! New Vehicle Check — ${displayVIN}`
    : `New ${searchType === 'vin' ? 'VIN' : 'License Plate'} Check Request — ${displayVIN}`;

  const emailBody = `
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
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isPaddleWebhook ? 'Payment Successful!' : 'New Check Request'}</h1>
    </div>
    <div class="content">
      <div class="field"><span class="label">Product</span><div class="value">${displayProduct}</div></div>
      <div class="field"><span class="label">VIN/Plate</span><div class="value">${displayVIN}</div></div>
      ${isPaddleWebhook ? `
      <div class="field"><span class="label">Amount</span><div class="value">${displayAmount}</div></div>
      <div class="field"><span class="label">Customer Email</span><div class="value">${customerEmail || 'N/A'}</div></div>
      ` : `
      <div class="field"><span class="label">Vehicle Type</span><div class="value">${vehicleType || 'basic'}</div></div>
      `}
      ${state ? `<div class="field"><span class="label">State</span><div class="value">${state}</div></div>` : ''}
      <div class="field"><span class="label">Timestamp</span><div class="value">${new Date(displayTime).toLocaleString()}</div></div>
    </div>
    <div class="footer"><p>EpicVINrecord automated notification</p></div>
  </div>
</body>
</html>`;

  const result = await sendWeb3FormsEmail({
    subject: emailSubject,
    to: NOTIFY_EMAIL_TO,
    message: isPaddleWebhook
      ? `Payment successful for ${displayVIN}. Amount: ${displayAmount}.`
      : `New check request for ${displayVIN}. Type: ${vehicleType || 'basic'}.`,
    html: emailBody,
  });

  if (result.success) {
    return jsonResponse({ success: true, emailSent: true, message: 'Email sent successfully.' });
  }

  return jsonResponse({ success: true, emailSent: false, message: 'Request processed but email failed.', error: result.message });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      if (isUploadProofRequest(new URL(request.url))) {
        return await handleProofUpload(request);
      }
      return await handleVinNotify(request);
    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ success: false, message: error.message || 'Internal server error' }, 500);
    }
  },
};
