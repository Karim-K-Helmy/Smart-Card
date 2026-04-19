import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginAsUser } = useAuth();

  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const { data } = await loginUser(formData);
      loginAsUser(data.data);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (apiError) {
      const apiCode = apiError?.response?.data?.code;
      const message = apiCode === 'ACCOUNT_SUSPENDED'
        ? 'تم إيقاف حسابك، يُرجى الرجوع إلى الإدارة.'
        : extractApiError(apiError);

      setStatus({ loading: false, error: message });
    }
  };

  const isSuspensionError = /تم إيقاف حسابك|account_suspended|suspended/i.test(status.error);

  return (
    <section className="auth-section">
      <Card className="auth-card" title="تسجيل الدخول">
        <p style={{ marginBottom: '24px', color: 'var(--muted)', textAlign: 'center' }}>
          أدخل بيانات حسابك لتسجيل الدخول إلى لوحة التحكم.
        </p>

        {status.error ? (
          <div
            role="alert"
            style={{
              marginBottom: '18px',
              padding: '16px 18px',
              borderRadius: '18px',
              border: isSuspensionError ? '1px solid rgba(249, 115, 22, .28)' : '1px solid rgba(239, 68, 68, .2)',
              background: isSuspensionError
                ? 'linear-gradient(135deg, rgba(249, 115, 22, .14), rgba(251, 146, 60, .06))'
                : 'linear-gradient(135deg, rgba(239, 68, 68, .14), rgba(127, 29, 29, .08))',
              color: isSuspensionError ? '#9a3412' : '#991b1b',
              boxShadow: isSuspensionError
                ? '0 14px 30px rgba(249, 115, 22, .10)'
                : '0 14px 30px rgba(239, 68, 68, .08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSuspensionError ? 'rgba(249, 115, 22, .16)' : 'rgba(239, 68, 68, .14)',
                  color: isSuspensionError ? '#c2410c' : '#dc2626',
                  flexShrink: 0,
                }}
              >
                <i className={`fa-solid ${isSuspensionError ? 'fa-user-lock' : 'fa-triangle-exclamation'}`}></i>
              </span>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>
                  {isSuspensionError ? 'تنبيه من الإدارة' : 'تعذر تسجيل الدخول'}
                </strong>
                <span style={{ lineHeight: 1.8 }}>{status.error}</span>
              </div>
            </div>
          </div>
        ) : null}

        <form className="form-card" onSubmit={handleSubmit}>
          <label>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <i className="fa-solid fa-user-large" style={{ color: '#2596be' }}></i>
              البريد الإلكتروني أو رقم الهاتف
            </span>

            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-envelope"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9aa4b2',
                  fontSize: '14px',
                }}
              ></i>

              <input
                type="text"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleChange}
                placeholder="أدخل البريد الإلكتروني أو رقم الهاتف"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </label>

          <label>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <i className="fa-solid fa-lock" style={{ color: '#2596be' }}></i>
              كلمة المرور
            </span>

            <div style={{ position: 'relative' }}>
              <i
                className="fa-solid fa-key"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9aa4b2',
                  fontSize: '14px',
                }}
              ></i>

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              marginBottom: '8px',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <label
              className="checkbox-line"
              style={{
                margin: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#2596be',
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: '0.9rem', color: '#66728a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-check" style={{ color: '#2596be', fontSize: '12px' }}></i>
                تذكرني
              </span>
            </label>

            <Link
              to="/auth/forgot-password"
              style={{
                color: '#2596be',
                fontSize: '0.9rem',
                fontWeight: '600',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className="fa-solid fa-unlock-keyhole"></i>
              نسيت كلمة المرور؟
            </Link>
          </div>

          {status.error ? (
            <p
              className="error-text"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <i className="fa-solid fa-xmark"></i>
              {status.error}
            </p>
          ) : null}

          <Button type="submit" disabled={status.loading} fullWidth style={{ marginTop: '10px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <i className={`fa-solid ${status.loading ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'}`}></i>
              {status.loading ? 'جارٍ تسجيل الدخول...' : 'دخول'}
            </span>
          </Button>
        </form>

        <div
          className="auth-links"
          style={{
            justifyContent: 'center',
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ color: 'var(--muted)' }}>ليس لديك حساب؟</span>
          <Link
            to="/auth/register"
            style={{
              color: '#2596be',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <i className="fa-solid fa-user-plus"></i>
            إنشاء حساب جديد
          </Link>
        </div>
      </Card>
    </section>
  );
}