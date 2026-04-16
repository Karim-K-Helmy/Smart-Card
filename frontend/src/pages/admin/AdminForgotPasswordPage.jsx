import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { forgotAdminPassword, resetAdminPassword } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '', devCode: '' });

  const requestCode = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '', devCode: '' });
    try {
      const { data } = await forgotAdminPassword({ email: form.email });
      setStep(2);
      setStatus({
        loading: false,
        error: '',
        success: 'تم إرسال رمز التحقق إلى بريد المدير العام.',
        devCode: data.data?.devCode || '',
      });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error), success: '', devCode: '' });
    }
  };

  const submitReset = async (event) => {
    event.preventDefault();
    if (form.newPassword.length < 6) {
      setStatus((prev) => ({ ...prev, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' }));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setStatus((prev) => ({ ...prev, error: 'تأكيد كلمة المرور غير مطابق.' }));
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await resetAdminPassword({ email: form.email, code: form.code, newPassword: form.newPassword });
      setStatus((prev) => ({ ...prev, loading: false, error: '', success: 'تم تعيين كلمة المرور الجديدة بنجاح.' }));
      setTimeout(() => navigate('/admin/login', { replace: true }), 500);
    } catch (error) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(error) }));
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="نسيان كلمة مرور الإدارة">
        {step === 1 ? (
          <form className="form-card" onSubmit={requestCode}>
            <label><span>البريد الإلكتروني</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}</Button>
          </form>
        ) : (
          <form className="form-card" onSubmit={submitReset}>
            <label><span>البريد الإلكتروني</span><input type="email" value={form.email} readOnly /></label>
            <label><span>رمز التحقق (OTP)</span><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
            <label><span>كلمة المرور الجديدة</span><input type="password" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></label>
            <label><span>تأكيد كلمة المرور الجديدة</span><input type="password" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></label>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            {status.devCode ? <p className="muted">رمز الاختبار في وضع التطوير: <strong>{status.devCode}</strong></p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الحفظ...' : 'إعادة تعيين كلمة المرور'}</Button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/admin/login">العودة لتسجيل دخول الأدمن</Link>
        </div>
      </Card>
    </section>
  );
}
