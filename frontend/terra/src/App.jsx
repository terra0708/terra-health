import { Suspense, lazy } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from '@shared/views/Login/LoginPage';
import useAuthStore from '@shared/modules/auth/hooks/useAuthStore';
import MainLayout from '@shared/app/MainLayout';
import * as Views from './views/Placeholders.jsx';
import { ErrorBoundary, LoadingSpinner, PageSkeleton } from '@common/ui';

// Lazy load pages for code splitting and performance
const UsersPage = lazy(() => import('@shared/views/Settings/UsersPage'));
const PermissionsPage = lazy(() => import('@shared/views/Settings/PermissionsPage'));
const CustomersPage = lazy(() => import('@terra-health/views/Customers/CustomersPage'));
const CustomerPanel = lazy(() => import('@shared/views/Settings/CustomerPanel'));
const AppointmentsPage = lazy(() => import('@terra-health/views/Appointments/AppointmentsPage'));
const MarketingDashboard = lazy(() => import('@terra-ads/views/marketing/MarketingDashboard'));
const MarketingCampaigns = lazy(() => import('@terra-ads/views/marketing/MarketingCampaigns'));
const MarketingAttribution = lazy(() => import('@terra-ads/views/marketing/MarketingAttribution'));
const MarketingCampaignDetail = lazy(() => import('@terra-ads/views/marketing/MarketingCampaignDetail'));
const NotificationsPage = lazy(() => import('@shared/views/Notifications/NotificationsPage'));
const DashboardPage = lazy(() => import('@terra-health/views/Dashboard/DashboardPage'));
const RemindersPage = lazy(() => import('@terra-health/views/Reminders/RemindersPage'));
const ReminderSettingsPage = lazy(() => import('@shared/views/Settings/ReminderSettingsPage'));
const SystemSettingsPage = lazy(() => import('@shared/views/Settings/SystemSettingsPage'));

// Protected Route component with Error Boundary
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Lazy loaded route wrapper with Suspense and Error Boundary
const LazyRoute = ({ children, moduleName }) => (
  <ErrorBoundary level="component" moduleName={moduleName}>
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

function App() {
  return (
    <ErrorBoundary level="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Korumalı Rotalar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<LazyRoute moduleName="Dashboard"><DashboardPage /></LazyRoute>} />
          <Route path="appointments" element={<LazyRoute moduleName="Appointments"><AppointmentsPage /></LazyRoute>} />
          <Route path="customers" element={<LazyRoute moduleName="Customers"><CustomersPage /></LazyRoute>} />
          <Route path="reminders" element={<LazyRoute moduleName="Reminders"><RemindersPage /></LazyRoute>} />
          <Route path="marketing">
            <Route index element={<Navigate to="/marketing/dashboard" replace />} />
            <Route path="dashboard" element={<LazyRoute moduleName="Marketing"><MarketingDashboard /></LazyRoute>} />
            <Route path="campaigns" element={<LazyRoute moduleName="Marketing"><MarketingCampaigns /></LazyRoute>} />
            <Route path="campaigns/:id" element={<LazyRoute moduleName="Marketing"><MarketingCampaignDetail /></LazyRoute>} />
            <Route path="attribution" element={<LazyRoute moduleName="Marketing"><MarketingAttribution /></LazyRoute>} />
          </Route>
          <Route path="statistics" element={<LazyRoute moduleName="Statistics"><Views.Statistics /></LazyRoute>} />
          <Route path="notifications" element={<LazyRoute moduleName="Notifications"><NotificationsPage /></LazyRoute>} />
          <Route path="settings">
            <Route index element={<LazyRoute moduleName="Settings"><SystemSettingsPage /></LazyRoute>} />
            <Route path="users" element={<LazyRoute moduleName="Settings"><UsersPage /></LazyRoute>} />
            <Route path="permissions" element={<LazyRoute moduleName="Settings"><PermissionsPage /></LazyRoute>} />
            <Route path="reminders" element={<LazyRoute moduleName="Settings"><ReminderSettingsPage /></LazyRoute>} />
            <Route path="customer-panel" element={<LazyRoute moduleName="Settings"><CustomerPanel /></LazyRoute>} />
          </Route>
        </Route>

        {/* 404 - Tanımsız rotaları login'e yönlendir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
