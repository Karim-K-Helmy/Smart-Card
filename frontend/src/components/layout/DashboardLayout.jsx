import { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAdminNotificationSummary } from '../../services/api/admin';
import { getMyNotifications } from '../../services/api/users';
import { translateDisplayValue } from '../../utils/display';

const userNav = [
  { to: '/dashboard', label: 'الرئيسية', icon: 'fa-house' },
  { to: '/dashboard/account', label: 'الحساب', icon: 'fa-shield-halved' },
  { to: '/dashboard/personal-profile', label: 'البروفايل الشخصي', icon: 'fa-user-large' },
  { to: '/dashboard/business-profile', label: 'البروفايل التجاري', icon: 'fa-building' },
  { to: '/dashboard/social-links', label: 'روابط السوشيال', icon: 'fa-share-nodes' },
  { to: '/dashboard/products', label: 'الأعمال', icon: 'fa-briefcase' },
  { to: '/dashboard/request-card', label: 'طلب البطاقة', icon: 'fa-id-card' },
  { to: '/dashboard/orders', label: 'الطلبات', icon: 'fa-clipboard-list', badgeKey: 'orders' },
  { to: '/dashboard/my-card', label: 'بطاقتي', icon: 'fa-id-badge' },
  { to: '/dashboard/notifications', label: 'الإشعارات', icon: 'fa-bell', badgeKey: 'notifications' },
  { to: '/dashboard/settings', label: 'الإعدادات', icon: 'fa-gears' },
];

const adminNav = [
  { to: '/admin', label: 'الرئيسية', icon: 'fa-chart-column' },
  { to: '/admin/users', label: 'المستخدمون', icon: 'fa-users', badgeKey: 'users' },
  { to: '/admin/orders', label: 'الطلبات', icon: 'fa-clipboard-list', badgeKey: 'orders' },
  { to: '/admin/payments', label: 'المدفوعات', icon: 'fa-money-bill-wave', badgeKey: 'payments' },
  { to: '/admin/cards', label: 'البطاقات', icon: 'fa-id-card' },
  { to: '/admin/messages', label: 'الرسائل', icon: 'fa-message', badgeKey: 'messages' },
  { to: '/admin/actions', label: 'سجل العمليات', icon: 'fa-clipboard-check' },
  { to: '/admin/settings', label: 'الإعدادات', icon: 'fa-gears' },
];

const BADGE_SYNC_EVENT = 'dashboard-badge-sync';

const getInitials = (name) =>
  String(name || 'LS')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export default function DashboardLayout({ area }) {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = useMemo(() => (area === 'admin' ? adminNav : userNav), [area]);
  const userName = authState.user?.fullName || authState.user?.name || 'LineStart';
  const userEmail = authState.user?.email || '';

  const refreshBadges = useCallback(async () => {
    try {
      if (area === 'admin') {
        const { data } = await getAdminNotificationSummary();
        setCounts(data.data?.counts || {});
      } else {
        const { data } = await getMyNotifications();
        setCounts(data.data?.counts || {});
      }
    } catch {
      setCounts({});
    }
  }, [area]);

  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      refreshBadges();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [refreshBadges]);

  useEffect(() => {
    const handleBadgeSync = (event) => {
      const detail = event.detail || {};
      if (detail.area !== area || !detail.key) return;

      setCounts((prev) => ({
        ...prev,
        [detail.key]: 0,
      }));

      refreshBadges();
    };

    window.addEventListener(BADGE_SYNC_EVENT, handleBadgeSync);
    return () => window.removeEventListener(BADGE_SYNC_EVENT, handleBadgeSync);
  }, [area, refreshBadges]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate(area === 'admin' ? '/admin/login' : '/');
  };

  return (
    <div className="dashboard-shell">
      <button
        type="button"
        className={`sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="إغلاق القائمة الجانبية"
      />

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <strong>
            <i className="fa-solid fa-id-card"></i>
            <span>LineStart</span>
          </strong>
          <small>{area === 'admin' ? 'لوحة إدارة المنصة' : 'لوحة إدارة بطاقتك الذكية'}</small>
        </div>

        <div className="sidebar-header">
          <div className="sidebar-profile-card">
            {authState.user?.avatarUrl ? (
              <img className="sidebar-avatar" src={authState.user.avatarUrl} alt={userName} />
            ) : (
              <div className="sidebar-avatar sidebar-avatar-fallback">{getInitials(userName)}</div>
            )}
            <div className="sidebar-profile-text">
              <span className="sidebar-role">{area === 'admin' ? 'لوحة الأدمن' : 'لوحة المستخدم'}</span>
              <strong>{userName}</strong>
              <small>{userEmail}</small>
            </div>
          </div>
          <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="إغلاق">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="sidebar-scroll">
          <nav className="sidebar-nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/dashboard' || item.to === '/admin'}>
                <span className="nav-link-content">
                  <i className={`fa-solid ${item.icon}`}></i>
                  <span>{item.label}</span>
                </span>
                {item.badgeKey && counts?.[item.badgeKey] ? <span className="nav-badge">{counts[item.badgeKey]}</span> : null}
              </NavLink>
            ))}
          </nav>
        </div>

        <button className="logout-btn" type="button" onClick={handleLogout}>
          <i className="fa-solid fa-sign-out-alt"></i>
          <span>تسجيل الخروج</span>
        </button>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-start">
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="فتح القائمة الجانبية"
            >
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div className="topbar-user">
              {authState.user?.avatarUrl ? (
                <img className="topbar-avatar" src={authState.user.avatarUrl} alt={userName} />
              ) : (
                <div className="topbar-avatar topbar-avatar-fallback">{getInitials(userName)}</div>
              )}
              <div>
                <strong>{userName}</strong>
                <small>{userEmail}</small>
              </div>
            </div>
          </div>
          <div className="topbar-pill">
            <i className={`fa-solid ${area === 'admin' ? 'fa-shield-halved' : 'fa-layer-group'}`}></i>
            <span>{area === 'admin' ? 'لوحة الأدمن' : translateDisplayValue(authState.user?.currentPlan || 'NONE')}</span>
          </div>
        </header>
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
