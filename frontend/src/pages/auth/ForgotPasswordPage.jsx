import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { forgotPassword } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', phone: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await forgotPassword(form);
      setStatus({ loading: false, error: '', success: 'تم التحقق من البريد ورقم الهاتف.' });
      navigate(`/auth/reset-password?email=${encodeURIComponent(form.email)}&resetToken=${encodeURIComponent(data.data?.resetToken || '')}`);
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="استعادة كلمة المرور">
        <form className="form-card" onSubmit={handleSubmit}>
          <label><span>البريد الإلكتروني</span><input type="email" required placeholder="name@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span>رقم الهاتف</span><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ التحقق...' : 'متابعة تعيين كلمة المرور'}</Button>
        </form>
      </Card>
    </section>
  );
}
