import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { isAuthenticated, isAdmin, isUser } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/auth/login'} replace state={{ from: location }} />;
  }

  if (role === 'admin' && !isAdmin) return <Navigate to="/dashboard" replace />;
  if (role === 'user' && !isUser) return <Navigate to="/admin" replace />;

  return children;
}
