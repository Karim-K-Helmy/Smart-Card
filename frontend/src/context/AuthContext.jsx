import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'linestart-auth';

const initialState = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {
  token: '',
  role: '',
  user: null,
};

function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;

  const currentPlan = user.currentPlan || user.accountType || 'NONE';

  return {
    _id: user._id || user.id || '',
    fullName: user.fullName || user.name || 'LineStart User',
    name: user.name || user.fullName || 'LineStart User',
    email: user.primaryEmail || user.email || '',
    currentPlan,
    accountType: currentPlan,
    phone: user.phone || '',
    whatsappNumber: user.whatsappNumber || '',
    profileSlug: user.profileSlug || '',
    status: user.status || '',
    role: user.role || 'user',
    avatarUrl: user.avatarUrl || user.profileImage || '',
    emailVerified: Boolean(user.emailVerified ?? true),
  };
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(initialState);

  const save = (nextState) => {
    setAuthState(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  };

  const loginAsUser = (payload) => {
    save({
      token: payload?.token || '',
      role: 'user',
      user: normalizeUser(payload?.user),
    });
  };

  const loginAsAdmin = (payload) => {
    save({
      token: payload?.token || '',
      role: 'admin',
      user: normalizeUser(payload?.admin),
    });
  };

  const updateStoredUser = (userPatch) => {
    save({
      ...authState,
      user: {
        ...(authState.user || {}),
        ...normalizeUser({ ...(authState.user || {}), ...(userPatch || {}) }),
      },
    });
  };

  const logout = () => {
    save({ token: '', role: '', user: null });
  };

  const value = useMemo(
    () => ({
      authState,
      isAuthenticated: Boolean(authState.token),
      isUser: authState.role === 'user',
      isAdmin: authState.role === 'admin',
      loginAsUser,
      loginAsAdmin,
      updateStoredUser,
      logout,
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
