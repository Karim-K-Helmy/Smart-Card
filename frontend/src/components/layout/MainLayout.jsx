import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'الرئيسية', icon: 'fa-house' },
  { to: '/about', label: 'من نحن', icon: 'fa-info' },
  { to: '/pricing', label: 'الباقات', icon: 'fa-layer-group' },
  { to: '/contact', label: 'تواصل معنا', icon: 'fa-envelope-open-text' },
];

export default function MainLayout() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="site-shell">
      <header className={`site-header ${isMobileMenuOpen ? 'menu-open' : ''}`}>
        <div className="container">
          <div className="nav-wrap">
            <div className="nav-actions desktop-actions">
              {isAuthenticated ? (
                <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary">
                    <i className="fa-solid fa-table-columns"></i>
                    لوحتي
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}>
                    <i className="fa-solid fa-sign-in-alt"></i>
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>

            <button
              className="mobile-toggle-btn"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="فتح القائمة"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isMobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <nav className="main-nav">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'}>
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <Link to="/" className="brand" onClick={() => setIsMobileMenuOpen(false)}>
              <span className="brand-mark">
                <i className="fa-solid fa-id-card"></i>
              </span>
              <div>
                <strong>LineStart</strong>
                <small>Smart Card Platform</small>
              </div>
            </Link>
          </div>

          <div className={`mobile-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
            <nav className="mobile-dropdown-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mobile-dropdown-actions">
              {isAuthenticated ? (
                <Link to={isAdmin ? '/admin' : '/dashboard'} onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="secondary" fullWidth>
                    <i className="fa-solid fa-table-columns"></i>
                    لوحتي
                  </Button>
                </Link>
              ) : (
                <Link to="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="ghost" fullWidth style={{ color: 'white', borderColor: 'rgba(255,255,255,0.45)' }}>
                    <i className="fa-solid fa-sign-in-alt"></i>
                    تسجيل الدخول
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand-col">
            <h4>
              <i className="fa-solid fa-id-card"></i>
              <span>LineStart</span>
            </h4>
            <p>
              منصة بطاقات ذكية تساعدك على تقديم هويتك الرقمية وعرض بياناتك وخدماتك بأسلوب احترافي، سريع، ومتوافق مع مختلف الأجهزة.
            </p>

            <div className="footer-social">
              <a className="social-link" href="mailto:line3.s.p.l@gmail.com" aria-label="البريد الإلكتروني">
                <i className="fa-solid fa-envelope"></i>
              </a>
              <a className="social-link" href="https://wa.me/201063877700" target="_blank" rel="noreferrer" aria-label="واتساب">
                <i className="fa-brands fa-whatsapp"></i>
              </a>
              <a className="social-link" href="https://t.me/linestartpro" target="_blank" rel="noreferrer" aria-label="تيليجرام">
                <i className="fa-brands fa-telegram-plane"></i>
              </a>
              <a className="social-link" href="https://www.facebook.com/share/1AxSA6W15P/" target="_blank" rel="noreferrer" aria-label="فيسبوك">
                <i className="fa-brands fa-facebook-f"></i>
              </a>
            </div>
          </div>

          <div>
            <h5>
              <i className="fa-solid fa-link"></i>
              روابط سريعة
            </h5>
            <Link to="/">
              <i className="fa-solid fa-house"></i>
              الرئيسية
            </Link>
            <Link to="/about">
              <i className="fa-solid fa-info"></i>
              من نحن
            </Link>
            <Link to="/pricing">
              <i className="fa-solid fa-layer-group"></i>
              الباقات
            </Link>
            <Link to="/contact">
              <i className="fa-solid fa-envelope-open-text"></i>
              تواصل معنا
            </Link>
          </div>

          <div>
            <h5>
              <i className="fa-solid fa-headset"></i>
              التواصل
            </h5>

            <a href="mailto:line3.s.p.l@gmail.com">
              <i className="fa-solid fa-envelope"></i>
              line3.s.p.l@gmail.com
            </a>

            <a href="https://wa.me/201063877700" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-whatsapp"></i>
              واتساب
            </a>

            <a href="https://t.me/linestartpro" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-telegram-plane"></i>
              تيليجرام
            </a>

            <a href="https://www.facebook.com/share/1AxSA6W15P/" target="_blank" rel="noreferrer">
              <i className="fa-brands fa-facebook-f"></i>
              فيسبوك
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
