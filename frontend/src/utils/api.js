export function extractApiError(error) {
  const message = error?.response?.data?.message || error?.response?.data?.error || error?.message;

  if (!message) {
    return 'حدث خطأ غير متوقع.';
  }

  if (/network error/i.test(message) || /failed to fetch/i.test(message)) {
    return 'تعذر الاتصال بالخادم. شغّل الـ Backend وتأكد من عنوان API.';
  }

  return message;
}

export function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (value instanceof File) {
      formData.append(key, value);
      return;
    }
    if (Array.isArray(value) || typeof value === 'object') {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, value);
  });

  return formData;
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '-';
  return `${Number(value).toLocaleString('ar-EG')} ج.م`;
}
