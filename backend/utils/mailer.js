const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a password reset email to the given address.
 * @param {string} toEmail  – recipient's email
 * @param {string} resetLink – full reset URL
 */
async function sendPasswordResetEmail(toEmail, resetLink) {
  const mailOptions = {
    from: `"i-SOFTZONE HR" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Password Reset Request – i-SOFTZONE',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { margin: 0; padding: 0; background: #0b0e14; font-family: 'Segoe UI', Arial, sans-serif; }
          .wrapper { max-width: 580px; margin: 40px auto; background: #111827; border: 1px solid rgba(0,240,255,0.2); border-radius: 16px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #00f0ff22, #b026ff22); padding: 40px 48px 32px; border-bottom: 1px solid rgba(255,255,255,0.08); }
          .brand { font-size: 1.5rem; font-weight: 800; color: #00f0ff; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 4px; }
          .header h1 { margin: 0; font-size: 1.2rem; color: #94a3b8; font-weight: 400; }
          .body { padding: 40px 48px; color: #e2e8f0; line-height: 1.7; }
          .body p { margin: 0 0 20px; font-size: 1rem; }
          .btn { display: inline-block; padding: 16px 36px; background: linear-gradient(135deg, #00f0ff, #0088ff); color: #000; font-weight: 700; font-size: 1rem; border-radius: 8px; text-decoration: none; letter-spacing: 0.5px; box-shadow: 0 4px 20px rgba(0,240,255,0.4); }
          .note { font-size: 0.88rem; color: #64748b; margin-top: 24px; }
          .footer { padding: 24px 48px; border-top: 1px solid rgba(255,255,255,0.06); color: #475569; font-size: 0.82rem; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="header">
            <p class="brand">i-SOFTZONE</p>
            <h1>Password Reset Request</h1>
          </div>
          <div class="body">
            <p>Hi there,</p>
            <p>We received a request to reset your password. Click the button below to create a new password. This link will expire in <strong>15 minutes</strong>.</p>
            <a href="${resetLink}" class="btn">Reset Password →</a>
            <p class="note">If you didn't request a password reset, you can safely ignore this email — your password won't be changed.</p>
            <p class="note">If the button doesn't work, copy and paste this URL into your browser:<br/><span style="color:#00f0ff; word-break:break-all;">${resetLink}</span></p>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} i-SOFTZONE Workforce Suite. This is an automated message, please do not reply.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendPasswordResetEmail };
