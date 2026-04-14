const crypto = require('crypto');
const VerificationCode = require('../../DB/Models/verificationCode.model');
const { AppError } = require('../utils/errorhandling');
const sendEmail = require('./sendEmail');
const { buildOtpEmailTemplate } = require('./email-template.service');

const defaultTtls = {
  activate_account: 30,
  login: 15,
  reset_password: 20,
  update_profile: 10,
  change_password: 10,
  admin_login: 15,
  admin_update_profile: 10,
  admin_change_password: 10,
  admin_reset_password: 20,
};

const shouldExposeDevCode = () => {
  const env = String(process.env.NODE_ENV || 'development').toLowerCase();
  return env !== 'production' || !sendEmail.hasRealSmtpConfig();
};

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const buildPurposeText = (purpose) => {
  switch (purpose) {
    case 'activate_account':
      return 'تفعيل حسابك';
    case 'login':
      return 'تسجيل الدخول';
    case 'reset_password':
      return 'إعادة تعيين كلمة المرور';
    case 'update_profile':
      return 'تأكيد تعديل بيانات الحساب';
    case 'change_password':
      return 'تأكيد تغيير كلمة المرور';
    case 'admin_login':
      return 'تسجيل دخول الأدمن';
    case 'admin_update_profile':
      return 'تأكيد تعديل بيانات الأدمن';
    case 'admin_change_password':
      return 'تأكيد تغيير كلمة مرور الأدمن';
    case 'admin_reset_password':
      return 'إعادة تعيين كلمة مرور الأدمن';
    default:
      return 'رمز التحقق';
  }
};

const buildPurposeHelpText = (purpose) => {
  switch (purpose) {
    case 'activate_account':
      return 'أدخل هذا الرمز داخل صفحة التفعيل لإكمال إنشاء حسابك. سيتم إرسال رسالة التفعيل مرة واحدة فقط عند التسجيل لأول مرة.';
    case 'reset_password':
    case 'admin_reset_password':
      return 'استخدم هذا الرمز لإعادة تعيين كلمة المرور، ثم اختر كلمة مرور قوية لا تقل عن 6 أحرف.';
    case 'change_password':
    case 'admin_change_password':
      return 'استخدم هذا الرمز فقط إذا كنت تقوم بتغيير كلمة المرور الآن من داخل النظام.';
    case 'update_profile':
    case 'admin_update_profile':
      return 'هذا الرمز مخصص لتأكيد التعديلات الحساسة على الحساب. لا تشاركه مع أي شخص.';
    case 'login':
    case 'admin_login':
      return 'هذا الرمز صالح لعملية تسجيل دخول واحدة فقط خلال مدة قصيرة.';
    default:
      return 'إذا لم تطلب هذا الإجراء، يمكنك تجاهل الرسالة بأمان.';
  }
};

const issueCode = async ({
  email,
  purpose,
  accountModel = 'User',
  ttlMinutes,
  subject,
  title,
  greeting,
  intro,
  helpText,
  footerNote,
  meta = {},
}) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError('Email is required', 400);
  }

  await VerificationCode.updateMany(
    { email: normalizedEmail, purpose, accountModel, consumedAt: null },
    { consumedAt: new Date() }
  );

  const code = generateCode();
  const expiresAt = new Date(Date.now() + Number(ttlMinutes || defaultTtls[purpose] || 15) * 60 * 1000);

  await VerificationCode.create({
    email: normalizedEmail,
    purpose,
    accountModel,
    codeHash: hashCode(code),
    expiresAt,
    meta,
  });

  const purposeText = buildPurposeText(purpose);
  const emailSubject = subject || `${process.env.APP_NAME || 'LineStart'} | ${purposeText}`;
  const content = buildOtpEmailTemplate({
    title: title || purposeText,
    preheader: purposeText,
    greeting: greeting || 'مرحبًا بك،',
    intro: intro || 'استخدم الرمز التالي لإكمال العملية المطلوبة.',
    code,
    expiresAt,
    purposeLabel: purposeText,
    helpText: helpText || buildPurposeHelpText(purpose),
    footerNote,
  });

  await sendEmail({
    to: normalizedEmail,
    subject: emailSubject,
    text: content.text,
    html: content.html,
  }).catch((error) => {
    console.error('Email delivery failed:', error.message);
    return null;
  });

  return {
    email: normalizedEmail,
    expiresAt,
    devCode: shouldExposeDevCode() ? code : undefined,
  };
};

const findValidCode = async ({ email, purpose, code, accountModel = 'User' }) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const codeHash = hashCode(code);

  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose,
    accountModel,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record || record.codeHash !== codeHash) {
    throw new AppError('رمز التحقق غير صحيح أو منتهي الصلاحية', 400);
  }

  return record;
};

const consumeCode = async (params) => {
  const record = await findValidCode(params);
  record.consumedAt = new Date();
  await record.save();
  return record;
};

module.exports = {
  issueCode,
  consumeCode,
  findValidCode,
  shouldExposeDevCode,
};
