const nodemailer = require("nodemailer");

let cachedTransporter = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // 1. Check if SMTP configuration is provided in env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return cachedTransporter;
  }

  // 2. Default to Ethereal Test Account (zero setup needed, generates inspectable email previews)
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[Mailer] Initialized Ethereal test mailer as: ${testAccount.user}`);
    return cachedTransporter;
  } catch (err) {
    console.warn("[Mailer] Could not create Ethereal account, falling back to JSON transport:", err.message);
    cachedTransporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return cachedTransporter;
  }
}

/**
 * Send an OTP security verification email
 */
async function sendOtpEmail({ to, otp, userName = "Team Member", purpose = "LOGIN" }) {
  const transporter = await getTransporter();

  const isLogin = purpose === "LOGIN";
  const title = isLogin ? "StockSense Sign-In Verification" : "StockSense Password Reset";
  const headline = isLogin
    ? "Your One-Time Login Code"
    : "Your Password Reset OTP";

  const mailOptions = {
    from: `"StockSense Security" <no-reply@stocksense.local>`,
    to,
    subject: `[StockSense] ${otp} is your verification code`,
    text: `Hello ${userName},\n\nYour StockSense verification code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this, please ignore this email.`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; margin: 0; padding: 24px; }
            .container { max-width: 480px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: rgba(99, 102, 241, 0.2); color: #818cf8; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
            h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin: 0 0 12px; }
            p { font-size: 14px; color: #9ca3af; line-height: 1.5; margin: 0 0 20px; }
            .otp-box { background: #1e1b4b; border: 1px solid #3730a3; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.4); }
            .footer { font-size: 11px; color: #6b7280; border-top: 1px solid #1f2937; padding-top: 16px; margin-top: 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <span class="badge">StockSense Authentication</span>
            <h1>${title}</h1>
            <p>Hello <strong>${userName}</strong>,</p>
            <p>${headline}. Use this one-time code to authenticate into the StockSense inventory platform:</p>
            <div class="otp-box">
              <div class="otp-code">${otp}</div>
            </div>
            <p style="font-size: 12px; color: #9ca3af;">⏱️ This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.</p>
            <div class="footer">
              StockSense Intelligent Inventory Management System &bull; Automated Security Dispatcher
            </div>
          </div>
        </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  const previewUrl = nodemailer.getTestMessageUrl(info) || null;
  if (previewUrl) {
    console.log(`[Mailer] 📧 OTP Email preview available at: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
  };
}

module.exports = {
  getTransporter,
  sendOtpEmail,
};
