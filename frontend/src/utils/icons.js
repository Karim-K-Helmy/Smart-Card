const iconRules = [
  { match: ['مرحب', 'welcome'], icon: 'fa-house-user' },
  { match: ['لوحة', 'dashboard', 'إحصاء', 'analytics'], icon: 'fa-chart-column' },
  { match: ['من نحن', 'نحن', 'about'], icon: 'fa-info' },
  { match: ['الباقات', 'التسعير', 'الخطة', 'الخطط', 'pricing'], icon: 'fa-layer-group' },
  { match: ['تواصل', 'اتصل', 'contact', 'رسائل', 'message'], icon: 'fa-envelope-open-text' },
  { match: ['الأسئلة الشائعة', 'faq', 'سؤال', 'question'], icon: 'fa-question' },
  { match: ['تسجيل الدخول', 'دخول', 'login'], icon: 'fa-sign-in-alt' },
  { match: ['استعادة', 'نسيت', 'reset', 'كلمة المرور'], icon: 'fa-key' },
  { match: ['إنشاء حساب', 'register', 'حساب جديد'], icon: 'fa-user-plus' },
  { match: ['الحساب', 'الأمان', 'المصادقة', 'security'], icon: 'fa-shield-halved' },
  { match: ['البروفايل الشخصي', 'الملف الشخصي', 'شخصي'], icon: 'fa-user-large' },
  { match: ['البروفايل التجاري', 'تجاري', 'النشاط', 'العلامة'], icon: 'fa-building' },
  { match: ['روابط', 'السوشيال', 'social'], icon: 'fa-share-nodes' },
  { match: ['الأعمال', 'المنتجات', 'products'], icon: 'fa-briefcase' },
  { match: ['الطلبات', 'طلب'], icon: 'fa-clipboard-list' },
  { match: ['المدفوعات', 'الدفع', 'الإيصال', 'payment'], icon: 'fa-money-bill-wave' },
  { match: ['الإشعارات', 'notification'], icon: 'fa-bell' },
  { match: ['الإعدادات', 'setting'], icon: 'fa-gears' },
  { match: ['المستخدمين', 'users'], icon: 'fa-users' },
  { match: ['الرسائل', 'messages'], icon: 'fa-message' },
  { match: ['الأدمن', 'admin'], icon: 'fa-shield-halved' },
  { match: ['نبذة', 'معلومات', 'تعريفية'], icon: 'fa-book-open' },
  { match: ['البطاقة', 'بطاقتي', 'بطاقات', 'card'], icon: 'fa-id-card' },
  { match: ['ملخص', 'summary'], icon: 'fa-clipboard-check' },
];

const safeIconPattern = /^fa-[a-z0-9-]+$/;

export function resolveIconClass(input) {
  if (!input) return '';
  if (safeIconPattern.test(input)) return input;

  const text = Array.isArray(input)
    ? input.filter(Boolean).join(' ')
    : String(input || '');

  const normalized = text.toLowerCase();
  const matchedRule = iconRules.find((rule) =>
    rule.match.some((keyword) => normalized.includes(keyword.toLowerCase())),
  );

  return matchedRule?.icon || '';
}
