import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { registerUser, resendUserRegistrationOtp, verifyUserRegistrationOtp } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();
  const [step, setStep] = useState('register');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '', sentTo: '' });

  const handleRegister = async (event) => {
    event.preventDefault();
    setStatus({ loading: false, error: '', success: '', sentTo: '' });
    if (form.password.length < 6) return setStatus((prev) => ({ ...prev, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' }));
    if (form.password !== form.confirmPassword) return setStatus((prev) => ({ ...prev, error: 'تأكيد كلمة المرور غير مطابق.' }));

    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const payload = { ...form };
      delete payload.confirmPassword;
      const { data } = await registerUser(payload);
      setStep('verify');
      setStatus({
        loading: false,
        error: '',
        success: 'تم إنشاء الحساب بحالة غير مؤكدة. أدخل رمز OTP لتفعيل الحساب.',
        sentTo: data.data?.verification?.sentTo || form.email,
      });
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '', sentTo: '' });
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const { data } = await verifyUserRegistrationOtp({ email: form.email, code: otpCode });
      loginAsUser(data.data);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(apiError) }));
    }
  };

  const resendCode = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const { data } = await resendUserRegistrationOtp({ email: form.email });
      setStatus((prev) => ({
        ...prev,
        loading: false,
        success: 'تم إعادة إرسال رمز التحقق.',
        sentTo: data.data?.sentTo || prev.sentTo,
      }));
    } catch (apiError) {
      setStatus((prev) => ({ ...prev, loading: false, error: extractApiError(apiError) }));
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card wide-auth-card" title={step === 'register' ? 'إنشاء حساب جديد' : 'تأكيد الحساب'}>
        {step === 'register' ? (
          <form className="form-card" onSubmit={handleRegister}>
            <div className="form-grid">
              <label><span>الاسم الكامل</span><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required /></label>
              <label><span>البريد</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
            </div>
            <div className="form-grid">
              <label><span>رقم الهاتف</span><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></label>
              <label><span>رقم الواتساب</span><input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} /></label>
            </div>
            <div className="form-grid">
              <label><span>كلمة المرور</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
              <label><span>تأكيد كلمة المرور</span><input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required /></label>
            </div>
            <p className="muted">سيتم إنشاء الحساب أولاً بحالة غير مؤكدة، ثم يلزم إدخال OTP خلال ساعة واحدة لتفعيل الحساب.</p>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</Button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleVerify}>
            <label><span>البريد الإلكتروني</span><input type="email" value={form.email} readOnly /></label>
            <label><span>رمز التحقق (OTP)</span><input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required /></label>
            <p className="muted">تم إرسال رمز التحقق إلى: <strong>{status.sentTo || form.email}</strong></p>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            <div className="row-actions">
              <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ التحقق...' : 'تأكيد الحساب'}</Button>
              <Button type="button" variant="secondary" onClick={resendCode} disabled={status.loading}>إعادة إرسال OTP</Button>
            </div>
          </form>
        )}
        <div className="auth-links">
          <Link to="/auth/login">لديك حساب بالفعل؟ تسجيل الدخول</Link>
        </div>
      </Card>
    </section>
  );
}
