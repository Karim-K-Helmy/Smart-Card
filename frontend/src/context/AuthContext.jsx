import { createContext, useContext, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const USER_AUTH_KEY = 'userAuth';
export const ADMIN_AUTH_KEY = 'adminAuth';
export const USER_TOKEN_KEY = 'userToken';
export const ADMIN_TOKEN_KEY = 'adminToken';

const AuthContext = createContext(null);

const EMPTY_AUTH = {
  token: '',
  role: '',
  user: null,
};

function readStoredAuth(storageKey, tokenKey, fallbackRole) {
  const rawAuth = localStorage.getItem(storageKey);
  const rawToken = localStorage.getItem(tokenKey);

  if (!rawAuth && !rawToken) {
    return { ...EMPTY_AUTH };
  }

  try {
    const parsed = rawAuth ? JSON.parse(rawAuth) : {};
    return {
      token: parsed?.token || rawToken || '',
      role: parsed?.role || fallbackRole,
      user: parsed?.user || null,
    };
  } catch {
    return {
      token: rawToken || '',
      role: fallbackRole,
      user: null,
    };
  }
}

function persistStoredAuth(storageKey, tokenKey, nextState) {
  const normalized = {
    token: nextState?.token || '',
    role: nextState?.role || '',
    user: nextState?.user || null,
  };

  if (normalized.token) {
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    localStorage.setItem(tokenKey, normalized.token);
    return;
  }

  localStorage.removeItem(storageKey);
  localStorage.removeItem(tokenKey);
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  const currentPlan = user.currentPlan || user.accountType || 'NONE';

  return {
    _id: user._id || user.id || '',
    fullName: user.fullName || user.name || 'linestart user',
    name: user.name || user.fullName || 'linestart user',
    email: user.primaryEmail || user.email || '',
    currentPlan,
    accountType: currentPlan,
    phone: user.phone || '',
    whatsappNumber: user.whatsappNumber || '',
    profileSlug: user.profileSlug || '',
    status: user.status || '',
    role: user.role || 'user',
    avatarUrl: user.avatarUrl || user.profileImage || '',
    updatedAt: user.updatedAt || '',
    emailVerified: Boolean(user.emailVerified ?? true),
    isPrimaryAdmin: Boolean(user.isPrimaryAdmin),
  };
}

export function getStoredUserToken() {
  return localStorage.getItem(USER_TOKEN_KEY) || readStoredAuth(USER_AUTH_KEY, USER_TOKEN_KEY, 'user').token || '';
}

export function getStoredAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || readStoredAuth(ADMIN_AUTH_KEY, ADMIN_TOKEN_KEY, 'admin').token || '';
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const [userAuth, setUserAuth] = useState(() => readStoredAuth(USER_AUTH_KEY, USER_TOKEN_KEY, 'user'));
  const [adminAuth, setAdminAuth] = useState(() => readStoredAuth(ADMIN_AUTH_KEY, ADMIN_TOKEN_KEY, 'admin'));

  const saveUserAuth = (nextState) => {
    const normalized = {
      token: nextState?.token || '',
      role: 'user',
      user: normalizeUser(nextState?.user),
    };
    setUserAuth(normalized);
    persistStoredAuth(USER_AUTH_KEY, USER_TOKEN_KEY, normalized);
  };

  const saveAdminAuth = (nextState) => {
    const normalized = {
      token: nextState?.token || '',
      role: 'admin',
      user: normalizeUser(nextState?.user),
    };
    setAdminAuth(normalized);
    persistStoredAuth(ADMIN_AUTH_KEY, ADMIN_TOKEN_KEY, normalized);
  };

  const loginAsUser = (payload) => {
    saveUserAuth({
      token: payload?.token || '',
      user: payload?.user,
    });
  };

  const loginAsAdmin = (payload) => {
    saveAdminAuth({
      token: payload?.token || '',
      user: payload?.admin,
    });
  };

  const updateStoredUser = (userPatch) => {
    if (location.pathname.startsWith('/admin')) {
      saveAdminAuth({
        ...adminAuth,
        user: {
          ...(adminAuth.user || {}),
          ...(userPatch || {}),
        },
      });
      return;
    }

    saveUserAuth({
      ...userAuth,
      user: {
        ...(userAuth.user || {}),
        ...(userPatch || {}),
      },
    });
  };

  const logoutUser = () => saveUserAuth(EMPTY_AUTH);
  const logoutAdmin = () => saveAdminAuth(EMPTY_AUTH);

  const logout = (role) => {
    if (role === 'admin') {
      logoutAdmin();
      return;
    }

    if (role === 'user') {
      logoutUser();
      return;
    }

    if (location.pathname.startsWith('/admin')) {
      logoutAdmin();
      return;
    }

    logoutUser();
  };

  const currentAuth = location.pathname.startsWith('/admin') ? adminAuth : userAuth;
  const preferredDashboardPath = adminAuth.token ? '/admin' : userAuth.token ? '/dashboard' : '/auth/login';

  const value = useMemo(
    () => ({
      authState: currentAuth,
      currentAuth,
      userAuth,
      adminAuth,
      isAuthenticated: Boolean(currentAuth.token),
      isUserAuthenticated: Boolean(userAuth.token),
      isAdminAuthenticated: Boolean(adminAuth.token),
      isUser: Boolean(userAuth.token) && !location.pathname.startsWith('/admin'),
      isAdmin: Boolean(adminAuth.token) && location.pathname.startsWith('/admin'),
      hasAnySession: Boolean(userAuth.token || adminAuth.token),
      preferredDashboardPath,
      loginAsUser,
      loginAsAdmin,
      updateStoredUser,
      logout,
      logoutUser,
      logoutAdmin,
    }),
    [currentAuth, userAuth, adminAuth, location.pathname, preferredDashboardPath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
