import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import PricingPage from './pages/public/PricingPage';
import ContactPage from './pages/public/ContactPage';
import FaqPage from './pages/public/FaqPage';
import PublicProfilePage from './pages/public/PublicProfilePage';
import RegisterPage from './pages/auth/RegisterPage';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/user/DashboardPage';
import AccountPage from './pages/user/AccountPage';
import PersonalProfilePage from './pages/user/PersonalProfilePage';
import BusinessProfilePage from './pages/user/BusinessProfilePage';
import SocialLinksPage from './pages/user/SocialLinksPage';
import ProductsPage from './pages/user/ProductsPage';
import RequestCardPage from './pages/user/RequestCardPage';
import OrdersPage from './pages/user/OrdersPage';
import MyCardPage from './pages/user/MyCardPage';
import NotificationsPage from './pages/user/NotificationsPage';
import ProfileManagerPage from './pages/user/ProfileManagerPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminForgotPasswordPage from './pages/admin/AdminForgotPasswordPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminCardsPage from './pages/admin/AdminCardsPage';
import AdminMessagesPage from './pages/admin/AdminMessagesPage';
import AdminActionsPage from './pages/admin/AdminActionsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminDataRequestsPage from './pages/admin/AdminDataRequestsPage';
import AdminManagementPage from './pages/admin/AdminManagementPage';
import AdminResourceMonitoringPage from './pages/admin/AdminResourceMonitoringPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/profile/:slug" element={<PublicProfilePage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="user">
            <DashboardLayout area="user" />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="profile-manager" element={<ProfileManagerPage />} />
        <Route path="personal-profile" element={<Navigate to="/dashboard/profile-manager?tab=personal" replace />} />
        <Route path="business-profile" element={<Navigate to="/dashboard/profile-manager?tab=business" replace />} />
        <Route path="social-links" element={<Navigate to="/dashboard/profile-manager?tab=social" replace />} />
        <Route path="products" element={<Navigate to="/dashboard/profile-manager?tab=products" replace />} />
        <Route path="request-card" element={<RequestCardPage />} />
        <Route path="payment" element={<Navigate to="/dashboard/request-card" replace />} />
        <Route path="upload-receipt" element={<Navigate to="/dashboard/request-card" replace />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="my-card" element={<MyCardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/forgot-password" element={<AdminForgotPasswordPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <DashboardLayout area="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="cards" element={<AdminCardsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="admins" element={<AdminManagementPage />} />
        <Route path="resource-monitoring" element={<AdminResourceMonitoringPage />} />
        <Route path="actions" element={<AdminActionsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
