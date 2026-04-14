import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { resetPassword } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get('email') || '', [searchParams]);
  const initialDevCode = useMemo(() => searchParams.get('devCode') || '', [searchParams]);
  const [form, setForm] = useState({ email: initialEmail, code: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      setStatus({ loading: false, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.', success: '' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus({ loading: false, error: 'تأكيد كلمة المرور غير مطابق.', success: '' });
      return;
    }

    setStatus({ loading: true, error: '', success: '' });
    try {
      await resetPassword({ email: form.email, code: form.code, newPassword: form.newPassword });
      setStatus({ loading: false, error: '', success: 'تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول.' });
      setTimeout(() => navigate('/auth/login', { replace: true }), 400);
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="تعيين كلمة مرور جديدة">
        <form className="form-card" onSubmit={handleSubmit}>
          <label><span>البريد الإلكتروني</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span>كود التحقق</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required maxLength={6} /></label>
          {initialDevCode ? <p className="muted">كود التطوير: <strong>{initialDevCode}</strong></p> : null}
          <label><span>كلمة المرور الجديدة</span><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required /></label>
          <label><span>تأكيد كلمة المرور</span><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الحفظ...' : 'حفظ'}</Button>
        </form>
        <div className="auth-links">
          <Link to="/auth/login">العودة لتسجيل الدخول</Link>
        </div>
      </Card>
    </section>
  );
}
