const displayValueMap = {
  none: 'بدون باقة',
  star: 'Star',
  pro: 'Pro',
  active: 'نشط',
  inactive: 'غير مفعّل',
  pending: 'قيد الانتظار',
  waiting_payment: 'بانتظار الدفع',
  under_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
  frozen: 'مجمّد',
  deleted: 'محذوف',
  new: 'جديد',
  read: 'مقروء',
  archived: 'مؤرشف',
  user: 'مستخدم',
  admin: 'أدمن',
};

export function translateDisplayValue(value) {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;

  const text = value.trim();
  if (!text) return text;

  const directKey = text.toLowerCase();
  const underscoredKey = text.replace(/\s+/g, '_').toLowerCase();

  return displayValueMap[directKey] || displayValueMap[underscoredKey] || text;
}
