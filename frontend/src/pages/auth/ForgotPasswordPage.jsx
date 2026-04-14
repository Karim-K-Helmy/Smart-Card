import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { forgotPassword } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [devCode, setDevCode] = useState('');
  const [status, setStatus] = useState({ loading: false, error: '', success: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '', success: '' });
    try {
      const { data } = await forgotPassword({ email });
      setDevCode(data.data?.devCode || '');
      setStatus({ loading: false, error: '', success: 'تم إرسال كود إعادة تعيين كلمة المرور.' });
      navigate(`/auth/reset-password?email=${encodeURIComponent(email)}${data.data?.devCode ? `&devCode=${encodeURIComponent(data.data.devCode)}` : ''}`);
    } catch (apiError) {
      setStatus({ loading: false, error: extractApiError(apiError), success: '' });
    }
  };

  return (
    <section className="auth-section">
      <Card className="auth-card" title="استعادة كلمة المرور">
        <form className="form-card" onSubmit={handleSubmit}>
          <label><span>البريد الإلكتروني</span><input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          {status.error ? <p className="error-text">{status.error}</p> : null}
          {status.success ? <p className="success-text">{status.success}</p> : null}
          {devCode ? <p className="muted">كود التطوير: <strong>{devCode}</strong></p> : null}
          <Button type="submit" disabled={status.loading}>{status.loading ? 'جارٍ الإرسال...' : 'إرسال كود الاستعادة'}</Button>
        </form>
      </Card>
    </section>
  );
}
