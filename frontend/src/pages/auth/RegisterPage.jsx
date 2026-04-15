import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { registerUser } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: false, error: '', success: '' });
    if (form.password.length < 6) return setStatus((prev) => ({ ...prev, error: 'كلمة المرور يجب ألا تقل عن 6 أحرف.' }));
    if (form.password !== form.confirmPassword) return setStatus((prev) => ({ ...prev, error: 'تأكيد كلمة المرور غير مطابق.' }));

    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const payload = { ...form };
      delete payload.confirmPassword;
      const { data } = await registerUser(payload);
      loginAsUser(data.data);
      navigate('/dashboard', { replace: true });
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card wide-auth-card" title="إنشاء حساب جديد">
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
          <p className="muted">سيتم إنشاء الحساب وتفعيله مباشرة بدون أي كود تحقق.</p>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</Button>
        </form>
        <div className="auth-links">
          <Link to="/auth/login">لديك حساب بالفعل؟ تسجيل الدخول</Link>
        </div>
      </Card>
    </section>
  );
}
