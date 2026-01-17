import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './views/Login/LoginPage';
import useAuthStore from './modules/auth/hooks/useAuthStore';
import MainLayout from './app/MainLayout';
import * as Views from './views/Placeholders';
import UsersPage from './views/Users/UsersPage';
import PermissionsPage from './views/Users/PermissionsPage';
import CustomersPage from './views/Customers/CustomersPage';
import CustomerPanel from './views/Settings/CustomerPanel';
import AppointmentsPage from './views/Appointments/AppointmentsPage';
import MarketingDashboard from './views/marketing/MarketingDashboard';
import MarketingCampaigns from './views/marketing/MarketingCampaigns';
import MarketingAttribution from './views/marketing/MarketingAttribution';
import MarketingCampaignDetail from './views/marketing/MarketingCampaignDetail';
import NotificationsPage from './views/Notifications/NotificationsPage';
import DashboardPage from './views/Dashboard/DashboardPage';
import RemindersPage from './views/Reminders/RemindersPage';
import ReminderSettingsPage from './views/Settings/ReminderSettingsPage';
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
        <Route path="users" element={<UsersPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="settings" element={<Views.Settings />} />
        <Route path="settings/reminders" element={<ReminderSettingsPage />} />
        <Route path="customer-panel" element={<CustomerPanel />} />
      </Route>

      {/* 404 - Tanımsız rotaları login'e yönlendir */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
