import { useEffect, useState, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinOrganizationPage } from './pages/JoinOrganizationPage';
import { DashboardPage } from './pages/DashboardPage';
import { getAppUser } from './lib/api';

function ProtectedRoute({ children }: { children: ReactElement }): ReactElement {
  const token = localStorage.getItem('gravisales_token');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    async function checkProfile() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
      if (username) {
        try {
          const result = await getAppUser(username);
          if (result.success && result.user) {
            // App user record found
            if (result.user.orgCode) {
              setHasOrg(true);
            } else {
              setHasOrg(false);
            }
          } else {
            // User record not found in app table
            console.warn('App user record missing for:', username);
            setHasOrg(false);
          }
        } catch (error) {
          console.error('Failed to fetch app user:', error);
          setProfileError('Failed to load user status. Please try again.');
        }
      } else {
        console.warn('Token exists but no username found in storage.');
      }
      setIsLoading(false);
    }
    checkProfile();
  }, [token, location.pathname]);

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

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Error</h2>
          <p className="text-gray-500 mb-8">{profileError}</p>

          <button
            onClick={() => {
              localStorage.removeItem('gravisales_token');
              localStorage.removeItem('gravisales_username');
              localStorage.removeItem('gravisales_refresh_token');
              sessionStorage.removeItem('gravisales_current_user');
              window.location.href = '/login';
            }}
            className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
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
