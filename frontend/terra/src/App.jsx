import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from '@shared/views/Login/LoginPage';
import useAuthStore from '@shared/modules/auth/hooks/useAuthStore';
import MainLayout from '@shared/app/MainLayout';
import * as Views from './views/Placeholders.jsx';
import UsersPage from '@shared/views/Settings/UsersPage';
import PermissionsPage from '@shared/views/Settings/PermissionsPage';
import CustomersPage from '@terra-health/views/Customers/CustomersPage';
import CustomerPanel from '@shared/views/Settings/CustomerPanel';
import AppointmentsPage from '@terra-health/views/Appointments/AppointmentsPage';
import MarketingDashboard from '@terra-ads/views/marketing/MarketingDashboard';
import MarketingCampaigns from '@terra-ads/views/marketing/MarketingCampaigns';
import MarketingAttribution from '@terra-ads/views/marketing/MarketingAttribution';
import MarketingCampaignDetail from '@terra-ads/views/marketing/MarketingCampaignDetail';
import NotificationsPage from '@shared/views/Notifications/NotificationsPage';
import DashboardPage from '@terra-health/views/Dashboard/DashboardPage';
import RemindersPage from '@terra-health/views/Reminders/RemindersPage';
import ReminderSettingsPage from '@shared/views/Settings/ReminderSettingsPage';
import SystemSettingsPage from '@shared/views/Settings/SystemSettingsPage';
import { Box } from '@mui/material';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
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
        <Route index element={<DashboardPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="marketing">
          <Route index element={<Navigate to="/marketing/dashboard" replace />} />
          <Route path="dashboard" element={<MarketingDashboard />} />
          <Route path="campaigns" element={<MarketingCampaigns />} />
          <Route path="campaigns/:id" element={<MarketingCampaignDetail />} />
          <Route path="attribution" element={<MarketingAttribution />} />
        </Route>
        <Route path="statistics" element={<Views.Statistics />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings">
          <Route index element={<SystemSettingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="permissions" element={<PermissionsPage />} />
          <Route path="reminders" element={<ReminderSettingsPage />} />
          <Route path="customer-panel" element={<CustomerPanel />} />
        </Route>
      </Route>

      {/* 404 - Tanımsız rotaları login'e yönlendir */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
