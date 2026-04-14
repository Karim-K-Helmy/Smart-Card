import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { forgotAdminPassword, resetAdminPassword } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function AdminForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('request');
  const [form, setForm] = useState({ code: '', newPassword: '', confirmPassword: '' });
  const [devCode, setDevCode] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const requestOtp = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await forgotAdminPassword();
      const nextDevCode = data.data?.devCode || '';
      setDevCode(nextDevCode);
      setStep('reset');
      setStatus({
        loading: false,
        error: '',
        success: 'تم إرسال رمز التحقق إلى البريد الأساسي للأدمن المُعد داخل ملف البيئة (.env).',
      });
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error), success: '' });
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
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
      await resetAdminPassword({ code: form.code, newPassword: form.newPassword });
      setStatus({ loading: false, error: '', success: 'تم تحديث كلمة مرور الأدمن بنجاح. يمكنك الآن تسجيل الدخول.' });
      setTimeout(() => navigate('/admin/login', { replace: true }), 400);
    } catch (error) {
      setStatus({ loading: false, error: extractApiError(error), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="استعادة كلمة مرور الأدمن">
        {step === 'request' ? (
          <form className="form-card" onSubmit={requestOtp}>
            <div className="notice-card notice-info">
              <strong>تنبيه</strong>
              <p>سيتم إرسال رمز التحقق إلى البريد الأساسي للأدمن فقط، كما هو مُعد في ملف البيئة (.env).</p>
            </div>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}</Button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleReset}>
            <label><span>رمز التحقق OTP</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} maxLength={6} required /></label>
            {devCode ? <p className="muted">كود التطوير: <strong>{devCode}</strong></p> : null}
            <label><span>كلمة المرور الجديدة</span><input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required /></label>
            <label><span>تأكيد كلمة المرور</span><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور الجديدة'}</Button>
          </form>
        )}
        <div className="auth-links">
          <Link to="/admin/login">العودة لتسجيل دخول الأدمن</Link>
        </div>
      </Card>
    </section>
  );
}
