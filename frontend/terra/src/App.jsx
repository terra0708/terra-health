import { Suspense, lazy, useState, useEffect } from 'react';
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
const SchemaPoolDashboard = lazy(() => import('@shared/views/SuperAdmin/SchemaPoolDashboard'));

// Protected Route component with Hydration Control
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration durumunu takip et + Timeout kontrolü
  useEffect(() => {
    // Normal hydration
    if (hasHydrated) {
      setIsHydrated(true);
      return;
    }

    // KRİTİK: Sonsuz bekleme riski - Timeout kontrolü
    // Eğer localStorage bozulursa veya onRehydrateStorage tetiklenmezse
    // 500ms sonra zorla hydration'ı tamamla (production seviyesi güvenlik)
    const timeoutId = setTimeout(() => {
      setIsHydrated(true);
    }, 500); // 500ms timeout

    return () => {
      clearTimeout(timeoutId);
    };
  }, [hasHydrated]);

  // Hydration tamamlanana kadar loading göster
  // KRİTİK: PageSkeleton kullan (flickering önlemek için)
  // Hydration genellikle 10-50ms sürer, LoadingSpinner yanıp sönebilir
  // PageSkeleton sayfa geçişini daha yumuşak hissettirir (UX iyileştirmesi)
  if (!isHydrated) {
    return <PageSkeleton />;
  }

  // Hydration tamamlandı, yetki kontrolü yap
  // KRİTİK: replace flag'i hayati önem taşıyor
  // Kullanıcı login sayfasına yönlendirildiğinde tarayıcının "geri" butonuyla
  // o kısıtlı alana tekrar girmeye çalışmasını bu flag engeller
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
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
          <Route path="super-admin">
            <Route path="schema-pool" element={<LazyRoute moduleName="SchemaPool"><SchemaPoolDashboard /></LazyRoute>} />
          </Route>
        </Route>

        {/* 404 - Tanımsız rotaları login'e yönlendir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
