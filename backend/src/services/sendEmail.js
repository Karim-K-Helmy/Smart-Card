const nodemailer = require('nodemailer');
const { recordSentEmail } = require('./resource-monitor.service');

const hasRealSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return false;
  }

  if (user === 'you@example.com' || pass === 'app_password') {
    return false;
  }

  return true;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!hasRealSmtpConfig()) {
    console.log('[DEV EMAIL]', JSON.stringify({ to, subject, text }, null, 2));
    await recordSentEmail({ mode: 'preview' }).catch(() => null);
    return {
      previewMode: true,
      to,
      subject,
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  await recordSentEmail({ mode: 'smtp' }).catch(() => null);
  return result;
};

sendEmail.hasRealSmtpConfig = hasRealSmtpConfig;

module.exports = sendEmail;
