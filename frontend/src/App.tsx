import { useEffect, useState, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinOrganizationPage } from './pages/JoinOrganizationPage';
import { DashboardPage } from './pages/DashboardPage';
import { getUserProfile } from './lib/api';

function ProtectedRoute({ children }: { children: ReactElement }): ReactElement {
  const token = localStorage.getItem('gravisales_token');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);

  useEffect(() => {
    async function checkProfile() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      const username = localStorage.getItem('gravisales_username');
      if (username) {
        try {
          const profile = await getUserProfile(username);
          if (profile && profile.orgCode) {
            setHasOrg(true);
          }
        } catch (error) {
          console.error('Failed to fetch profile:', error);
        }
      }
      setIsLoading(false);
    }
    checkProfile();
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If no org code and trying to go to dashboard (/) -> redirect to join
  if (!hasOrg && location.pathname === '/') {
    return <Navigate to="/join-organization" replace />;
  }

  // If has org code and trying to join -> redirect to dashboard
  if (hasOrg && location.pathname === '/join-organization') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/join-organization" element={
          <ProtectedRoute>
            <JoinOrganizationPage />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
