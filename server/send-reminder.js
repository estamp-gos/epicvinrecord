const nodemailer = require('nodemailer')

const HOME_URL = 'https://www.epicvinrecord.com/'
const LOGO_URL = 'https://www.epicvinrecord.com/img2/epicvin-logos/epicvinrecord-logo.png'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

function buildReminderHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder - EpicVINrecord</title>
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
                                            <img src="${LOGO_URL}" alt="EpicVINrecord" height="40" style="display:block; max-height:40px; width:auto; max-width:175px; border:0;">
                                        </a>
                                    </td>
                                    <td align="right" valign="middle" height="58" style="height:58px; font-size:12px; color:#6b7280;">
                                        Payment Reminder
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#eef7ff; padding:38px 35px 30px 35px; text-align:center;">
                            <div style="display:inline-block; width:58px; height:58px; line-height:58px; background:#fff3d6; border-radius:50%; font-size:28px; margin-bottom:18px;">&#128179;</div>
                            <h1 style="margin:0 0 12px 0; font-size:27px; line-height:35px; color:#111111; font-weight:700;">Your Vehicle Report Is Almost Ready</h1>
                            <p style="margin:0; font-size:15px; line-height:24px; color:#5b6573;">You recently entered your vehicle details on EpicVINrecord, but your payment has not been completed yet.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 35px;">
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">Hello,</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">We noticed that you started your vehicle history report request on <strong>EpicVINrecord</strong> and entered your vehicle details, but the payment step has not yet been completed.</p>
                            <p style="margin:0 0 24px 0; font-size:15px; line-height:25px; color:#374151;">To complete your order and receive your vehicle history report, simply complete the payment using the button below.</p>
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <a href="${HOME_URL}" style="display:inline-block; background:#ffae00; color:#111111; text-decoration:none; font-size:15px; font-weight:700; padding:15px 32px; border-radius:30px; min-width:220px;">Complete Payment &amp; Get Report</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:25px 0 0 0; text-align:center; font-size:13px; line-height:21px; color:#6b7280;">Complete your payment to finish your order and access your vehicle history report.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:0 35px 30px 35px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #edf1f5;">
                                <tr>
                                    <td align="center" style="padding-top:25px;">
                                        <p style="margin:0 0 8px 0; font-size:14px; font-weight:700; color:#111827;">Thank You for Choosing EpicVINrecord</p>
                                        <p style="margin:0; font-size:13px; line-height:21px; color:#6b7280;">We're here to help you make a more informed vehicle purchase.</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #edf1f5;">
                            <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">&copy; 2026 EpicVINrecord. All Rights Reserved.</p>
                            <p style="margin:0; font-size:12px; line-height:20px; color:#9ca3af;">
                                <a href="${HOME_URL}" style="color:#6b7280; text-decoration:none;">Visit Website</a>
                                &nbsp; | &nbsp;
                                <a href="https://www.epicvinrecord.com/contact.html" style="color:#6b7280; text-decoration:none;">Contact Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
                    <tr>
                        <td align="center" style="padding:18px 20px;">
                            <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">This email was sent because a vehicle report request was started on EpicVINrecord.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`
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

async function sendReminderHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const body = parseBody(req)
    const to = String(body.email || body.to || '').trim()
    if (!EMAIL_RE.test(to)) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address.' })
      return
    }

    const fromUser = String(process.env.GMAIL_USER || '').trim()
    const transporter = createTransporter()

    const text = [
      'Your Vehicle Report Is Almost Ready',
      '',
      'You recently entered your vehicle details on EpicVINrecord, but payment has not been completed yet.',
      '',
      'Complete payment: ' + HOME_URL
    ].join('\n')

    await transporter.sendMail({
      from: `"EpicVINrecord" <${fromUser}>`,
      to,
      subject: 'Your Vehicle Report Is Almost Ready — Complete Payment',
      text,
      html: buildReminderHtml()
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Payment reminder email failed:', error && error.message ? error.message : error)
    res.status(500).json({
      success: false,
      message: error && error.message ? error.message : 'Failed to send reminder email'
    })
  }
}

module.exports = {
  sendReminderHandler
}
