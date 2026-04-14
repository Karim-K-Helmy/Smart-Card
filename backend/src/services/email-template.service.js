const APP_NAME = process.env.APP_NAME || 'LineStart';
const APP_SUPPORT_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || process.env.ADMIN_EMAIL || '';
const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || 'Africa/Cairo';

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatExpiry = (value) => {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: DEFAULT_TIMEZONE,
    }).format(new Date(value));
  } catch (error) {
    return new Date(value).toLocaleString('en-GB');
  }
};

const buildOtpEmailTemplate = ({
  title,
  preheader,
  greeting,
  intro,
  code,
  expiresAt,
  purposeLabel,
  helpText,
  footerNote,
}) => {
  const safeTitle = escapeHtml(title || 'رمز التحقق');
  const safePreheader = escapeHtml(preheader || intro || 'رمز تحقق آمن من LineStart');
  const safeGreeting = escapeHtml(greeting || 'مرحبًا بك');
  const safeIntro = escapeHtml(intro || 'استخدم الرمز التالي لإكمال العملية المطلوبة.');
  const safePurpose = escapeHtml(purposeLabel || safeTitle);
  const safeCode = escapeHtml(code || '------');
  const safeHelpText = escapeHtml(helpText || 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.');
  const safeFooter = escapeHtml(
    footerNote || `تم إرسال هذه الرسالة تلقائيًا من ${APP_NAME}. يرجى عدم مشاركة رمز التحقق مع أي شخص.`
  );
  const expiryText = formatExpiry(expiresAt);
  const safeExpiryText = escapeHtml(expiryText);
  const brandSupport = APP_SUPPORT_EMAIL ? `<div style="margin-top:8px;color:#94a3b8;font-size:13px">البريد المُرسِل: ${escapeHtml(APP_SUPPORT_EMAIL)}</div>` : '';

  const html = `
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif;color:#0f172a">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${safePreheader}</div>
    <div style="padding:32px 16px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.12)">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:28px 32px;color:#ffffff">
          <div style="font-size:13px;letter-spacing:1px;text-transform:uppercase;opacity:0.85">${escapeHtml(APP_NAME)}</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.4">${safeTitle}</h1>
        </div>

        <div style="padding:32px">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700">${safeGreeting}</p>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.9;color:#334155">${safeIntro}</p>

          <div style="border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;padding:24px;text-align:center;margin:24px 0">
            <div style="font-size:13px;color:#64748b;margin-bottom:12px">${safePurpose}</div>
            <div style="font-size:38px;font-weight:800;letter-spacing:10px;color:#0f172a">${safeCode}</div>
            <div style="margin-top:14px;font-size:13px;color:#475569">صالح حتى ${safeExpiryText}</div>
          </div>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:18px;padding:16px 18px;margin-bottom:18px;color:#1e3a8a;font-size:14px;line-height:1.8">
            ${safeHelpText}
          </div>

          <p style="margin:0;font-size:13px;line-height:1.9;color:#64748b">${safeFooter}</p>
          ${brandSupport}
        </div>
      </div>
    </div>
  </body>
</html>`;

  const text = [
    `${APP_NAME} - ${title}`,
    '',
    greeting || 'مرحبًا بك،',
    intro || 'استخدم الرمز التالي لإكمال العملية المطلوبة.',
    '',
    `رمز التحقق: ${code}`,
    `صالح حتى: ${expiryText}`,
    '',
    helpText || 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل هذه الرسالة بأمان.',
    footerNote || `تم إرسال هذه الرسالة تلقائيًا من ${APP_NAME}. لا تشارك الرمز مع أي شخص.`,
  ].join('\n');

  return { html, text };
};

module.exports = {
  buildOtpEmailTemplate,
};
