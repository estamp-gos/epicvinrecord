const nodemailer = require('nodemailer')

const HOME_URL = 'https://www.epicvinrecord.com/'
const CONTACT_URL = 'https://www.epicvinrecord.com/contact.html'
const REFUND_URL = 'https://www.epicvinrecord.com/refund-policy.html'
const LOGO_URL = 'https://www.epicvinrecord.com/img2/epicvin-logos/epicvinrecord-logo.png'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUPPORT_TO = 'epicvinrecordreport@gmail.com'

const HELP_OPTIONS = {
  not_received: 'I did not receive my report',
  report_issue: 'There is an issue with my report',
  incorrect_info: 'I entered incorrect vehicle information',
  request_refund: 'I would like to request a refund',
  other: 'Other'
}

const RESOLUTION_OPTIONS = {
  refund: 'Refund',
  corrected_report: 'Corrected/reissued report, if available',
  review_first: 'I would like support to review the issue first'
}

function createTransporter() {
  const user = String(process.env.GMAIL_USER || '').trim()
  const pass = String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
  if (!user || !pass) {
    throw new Error('Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.')
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass }
  })
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function parseBody(req) {
  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      body = {}
    }
  }
  return body && typeof body === 'object' ? body : {}
}

function clip(value, max) {
  return String(value || '').trim().slice(0, max)
}

function normalizeHelpWith(value) {
  const list = Array.isArray(value) ? value : [value]
  const labels = []
  const seen = {}
  for (const item of list) {
    const key = String(item || '').trim()
    if (!HELP_OPTIONS[key] || seen[key]) continue
    seen[key] = true
    labels.push(HELP_OPTIONS[key])
  }
  return labels
}

function emailShell(badge, heroTitle, heroSub, innerHtml, footerNote) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(heroTitle)} - EpicVINRecord</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f8fc; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f8fc; margin:0; padding:35px 15px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="padding:0 30px; height:58px; background:#ffffff; border-bottom:1px solid #edf1f5;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="left" valign="middle" height="58" style="height:58px;">
                                        <a href="${HOME_URL}" style="text-decoration:none;">
                                            <img src="${LOGO_URL}" alt="EpicVINRecord" height="40" style="display:block; max-height:40px; width:auto; max-width:175px; border:0;">
                                        </a>
                                    </td>
                                    <td align="right" valign="middle" height="58" style="height:58px; font-size:12px; color:#6b7280;">
                                        ${escapeHtml(badge)}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#eef7ff; padding:38px 35px 30px 35px; text-align:center;">
                            <h1 style="margin:0 0 12px 0; font-size:27px; line-height:35px; color:#111111; font-weight:700;">${escapeHtml(heroTitle)}</h1>
                            <p style="margin:0; font-size:15px; line-height:24px; color:#5b6573;">${escapeHtml(heroSub)}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 35px;">
                            ${innerHtml}
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #edf1f5;">
                            <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">&copy; 2026 EpicVINRecord. All Rights Reserved.</p>
                            <p style="margin:0; font-size:12px; line-height:20px; color:#9ca3af;">
                                <a href="${HOME_URL}" style="color:#6b7280; text-decoration:none;">Visit Website</a>
                                &nbsp; | &nbsp;
                                <a href="${CONTACT_URL}" style="color:#6b7280; text-decoration:none;">Contact Support</a>
                                &nbsp; | &nbsp;
                                <a href="${REFUND_URL}" style="color:#6b7280; text-decoration:none;">Refund Policy</a>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
                    <tr>
                        <td align="center" style="padding:18px 20px;">
                            <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">${escapeHtml(footerNote)}</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
}

function formatPurchaseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || 'Not provided'
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  })
}

function detailsTable(data) {
  const rows = [
    ['Order ID', data.orderId || 'Not provided'],
    ['Email', data.email],
    ['Vehicle Registration / VIN', data.vehicle],
    ['Purchase date', data.purchaseDateLabel],
    ['What we can help with', data.helpWith.join(', ')],
    ['Preferred resolution', data.resolution],
    ['Issue description', data.description]
  ]
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #edf1f5; border-radius:10px; overflow:hidden;">
    ${rows.map(([label, value], index) => `
      <tr>
        <td style="padding:12px 16px; background:${index % 2 ? '#ffffff' : '#f8fafc'}; border-bottom:1px solid #edf1f5; width:38%; font-size:13px; font-weight:700; color:#374151; vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:12px 16px; background:${index % 2 ? '#ffffff' : '#f8fafc'}; border-bottom:1px solid #edf1f5; font-size:13px; line-height:21px; color:#111827; white-space:pre-wrap;">${escapeHtml(value)}</td>
      </tr>
    `).join('')}
  </table>`
}

function buildCustomerHtml(data) {
  const inner = `
    <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">Hello,</p>
    <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">We have received your refund / order review request. It is now <strong>in process</strong>.</p>
    <p style="margin:0 0 22px 0; font-size:15px; line-height:25px; color:#374151;">Our support team will review your order and contact you at <strong>${escapeHtml(data.email)}</strong>. You will receive a response as soon as we have an update.</p>
    ${detailsTable(data)}
    <p style="margin:22px 0 0 0; font-size:15px; line-height:25px; color:#374151;">Please allow our team an opportunity to review your request before escalating the payment issue through your bank or card provider.</p>
    <p style="margin:18px 0 0 0; font-size:15px; line-height:25px; color:#374151;">Best regards,<br>EpicVINRecord Support Team</p>
  `
  return emailShell(
    'Request Received',
    'We Received Your Request',
    'Your refund request is in process. You will receive a response soon.',
    inner,
    'This email was sent because a refund or order review request was submitted on EpicVINRecord.'
  )
}

function buildAdminHtml(data) {
  const inner = `
    <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">A customer submitted a refund / order review request. Reply directly to this email to contact them.</p>
    ${detailsTable(data)}
  `
  return emailShell(
    'New Request',
    'New Refund Request',
    'A customer asked for a refund or order review.',
    inner,
    'Internal notification from the EpicVINRecord refund request form.'
  )
}

async function sendRefundRequestHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const body = parseBody(req)
    const email = clip(body.email, 254)
    const orderId = clip(body.orderId, 80)
    const vehicle = clip(body.vehicle, 80)
    const purchaseDate = clip(body.purchaseDate, 10)
    const description = clip(body.description, 4000)
    const helpWith = normalizeHelpWith(body.helpWith)
    const resolutionKey = clip(body.resolution, 40)
    const resolution = RESOLUTION_OPTIONS[resolutionKey] || ''
    const purchaseDateLabel = formatPurchaseDate(purchaseDate)

    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
      return
    }
    if (!vehicle) {
      res.status(400).json({ success: false, message: 'Please enter the vehicle registration or VIN.' })
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(purchaseDate) || purchaseDateLabel === purchaseDate) {
      res.status(400).json({ success: false, message: 'Please enter the date you purchased the report.' })
      return
    }
    if (!helpWith.length) {
      res.status(400).json({ success: false, message: 'Please select what we can help you with.' })
      return
    }
    if (!description) {
      res.status(400).json({ success: false, message: 'Please describe the issue.' })
      return
    }
    if (!resolution) {
      res.status(400).json({ success: false, message: 'Please select a preferred resolution.' })
      return
    }

    const data = { email, orderId, vehicle, purchaseDateLabel, description, helpWith, resolution }
    const fromUser = String(process.env.GMAIL_USER || '').trim()
    const adminTo = String(process.env.NOTIFY_EMAIL_TO || SUPPORT_TO).trim() || SUPPORT_TO
    const transporter = createTransporter()

    const customerText = [
      'We Received Your Request',
      '',
      'We have received your refund / order review request. It is now in process.',
      'Our support team will review your order and you will receive a response soon.',
      '',
      'Order ID: ' + (orderId || 'Not provided'),
      'Email: ' + email,
      'Vehicle Registration / VIN: ' + vehicle,
      'Purchase date: ' + purchaseDateLabel,
      'What we can help with: ' + helpWith.join(', '),
      'Preferred resolution: ' + resolution,
      'Issue description: ' + description,
      '',
      'EpicVINRecord Support Team',
      HOME_URL
    ].join('\n')

    const adminText = [
      'New refund / order review request',
      '',
      'Order ID: ' + (orderId || 'Not provided'),
      'Email: ' + email,
      'Vehicle Registration / VIN: ' + vehicle,
      'Purchase date: ' + purchaseDateLabel,
      'What we can help with: ' + helpWith.join(', '),
      'Preferred resolution: ' + resolution,
      'Issue description: ' + description
    ].join('\n')

    await transporter.sendMail({
      from: `"EpicVINRecord Support" <${fromUser}>`,
      to: adminTo,
      replyTo: email,
      subject: 'New Refund Request' + (orderId ? ' — ' + orderId : ''),
      text: adminText,
      html: buildAdminHtml(data)
    })

    await transporter.sendMail({
      from: `"EpicVINRecord Support" <${fromUser}>`,
      to: email,
      subject: 'We Received Your Refund Request — It Is In Process',
      text: customerText,
      html: buildCustomerHtml(data)
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Refund request email failed:', error && error.message ? error.message : error)
    res.status(500).json({
      success: false,
      message: error && error.message ? error.message : 'Failed to send refund request'
    })
  }
}

module.exports = {
  sendRefundRequestHandler
}
