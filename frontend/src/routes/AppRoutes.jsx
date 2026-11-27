import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout.jsx';
import AuthLayout from '../layouts/AuthLayout.jsx';
import ClientLayout from '../layouts/ClientLayout.jsx';
import AdminChatbotPage from '../pages/admin/AdminChatbotPage.jsx';
import AdminCommentsPage from '../pages/admin/AdminCommentsPage.jsx';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx';
import AdminEpisodesPage from '../pages/admin/AdminEpisodesPage.jsx';
import AdminMoviesPage from '../pages/admin/AdminMoviesPage.jsx';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage.jsx';
import AdminPlansPage from '../pages/admin/AdminPlansPage.jsx';
import AdminReportsPage from '../pages/admin/AdminReportsPage.jsx';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.jsx';
import AdminTaxonomyPage from '../pages/admin/AdminTaxonomyPage.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterPage from '../pages/auth/RegisterPage.jsx';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage.jsx';
import HomePage from '../pages/client/HomePage.jsx';
import MovieDetailPage from '../pages/client/MovieDetailPage.jsx';
import PolicyPage from '../pages/client/PolicyPage.jsx';
import PricingPage from '../pages/client/PricingPage.jsx';
import SearchPage from '../pages/client/SearchPage.jsx';
import WatchPage from '../pages/client/WatchPage.jsx';
import PlaceholderPage from '../pages/common/PlaceholderPage.jsx';
import CheckoutPage from '../pages/member/CheckoutPage.jsx';
import FavoritesPage from '../pages/member/FavoritesPage.jsx';
import HistoryPage from '../pages/member/HistoryPage.jsx';
import PaymentResultPage from '../pages/member/PaymentResultPage.jsx';
import ProfilePage from '../pages/member/ProfilePage.jsx';
import TransactionsPage from '../pages/member/TransactionsPage.jsx';
import AdminRoute from './AdminRoute.jsx';
import GuestOnlyRoute from './GuestOnlyRoute.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Authentication Routes (Guest Only) */}
      <Route element={<GuestOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
      </Route>

      {/* Public & Member Client Routes */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<SearchPage />} />
        <Route path="/movies/:slug" element={<MovieDetailPage />} />
        <Route path="/watch/:slug" element={<WatchPage />} />
        <Route path="/watch/:slug/:episodeSlug" element={<WatchPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/premium" element={<Navigate to="/pricing" replace />} />
        <Route path="/terms-of-service" element={<PolicyPage type="terms" />} />
        <Route path="/privacy-policy" element={<PolicyPage type="privacy" />} />

        {/* Member Authenticated Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/watch-history" element={<Navigate to="/history" replace />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/checkout/:planId" element={<CheckoutPage />} />
          <Route path="/payment-result/:orderCode" element={<PaymentResultPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Route>

        {/* 404 inside Client Layout */}
        <Route
          path="*"
          element={
            <PlaceholderPage
              title="Không tìm thấy trang (404)"
              description="Đường dẫn bạn truy cập không tồn tại hoặc đã được chuyển sang địa chỉ mới."
            />
          }
        />
      </Route>

      {/* Admin Portal Routes (All 11 Management Modules) */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="movies/:id/episodes" element={<AdminEpisodesPage />} />
          <Route path="episodes" element={<AdminEpisodesPage />} />
          <Route path="categories" element={<AdminTaxonomyPage defaultTab="categories" />} />
          <Route path="genres" element={<AdminTaxonomyPage defaultTab="genres" />} />
          <Route path="countries" element={<AdminTaxonomyPage defaultTab="countries" />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="plans" element={<AdminPlansPage />} />
          <Route path="premium" element={<Navigate to="/admin/plans" replace />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="transactions" element={<Navigate to="/admin/orders" replace />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="chatbot" element={<AdminChatbotPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
