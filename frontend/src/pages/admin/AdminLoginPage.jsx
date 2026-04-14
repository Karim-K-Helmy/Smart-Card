import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { loginAdmin } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAsAdmin } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await loginAdmin(form);
      loginAsAdmin(data.data);
      navigate('/admin', { replace: true });
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="دخول الأدمن">
        <p>تسجيل دخول الأدمن يتم الآن بالبريد الإلكتروني وكلمة المرور فقط. رسائل البريد الخاصة بالأدمن أصبحت مخصصة لكلمة المرور فقط عند التعديل أو النسيان.</p>
        <form className="form-card" onSubmit={handleSubmit}>
          <label><span>البريد الإلكتروني</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label><span>كلمة المرور</span><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ تسجيل الدخول...' : 'دخول الأدمن'}</Button>
        </form>
        <div className="auth-links">
          <Link to="/admin/forgot-password">نسيت كلمة المرور؟</Link>
        </div>
      </Card>
    </section>
  );
}
