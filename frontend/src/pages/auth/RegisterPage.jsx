import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { registerUser, verifyUserRegistration } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();
  const [step, setStep] = useState('form');
  const [activationMeta, setActivationMeta] = useState(null);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [otpCode, setOtpCode] = useState('');
  const [status, setStatus] = useState({ loading: false, verifying: false, error: '', success: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: false, verifying: false, error: '', success: '' });
    if (form.password.length < 6) return setStatus((prev) => ({ ...prev, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' }));
    if (form.password !== form.confirmPassword) return setStatus((prev) => ({ ...prev, error: 'تأكيد كلمة المرور غير مطابق.' }));

    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const payload = { ...form };
      delete payload.confirmPassword;
      const { data } = await registerUser(payload);
      setActivationMeta(data.data.activation || null);
      setStep('verify');
      setStatus({
        loading: false,
        verifying: false,
        error: '',
        success: 'تم إنشاء الحساب. تم إرسال رسالة التفعيل مرة واحدة إلى بريدك الإلكتروني، لذلك أدخل الكود المرسل لإكمال التفعيل.',
      });
    } catch (apiError) {
      setStatus({ loading: false, verifying: false, error: extractApiError(apiError), success: '' });
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setStatus((prev) => ({ ...prev, verifying: true, error: '' }));
    try {
      const { data } = await verifyUserRegistration({ email: form.email, code: otpCode });
      loginAsUser(data.data);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setStatus((prev) => ({ ...prev, verifying: false, error: extractApiError(apiError) }));
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card wide-auth-card" title={step === 'form' ? 'إنشاء حساب جديد' : 'تفعيل الحساب'}>
        {step === 'form' ? (
          <form className="form-card" onSubmit={handleSubmit}>
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
            <p className="muted">بعد التسجيل سيتم إرسال رسالة تفعيل واحدة فقط إلى بريدك الإلكتروني. تأكد من صحة البريد قبل الضغط على إنشاء الحساب.</p>
            {status.error ? <p className="error-text">{status.error}</p> : null}
            <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</Button>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleVerify}>
            <p>أدخل كود التفعيل المرسل إلى: <strong>{form.email}</strong></p>
            <div className="notice-card notice-info">
              <strong>مهم</strong>
              <p>رسالة التفعيل تُرسل مرة واحدة فقط عند إنشاء الحساب لأول مرة، لذلك لن يظهر هنا زر إعادة إرسال.</p>
            </div>
            <label><span>كود التفعيل</span><input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} required /></label>
            {activationMeta?.devCode ? <p className="muted">كود التطوير: <strong>{activationMeta.devCode}</strong></p> : null}
            {status.success ? <p className="success-text">{status.success}</p> : null}
            {status.error ? <p className="error-text">{status.error}</p> : null}
            <div className="auth-links">
              <Button type="submit" disabled={status.verifying}>{status.verifying ? 'جارٍ التفعيل...' : 'تفعيل الحساب'}</Button>
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
