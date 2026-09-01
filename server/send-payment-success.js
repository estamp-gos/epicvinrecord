const nodemailer = require('nodemailer')

const HOME_URL = 'https://www.epicvinrecord.com/'
const CONTACT_URL = 'https://www.epicvinrecord.com/contact.html'
const REFUND_FORM_URL = 'https://www.epicvinrecord.com/#refund-request-form'
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

function buildPaymentSuccessHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Successful - EpicVINrecord</title>
    <style type="text/css">
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 16px 8px !important; }
        .email-card { width: 100% !important; max-width: 100% !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .email-hero { padding: 28px 20px 24px 20px !important; }
        .email-h1 { font-size: 22px !important; line-height: 30px !important; }
        .email-logo { max-width: 150px !important; height: auto !important; }
      }
    </style>
</head>
<body style="margin:0; padding:0; background-color:#f3f8fc; font-family:Arial, Helvetica, sans-serif; color:#111827; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
    <table class="email-outer" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f8fc; margin:0; padding:35px 15px;">
        <tr>
            <td align="center">
                <table class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td class="email-pad" style="padding:0 30px; height:58px; background:#ffffff; border-bottom:1px solid #edf1f5;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="left" valign="middle" height="58" style="height:58px;">
                                        <a href="${HOME_URL}" style="text-decoration:none;">
                                            <img class="email-logo" src="${LOGO_URL}" alt="EpicVINrecord" height="40" style="display:block; max-height:40px; width:auto; max-width:175px; border:0;">
                                        </a>
                                    </td>
                                    <td align="right" valign="middle" height="58" style="height:58px; font-size:12px; color:#16a34a; font-weight:600;">
                                        Payment Successful
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-hero" style="background:#eef7ff; padding:38px 35px 30px 35px; text-align:center;">
                            <div style="display:inline-block; width:58px; height:58px; line-height:58px; background:#dcfce7; border-radius:50%; font-size:28px; margin-bottom:18px;">&#127881;</div>
                            <h1 class="email-h1" style="margin:0 0 12px 0; font-size:27px; line-height:35px; color:#111111; font-weight:700;">Thanks For Choosing Us!</h1>
                            <p style="margin:0; font-size:15px; line-height:24px; color:#5b6573;">Thank you for completing your payment with EpicVINrecord</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-pad" style="padding:32px 35px;">
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">Hello,</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">Thank you for completing your payment with EpicVINrecord.</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">We hope you have received your vehicle history report successfully. If you haven&rsquo;t received it yet, please let us know and we&rsquo;ll be happy to resend it to you.</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">If you have any further questions or experience any issues with your report, our support team is always here to assist you. Please feel free to contact us anytime.</p>
                            <p style="margin:18px 0 10px 0; font-size:16px; line-height:25px; color:#111827; font-weight:700;">Need Help With Your Report?</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">If you notice any issue with your vehicle history report, or if you believe there is a problem with your order, please contact us before opening a payment dispute or chargeback. Our support team will review your order and work with you to resolve the issue.</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">If your order qualifies for a refund after review, we will be happy to assist you with the refund process.</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">You can also submit your request directly through our <a href="${REFUND_FORM_URL}" style="color:#2563eb; text-decoration:underline;">Request a Refund or Order Review</a> form available in the footer of our website.</p>
                            <p style="margin:0 0 18px 0; font-size:15px; line-height:25px; color:#374151;">Thank you for choosing EpicVINrecord. We truly appreciate your business!</p>
                            <p style="margin:0; font-size:15px; line-height:25px; color:#374151;">Best regards,<br>EpicVINrecord Support Team</p>
                        </td>
                    </tr>
                    <tr>
                        <td class="email-pad" style="padding:0 35px 30px 35px;">
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
                        <td class="email-pad" style="background:#f8fafc; padding:24px 30px; text-align:center; border-top:1px solid #edf1f5;">
                            <p style="margin:0 0 8px 0; font-size:12px; color:#6b7280;">&copy; 2026 EpicVINrecord. All Rights Reserved.</p>
                            <p style="margin:0; font-size:12px; line-height:20px; color:#9ca3af;">
                                <a href="${HOME_URL}" style="color:#6b7280; text-decoration:none;">Visit Website</a>
                                &nbsp; | &nbsp;
                                <a href="${CONTACT_URL}" style="color:#6b7280; text-decoration:none;">Contact Support</a>
                            </p>
                        </td>
                    </tr>
                </table>
                <table class="email-card" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
                    <tr>
                        <td align="center" style="padding:18px 20px;">
                            <p style="margin:0; font-size:11px; line-height:18px; color:#9ca3af;">This email was sent because your payment was completed on EpicVINrecord.</p>
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

async function sendPaymentSuccessHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed' })
    return
  }

  try {
    const body = parseBody(req)
    const to = String(body.email || '').trim()
    if (!EMAIL_RE.test(to)) {
      res.status(400).json({ success: false, message: 'A valid customer email is required.' })
      return
    }

    const paid = body.paid === true || body.paymentCompleted === true
    if (!paid) {
      res.status(403).json({ success: false, message: 'Payment success email is only sent after payment.' })
      return
    }

    const fromUser = String(process.env.GMAIL_USER || '').trim()
    const transporter = createTransporter()

    await transporter.sendMail({
      from: `"EpicVINrecord" <${fromUser}>`,
      to,
      subject: 'Thanks For Choosing Us! — Payment Successful',
      text: [
        'Thanks For Choosing Us!',
        '',
        'Thank you for completing your payment with EpicVINrecord.',
        '',
        'We hope you have received your vehicle history report successfully. If you haven’t received it yet, please let us know and we’ll be happy to resend it to you.',
        '',
        'If you have any further questions or experience any issues with your report, our support team is always here to assist you.',
        '',
        'Need Help With Your Report?',
        '',
        'If you notice any issue with your vehicle history report, or if you believe there is a problem with your order, please contact us before opening a payment dispute or chargeback. Our support team will review your order and work with you to resolve the issue.',
        '',
        'If your order qualifies for a refund after review, we will be happy to assist you with the refund process.',
        '',
        'You can also submit your request directly through our Request a Refund or Order Review form available in the footer of our website.',
        REFUND_FORM_URL,
        '',
        'Thank you for choosing EpicVINrecord. We truly appreciate your business!',
        '',
        'Best regards,',
        'EpicVINrecord Support Team',
        HOME_URL
      ].join('\n'),
      html: buildPaymentSuccessHtml()
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Payment success email failed:', error && error.message ? error.message : error)
    res.status(500).json({
      success: false,
      message: error && error.message ? error.message : 'Failed to send payment success email'
    })
  }
}

module.exports = {
  sendPaymentSuccessHandler
}
