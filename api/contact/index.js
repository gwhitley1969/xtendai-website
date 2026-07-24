const sgMail = require('@sendgrid/mail');

/**
 * Allow-list for the contact form's interest selector. Must stay in step
 * with the `interests` array in src/pages/contact.astro.
 *
 * Anything not on this list is treated as absent, which covers both a
 * malformed payload and a visitor whose page was cached before the
 * selector shipped.
 */
const INTERESTS = [
  'New website',
  'Mobile app',
  'Cloud & hosting',
  'Support',
  'Something else'
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function (context, req) {
  // Set CORS headers
  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  };

  // Handle preflight
  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    context.res.body = {};
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    context.res.status = 405;
    context.res.body = { error: 'Method not allowed' };
    return;
  }

  try {
    const { name, email, interest, message } = req.body || {};

    // Validate required fields
    if (!email || !message) {
      context.res.status = 400;
      context.res.body = { error: 'Email and message are required' };
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      context.res.status = 400;
      context.res.body = { error: 'Invalid email address' };
      return;
    }

    // Check for SendGrid API key
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      context.log.error('SENDGRID_API_KEY not configured');
      context.res.status = 500;
      context.res.body = { error: 'Email service not configured' };
      return;
    }

    // Configure SendGrid
    sgMail.setApiKey(apiKey);

    // Only an allow-listed value reaches the subject line, so arbitrary
    // submitted text can never be echoed into a mail header.
    const safeInterest = INTERESTS.includes(interest) ? interest : null;

    // Falls back to the previous subject when no interest is present, so a
    // page cached before the selector shipped still sends successfully.
    const subject = safeInterest
      ? `[Xtend-AI Contact] ${safeInterest} — ${name || 'Anonymous'}`
      : `[Xtend-AI Contact] New message from ${name || 'Anonymous'}`;

    // Prepare email
    const msg = {
      to: 'xtendai@xtend-ai.com',
      from: 'xtendai@xtend-ai.com', // Verified in SendGrid
      replyTo: email,
      subject,
      text: `
Interest: ${safeInterest || 'Not specified'}
Name: ${name || 'Not provided'}
Email: ${email}

Message:
${message}

---
Sent from xtend-ai.com contact form
      `,
      html: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #022A56;">New Contact Form Submission</h2>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 100px;">Interest:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(safeInterest || 'Not specified')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${escapeHtml(name || 'Not provided')}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #eee;">
        <a href="mailto:${encodeURIComponent(email)}">${escapeHtml(email)}</a>
      </td>
    </tr>
  </table>

  <h3 style="color: #022A56; margin-top: 24px;">Message:</h3>
  <div style="padding: 16px; background: #f6f9ff; border-radius: 8px; white-space: pre-wrap;">${escapeHtml(message)}</div>

  <p style="margin-top: 24px; color: #666; font-size: 12px;">
    Sent from xtend-ai.com contact form
  </p>
</div>
      `
    };

    // Send email
    await sgMail.send(msg);

    context.log.info(`Contact form email sent from ${email}`);
    context.res.status = 200;
    context.res.body = { success: true };

  } catch (error) {
    context.log.error('Error sending email:', error);
    context.res.status = 500;
    context.res.body = { error: 'Failed to send message' };
  }
};
