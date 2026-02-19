import { useEffect, useState, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinOrganizationPage } from './pages/JoinOrganizationPage';
import { getUserProfile } from './lib/api';

/**
 * Placeholder dashboard page — displayed after successful login.
 */
function DashboardPlaceholder(): ReactElement {
  const [username, setUsername] = useState<string | null>(null);
  const [orgCode, setOrgCode] = useState<string | null>(null);

  useEffect(() => {
    const user = localStorage.getItem('gravisales_username');
    setUsername(user);

    async function fetchProfile() {
      if (user) {
        const profile = await getUserProfile(user);
        if (profile && profile.orgCode) {
          setOrgCode(profile.orgCode);
        }
      }
    }
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[#19cbfe] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          GraviSales CRM
        </h1>
        <p className="text-gray-600 mb-4">
          Welcome, {username}!
          {orgCode && <span className="block text-sm text-gray-400 mt-1">Organization: {orgCode}</span>}
        </p>
        <p className="text-gray-500 mb-6 text-sm">
          Dashboard is under construction.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = '/login';
          }}
          className="px-6 py-3 rounded-xl text-sm font-bold
                     bg-gray-100 text-gray-700
                     hover:bg-gray-200
                     transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

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
        const profile = await getUserProfile(username);
        if (profile && profile.orgCode) {
          setHasOrg(true);
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
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
            <DashboardPlaceholder />
          </ProtectedRoute>
        } />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
