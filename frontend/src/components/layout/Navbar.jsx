import { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { href: '/#home', label: 'الرئيسية', icon: 'fa-house' },
  { href: '/#about', label: 'من نحن', icon: 'fa-info' },
  { href: '/#pricing', label: 'الباقات', icon: 'fa-layer-group' },
  { href: '/#faq', label: 'الأسئلة الشائعة', icon: 'fa-circle-question' },
  { href: '/#contact', label: 'تواصل معنا', icon: 'fa-envelope-open-text' },
];

export default function Navbar() {
  const { hasAnySession, preferredDashboardPath } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`site-header ${isMobileMenuOpen ? 'menu-open' : ''}`}>
      <div className="container">
        <div className="nav-wrap">
          <div className="nav-actions desktop-actions">
            {hasAnySession ? (
              <Link to={preferredDashboardPath} onClick={closeMenu}>
                <Button variant="secondary">
                  <i className="fa-solid fa-table-columns"></i>
                  حسابي
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login" onClick={closeMenu}>
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
              <a key={item.href} href={item.href} onClick={closeMenu}>
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <a href="/#home" className="brand" onClick={closeMenu}>
            <span className="brand-mark">
              <i className="fa-solid fa-id-card"></i>
            </span>
            <div>
              <strong>linestart</strong>
            </div>
          </a>
        </div>

        <div className={`mobile-dropdown ${isMobileMenuOpen ? 'open' : ''}`}>
          <nav className="mobile-dropdown-nav">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={closeMenu}>
                <i className={`fa-solid ${item.icon}`}></i>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          <div className="mobile-dropdown-actions">
            {hasAnySession ? (
              <Link to={preferredDashboardPath} onClick={closeMenu}>
                <Button variant="secondary" fullWidth>
                  <i className="fa-solid fa-table-columns"></i>
                  لوحتي
                </Button>
              </Link>
            ) : (
              <Link to="/auth/login" onClick={closeMenu}>
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
  );
}
