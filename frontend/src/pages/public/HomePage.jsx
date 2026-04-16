import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { loginUser } from '../../services/api/auth';
import { extractApiError } from '../../utils/api';

const smartCards = [
  {
    title: 'بطاقة Line Pro',
    icon: 'fa-briefcase',
    badge: 'LINE PRO',
    lines: [
      'صفحة رقمية متكاملة لعرض خدماتك ومنتجاتك بصورة احترافية.',
      'روابط التواصل وبيانات النشاط في مكان واحد.',
      'مناسبة للشركات والعلامات التجارية وصناع الخدمات.',
    ],
    buttonText: 'اطلب باقة Pro',
    to: '/auth/register',
    featured: true,
  },
  {
    title: 'بطاقة Line Start',
    icon: 'fa-id-card',
    badge: 'LINE START',
    lines: [
      'بطاقة تعريف رقمية بديلة للكروت التقليدية.',
      'تعرض بياناتك الأساسية وروابطك بسرعة عبر QR أو الرابط المباشر.',
      'مثالية للأفراد ورواد الأعمال وبدايات المشاريع.',
    ],
    buttonText: 'ابدأ الآن',
    to: '/auth/register',
    featured: false,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
  });

  const [status, setStatus] = useState({
    loading: false,
    error: '',
  });

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
    <>
      <section className="hero-section new-hero-theme">
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
                  <Link to="/contact">تواصل معنا</Link>
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
              <Link to="/pricing">
                <Button variant="ghost" className="hero-secondary-btn">
                  <i className="fa-solid fa-layer-group"></i>
                  استعرض الباقات
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section smart-cards-showcase">
        <div className="container">
          <div className="section-heading-center">
            <span className="section-mini-title">الباقات</span>
            <h2>اختر البطاقة الأنسب لهويتك الرقمية</h2>
            <p>باقتان واضحتان تمنحانك حضورًا رقميًا أنيقًا وتجربة استخدام سهلة.</p>
          </div>

          <div className="smart-cards-grid">
            {smartCards.map((card) => (
              <article
                key={card.title}
                className={`smart-card-item ${card.featured ? 'smart-card-featured' : ''}`}
              >
                <div className="smart-card-top">
                  <div className="smart-card-icon">
                    <i className={`fa-solid ${card.icon}`}></i>
                  </div>

                  <div className="smart-card-badge">{card.badge}</div>
                </div>

                <h3>{card.title}</h3>

                <div className="smart-card-lines">
                  {card.lines.map((line) => (
                    <div key={line} className="smart-card-line">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>

                <Link to={card.to} className="smart-card-link">
                  <Button fullWidth variant={card.featured ? 'primary' : 'secondary'}>
                    <i className="fa-solid fa-arrow-left"></i>
                    {card.buttonText}
                  </Button>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
