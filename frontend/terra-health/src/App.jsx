import { Navigate, Routes, Route } from 'react-router-dom';
import LoginPage from './views/Login/LoginPage';
import useAuthStore from './modules/auth/hooks/useAuthStore';
import MainLayout from './app/MainLayout';
import * as Views from './views/Placeholders';
import UsersPage from './views/Users/UsersPage';
import PermissionsPage from './views/Users/PermissionsPage';

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
        <Route index element={<Views.Dashboard />} />
        <Route path="appointments" element={<Views.Appointments />} />
        <Route path="customers" element={<Views.Customers />} />
        <Route path="ads" element={<Views.Ads />} />
        <Route path="statistics" element={<Views.Statistics />} />
        <Route path="notifications" element={<Views.Notifications />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="permissions" element={<PermissionsPage />} />
        <Route path="settings" element={<Views.Settings />} />
      </Route>

      {/* 404 - Tanımsız rotaları login'e yönlendir */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
