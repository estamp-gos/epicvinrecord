const fs = require('fs')
const path = require('path')
const nodemailer = require('nodemailer')

const DEFAULT_NOTIFY_TO = 'epicvinrecordreport@gmail.com'
const LOGO_CID = 'epicvinlogo'

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function resolveLogoPath() {
  const cwd = path.join(__dirname, '..')
  const candidates = [
    path.join(cwd, 'img2', 'epicvin-logos', 'epicvinrecord-logo.png'),
    path.join(cwd, 'img2', 'epicvin-logos', 'epicvinrecord-logo-source.png'),
    path.join(cwd, 'img2', 'epicvin-logos', 'logo.png')
  ]
  for (const logoPath of candidates) {
    try {
      fs.accessSync(logoPath)
      return logoPath
    } catch {
      /* try next */
    }
  }
  return null
}

function detailRow(label, value, opts) {
  const isLast = opts && opts.last
  const valueColor = (opts && opts.valueColor) || '#0f172a'
  const border = isLast ? '' : 'border-bottom:1px solid #e8eef5;'
  return (
    '<tr>' +
    '<td style="padding:13px 16px;' + border + 'width:38%;vertical-align:top;">' +
    '<div style="font-size:11px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#5b7a99;">' +
    escapeHtml(label) +
    '</div></td>' +
    '<td style="padding:13px 16px;' + border + 'vertical-align:top;">' +
    '<div style="font-size:15px;font-weight:600;color:' + valueColor + ';word-break:break-word;">' +
    escapeHtml(value || '—') +
    '</div></td>' +
    '</tr>'
  )
}

function buildPdfDownloadEmailHtml(details) {
  const email = details.email || '—'
  const vinPlate = details.vinPlate || '—'
  const vehicleModel = details.vehicleModel || '—'
  const vehicleType = details.vehicleType || '—'
  const downloadedAt = details.downloadedAt || ''
  const downloadedAtIso = details.downloadedAtIso || ''
  const showLogo = !!details.includeLogo

  const logoBlock = showLogo
    ? '<img src="cid:' + LOGO_CID + '" alt="EpicVINrecord" height="40" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;height:40px;width:auto;max-height:40px;max-width:240px;" />'
    : '<div style="font-size:18px;font-weight:800;letter-spacing:0.3px;color:#00386c;line-height:58px;">EpicVINrecord</div>'

  return (
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>PDF Downloaded</title></head>' +
    '<body style="margin:0;padding:0;background:#e8f1fa;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">' +
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#e8f1fa;padding:28px 12px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #c5daf0;">' +

    '<tr><td height="58" bgcolor="#ffffff" valign="middle" style="background:#ffffff;height:58px;padding:0 24px;text-align:center;vertical-align:middle;">' +
    logoBlock +
    '</td></tr>' +
    '<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:0 24px 12px;text-align:center;">' +
    '<div style="font-size:12px;line-height:16px;color:#111111;">Vehicle History Reports &amp; VIN Checks</div>' +
    '</td></tr>' +
    '<tr><td height="3" bgcolor="#0084ff" style="background:#0084ff;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>' +

    '<tr><td style="padding:28px 28px 8px;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0"><tr>' +
    '<td style="background:#e8f8ef;color:#15803d;font-size:11px;font-weight:700;letter-spacing:0.7px;text-transform:uppercase;padding:6px 12px;border:1px solid #bbf7d0;">PDF Downloaded</td>' +
    '</tr></table>' +
    '<h1 style="margin:16px 0 8px;font-size:22px;line-height:1.35;color:#00386c;font-weight:700;">Customer downloaded their report</h1>' +
    '<p style="margin:0 0 22px;font-size:14px;line-height:1.65;color:#5b6b7c;">A customer completed payment and downloaded their PDF vehicle history report from the Thank You page.</p>' +

    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fafe;border:1px solid #d4e6f5;border-left:4px solid #0084ff;">' +
    detailRow('Email', email) +
    detailRow('VIN / Plate', vinPlate) +
    detailRow('Vehicle Model', vehicleModel) +
    detailRow('Vehicle Type', vehicleType) +
    detailRow('PDF Status', 'PDF report was downloaded', { valueColor: '#15803d' }) +
    detailRow('Download date and time', downloadedAt, { last: !downloadedAtIso }) +
    (downloadedAtIso
      ? detailRow('ISO timestamp', downloadedAtIso, { last: true, valueColor: '#64748b' })
      : '') +
    '</table>' +
    '</td></tr>' +

    '<tr><td style="padding:8px 28px 28px;">' +
    '<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a9aab;">This notification is sent automatically when a paid report PDF is downloaded.</p>' +
    '</td></tr>' +

    '<tr><td style="background:#00386c;padding:16px 28px;text-align:center;">' +
    '<div style="font-size:12px;color:#c5daf0;">© EpicVINrecord</div>' +
    '<a href="https://www.epicvinrecord.com" style="display:inline-block;margin-top:6px;font-size:12px;color:#ffffff;text-decoration:none;">www.epicvinrecord.com</a>' +
    '</td></tr>' +

    '</table>' +
    '</td></tr></table>' +
    '</body></html>'
  )
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

async function notifyDownloadHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    let order = req.body
    if (typeof order === 'string') {
      try {
        order = JSON.parse(order)
      } catch {
        order = {}
      }
    }
    if (!order || typeof order !== 'object') order = {}
    const now = new Date()
    const vinPlate = String(order.vin || order.plate || '').trim() || 'N/A'
    const vehicleModel = String(order.carModel || order.vehicleModel || '').trim()
    const vehicleType = String(order.vehicleCategory || order.vehicleType || '').trim()
    const customerEmail = String(order.email || '').trim()
    const downloadedAt = now.toLocaleString()
    const downloadedAtIso = now.toISOString()

    const lines = [
      'PDF Report Downloaded',
      '',
      'A customer downloaded their PDF vehicle history report.',
      '',
      'Customer Email: ' + (customerEmail || '—'),
      'VIN / Plate: ' + vinPlate,
      'Vehicle Model: ' + (vehicleModel || '—'),
      'Vehicle Type: ' + (vehicleType || '—'),
      'PDF Status: PDF report was downloaded',
      'Download date and time: ' + downloadedAt,
      'ISO timestamp: ' + downloadedAtIso
    ]

    const notifyTo = String(process.env.NOTIFY_EMAIL_TO || DEFAULT_NOTIFY_TO).trim()
    const fromUser = String(process.env.GMAIL_USER || '').trim()
    const transporter = createTransporter()
    const logoPath = resolveLogoPath()

    const mail = {
      from: `"EpicVINrecord" <${fromUser}>`,
      to: notifyTo,
      replyTo: customerEmail || undefined,
      subject: 'PDF Downloaded — ' + vinPlate,
      text: lines.join('\n'),
      html: buildPdfDownloadEmailHtml({
        email: customerEmail,
        vinPlate,
        vehicleModel,
        vehicleType,
        downloadedAt,
        downloadedAtIso,
        includeLogo: !!logoPath
      })
    }

    if (logoPath) {
      mail.attachments = [
        {
          filename: 'epicvinrecord-logo.png',
          path: logoPath,
          cid: LOGO_CID
        }
      ]
    }

    await transporter.sendMail(mail)

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('PDF download notification failed:', error && error.message ? error.message : error)
    res.status(500).json({
      success: false,
      message: error && error.message ? error.message : 'Failed to send download notification'
    })
  }
}

module.exports = {
  notifyDownloadHandler
}
