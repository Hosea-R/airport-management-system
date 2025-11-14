import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import RegionalAdminDashboard from './pages/RegionalAdminDashboard';
import AirportsManagement from './pages/AirportsManagement';
import AirlinesManagement from './pages/AirlinesManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Route publique */}
          <Route path="/login" element={<LoginPage />} />

          {/* Routes protégées SuperAdmin */}
          <Route
            path="/superadmin/dashboard"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/superadmin/airports"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <AirportsManagement />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/superadmin/airlines"
            element={
              <ProtectedRoute requiredRole="superadmin">
                <AirlinesManagement />
              </ProtectedRoute>
            }
          />

          {/* Routes protégées Admin Régional */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="admin_regional">
                <RegionalAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirection par défaut */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Route 404 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;