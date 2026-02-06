import { Suspense, lazy, useState, useEffect } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from '@shared/views/Login/LoginPage';
import useAuthStore from '@shared/store/authStore';
import MainLayout from '@shared/app/MainLayout';
import * as Views from './views/Placeholders.jsx';
import { ErrorBoundary, LoadingSpinner, PageSkeleton } from '@common/ui';
import ForbiddenPage from '@shared/common/ui/ForbiddenPage';
import { findFirstAllowedPath } from '@shared/core/navigation';

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
const SuperAdminDashboard = lazy(() => import('@shared/views/SuperAdmin/DashboardPage'));
const TenantsPage = lazy(() => import('@shared/views/SuperAdmin/TenantsPage'));
const UserSearchPage = lazy(() => import('@shared/views/SuperAdmin/UserSearchPage'));
const AuditLogsPage = lazy(() => import('@shared/views/SuperAdmin/AuditLogsPage'));
const TrashPage = lazy(() => import('@shared/views/Trash/TrashPage'));

// Protected Route component with Hydration Control and Permission System
const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydration durumunu takip et + Timeout kontrolü
  useEffect(() => {
    if (hasHydrated) {
      setIsHydrated(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsHydrated(true);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [hasHydrated]);

  if (!isHydrated) {
    return <PageSkeleton />;
  }

  // Not authenticated? -> Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check if required
  if (requiredRole && !user?.roles?.includes(requiredRole)) {
    console.warn(`Access Denied: Required role ${requiredRole} missing.`);
    return <Navigate to="/" replace />;
  }

  // Permission check if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.warn(`Access Denied: Required permission ${requiredPermission} missing.`);

    const currentPath = window.location.pathname;
    if (currentPath === '/' || currentPath === '/dashboard') {
      const firstAllowed = findFirstAllowedPath(hasPermission, user?.roles?.includes('ROLE_SUPER_ADMIN'));

      if (firstAllowed && firstAllowed !== '/forbidden' && firstAllowed !== '/') {
        return <Navigate to={firstAllowed} replace />;
      }

      return <Navigate to="/forbidden" replace />;
    }

    return <Navigate to="/" replace />;
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

const AccessDenied = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
    <h1 style={{ color: '#d32f2f' }}>403 - Erişim Engellendi</h1>
    <p>Bu sayfayı görüntülemek için gerekli yetkiniz bulunmamaktadır.</p>
    <button
      onClick={() => window.location.href = '/'}
      style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}
    >
      Pano'ya Dön
    </button>
  </div>
);

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const [isInitializing, setIsInitializing] = useState(true);

  // CRITICAL: Initialize user on app load to prevent flicker
  // Fetch current user if persisted state indicates user was authenticated
  useEffect(() => {
    // Wait for Zustand hydration to complete
    if (!hasHydrated) {
      return;
    }

    // If user was previously authenticated (from persisted state), fetch current user
    if (isAuthenticated) {
      fetchCurrentUser()
        .then(() => {
          setIsInitializing(false);
        })
        .catch((error) => {
          // If 401/403, user is no longer authenticated - clear state
          // fetchCurrentUser already handles state clearing, just mark as initialized
          setIsInitializing(false);
        });
    } else {
      // Not authenticated, no need to fetch
      setIsInitializing(false);
    }
  }, [hasHydrated, isAuthenticated, fetchCurrentUser]);

  // Show loading spinner during initialization to prevent flicker
  if (!hasHydrated || isInitializing || loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary level="app">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* CRITICAL: Forbidden page must be OUTSIDE ProtectedRoute to avoid infinite redirect loops */}
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/403" element={<ForbiddenPage />} />

        {/* Korumalı Rotalar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ProtectedRoute requiredPermission={['DASHBOARD_VIEW', 'MODULE_DASHBOARD']}><LazyRoute moduleName="Dashboard"><DashboardPage /></LazyRoute></ProtectedRoute>} />
          <Route path="appointments" element={<ProtectedRoute requiredPermission={['APPOINTMENTS_VIEW', 'MODULE_APPOINTMENTS']}><LazyRoute moduleName="Appointments"><AppointmentsPage /></LazyRoute></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute requiredPermission={['CUSTOMERS_VIEW', 'MODULE_CUSTOMERS']}><LazyRoute moduleName="Customers"><CustomersPage /></LazyRoute></ProtectedRoute>} />
          <Route path="reminders" element={<ProtectedRoute requiredPermission={['REMINDERS_VIEW', 'MODULE_REMINDERS']}><LazyRoute moduleName="Reminders"><RemindersPage /></LazyRoute></ProtectedRoute>} />
          <Route path="marketing">
            <Route index element={<Navigate to="/marketing/dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute requiredPermission={['MARKETING_DASHBOARD', 'MODULE_MARKETING']}><LazyRoute moduleName="Marketing"><MarketingDashboard /></LazyRoute></ProtectedRoute>} />
            <Route path="campaigns" element={<ProtectedRoute requiredPermission={['MARKETING_CAMPAIGNS', 'MODULE_MARKETING']}><LazyRoute moduleName="Marketing"><MarketingCampaigns /></LazyRoute></ProtectedRoute>} />
            <Route path="campaigns/:id" element={<ProtectedRoute requiredPermission={['MARKETING_CAMPAIGNS', 'MODULE_MARKETING']}><LazyRoute moduleName="Marketing"><MarketingCampaignDetail /></LazyRoute></ProtectedRoute>} />
            <Route path="attribution" element={<ProtectedRoute requiredPermission={['MARKETING_ATTRIBUTION', 'MODULE_MARKETING']}><LazyRoute moduleName="Marketing"><MarketingAttribution /></LazyRoute></ProtectedRoute>} />
          </Route>
          <Route path="statistics" element={<ProtectedRoute requiredPermission={['STATISTICS_VIEW', 'MODULE_STATISTICS']}><LazyRoute moduleName="Statistics"><Views.Statistics /></LazyRoute></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute requiredPermission={['NOTIFICATIONS_VIEW', 'MODULE_NOTIFICATIONS']}><LazyRoute moduleName="Notifications"><NotificationsPage /></LazyRoute></ProtectedRoute>} />
          <Route path="trash" element={<ProtectedRoute requiredPermission={['CUSTOMERS_VIEW', 'MODULE_CUSTOMERS']}><LazyRoute moduleName="Trash"><TrashPage /></LazyRoute></ProtectedRoute>} />
          <Route path="settings">
            <Route index element={<ProtectedRoute requiredPermission={['SETTINGS_SYSTEM_UPDATE', 'MODULE_SETTINGS']}><LazyRoute moduleName="Settings"><SystemSettingsPage /></LazyRoute></ProtectedRoute>} />
            <Route path="users" element={<ProtectedRoute requiredPermission={['SETTINGS_USERS_VIEW', 'MODULE_SETTINGS']}><LazyRoute moduleName="Settings"><UsersPage /></LazyRoute></ProtectedRoute>} />
            <Route path="permissions" element={<ProtectedRoute requiredPermission={['SETTINGS_ROLES_VIEW', 'MODULE_SETTINGS']}><LazyRoute moduleName="Settings"><PermissionsPage /></LazyRoute></ProtectedRoute>} />
            <Route path="reminders" element={<ProtectedRoute requiredPermission={['SETTINGS_SYSTEM_UPDATE', 'MODULE_SETTINGS']}><LazyRoute moduleName="Settings"><ReminderSettingsPage /></LazyRoute></ProtectedRoute>} />
            <Route path="customer-panel" element={<ProtectedRoute requiredPermission={['SETTINGS_CUSTOMERS_P']}><LazyRoute moduleName="Settings"><CustomerPanel /></LazyRoute></ProtectedRoute>} />
          </Route>
          <Route path="super-admin">
            <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute requiredPermission={['MODULE_SUPERADMIN']}><LazyRoute moduleName="SuperAdmin"><SuperAdminDashboard /></LazyRoute></ProtectedRoute>} />
            <Route path="tenants" element={<ProtectedRoute requiredPermission={['SUPERADMIN_TENANTS_VIEW', 'MODULE_SUPERADMIN']}><LazyRoute moduleName="SuperAdmin"><TenantsPage /></LazyRoute></ProtectedRoute>} />
            <Route path="users/search" element={<ProtectedRoute requiredPermission={['SUPERADMIN_USER_SEARCH_VIEW', 'MODULE_SUPERADMIN']}><LazyRoute moduleName="SuperAdmin"><UserSearchPage /></LazyRoute></ProtectedRoute>} />
            <Route path="schema-pool" element={<ProtectedRoute requiredPermission={['SUPERADMIN_SCHEMAPOOL_VIEW', 'MODULE_SUPERADMIN']}><LazyRoute moduleName="SchemaPool"><SchemaPoolDashboard /></LazyRoute></ProtectedRoute>} />
            <Route path="audit-logs" element={<ProtectedRoute requiredPermission={['SUPERADMIN_AUDIT_VIEW', 'MODULE_SUPERADMIN']}><LazyRoute moduleName="SuperAdmin"><AuditLogsPage /></LazyRoute></ProtectedRoute>} />
          </Route>
        </Route>

        {/* 404 - Tanımsız rotaları login'e yönlendir */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
