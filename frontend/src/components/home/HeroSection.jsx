import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

export default function HeroSection() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();
  const [formData, setFormData] = useState({ emailOrPhone: '', password: '' });
  const [status, setStatus] = useState({ loading: false, error: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: '' });

    try {
      const { data } = await loginUser(formData);
      loginAsUser(data.data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setStatus({ loading: false, error: extractApiError(err) });
    }
  };

  return (
    <section id="home" className="hero-section new-hero-theme">
      <div className="container hero-grid">
        <div className="hero-card-display">
          <Card className="quick-login-card" title="تسجيل الدخول السريع" icon="fa-sign-in-alt">
            <form onSubmit={handleSubmit} className="quick-login-form">
              <label>
                <span>البريد الإلكتروني أو رقم الهاتف</span>
                <div className="input-with-icon">
                  <input
                    type="text"
                    name="emailOrPhone"
                    value={formData.emailOrPhone}
                    onChange={handleChange}
                    placeholder="أدخل البريد الإلكتروني أو رقم الهاتف"
                    required
                  />
                  <i className="fa-solid fa-envelope"></i>
                </div>
              </label>

              <label>
                <span>كلمة المرور</span>
                <div className="input-with-icon">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <i className="fa-solid fa-lock"></i>
                </div>
              </label>

              {status.error ? <p className="error-text">{status.error}</p> : null}

              <Button type="submit" disabled={status.loading} fullWidth className="login-submit-btn">
                <i className={`fa-solid ${status.loading ? 'fa-spinner fa-spin' : 'fa-sign-in-alt'}`}></i>
                {status.loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>

              <div className="home-login-links">
                <Link to="/auth/register">إنشاء حساب جديد</Link>
                <Link to="/auth/forgot-password">نسيت كلمة المرور؟</Link>
                <a href="/#contact">تواصل معنا</a>
              </div>
            </form>
          </Card>
        </div>

        <div className="hero-text-content">
          <span className="eyebrow hero-badge">
            <i className="fa-solid fa-star"></i>
            linestart
          </span>

          <h1>بطاقة ذكية أنيقة تعكس هويتك المهنية من أول لمسة</h1>
          <p>
            قدّم بياناتك، روابطك، وخدماتك بطريقة عصرية واحترافية. تجربة أسرع من الكروت التقليدية، وأسهل في المشاركة على كل الشاشات.
          </p>

          <div className="hero-lines-list">
            <div className="hero-line-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>تصميم احترافي متجاوب مع الهاتف والتابلت وسطح المكتب.</span>
            </div>
            <div className="hero-line-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>مشاركة فورية عبر QR أو رابط مباشر في ثوانٍ.</span>
            </div>
            <div className="hero-line-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>إدارة الحساب، الروابط، والأعمال من لوحة استخدام واضحة.</span>
            </div>
            <div className="hero-line-item">
              <i className="fa-solid fa-circle-check"></i>
              <span>مناسبة للأفراد، الشركات، والعلامات التجارية.</span>
            </div>
          </div>

          <div className="hero-actions" style={{ marginTop: '24px' }}>
            <Link to="/auth/register">
              <Button variant="primary" className="hero-register-btn">
                <i className="fa-solid fa-id-card"></i>
                اطلب بطاقتك الآن
              </Button>
            </Link>
            <a href="/#pricing">
              <Button variant="ghost" className="hero-secondary-btn">
                <i className="fa-solid fa-layer-group"></i>
                استعرض الباقات
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
