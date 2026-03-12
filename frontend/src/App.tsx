import { useEffect, useState, type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { JoinOrganizationPage } from './pages/JoinOrganizationPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { InvitePage } from './pages/InvitePage';
import { DashboardPage } from './pages/DashboardPage';
import { DealsPage } from './pages/deals/DealsPage';
import { DealDetailsPage } from './pages/deals/DealDetailsPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { ClientCardPage } from './pages/clients/ClientCardPage';
import { ContactsPage } from './pages/contacts/ContactsPage';
import { ContactCardPage } from './pages/contacts/ContactCardPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ImportPage } from './pages/import/ImportPage';
import { getAppUser } from './lib/api';

/** Protected route wrapper: checks auth token, org association, and onboarding completion */
function ProtectedRoute({ children }: { children: ReactElement }): ReactElement {
  const token = localStorage.getItem('gravisales_token');
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrg, setHasOrg] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
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
            setHasOrg(Boolean(result.user.orgCode));
            setOnboardingDone(Boolean(result.user.onboardingDone));
          } else {
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
    void checkProfile();
  }, [token, location.pathname]);

  // ── No token ──────────────────────────────────────────────────────────────
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ── Profile error ─────────────────────────────────────────────────────────
  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Profile Error</h2>
          <p className="text-muted-foreground mb-8">{profileError}</p>
          <button
            onClick={() => {
              localStorage.removeItem('gravisales_token');
              localStorage.removeItem('gravisales_username');
              localStorage.removeItem('gravisales_refresh_token');
              sessionStorage.removeItem('gravisales_current_user');
              window.location.href = '/login';
            }}
            className="w-full py-3 px-4 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // ── No org yet ────────────────────────────────────────────────────────────
  if (!hasOrg && location.pathname !== '/join-organization') {
    return <Navigate to="/join-organization" replace />;
  }

  // ── Has org but visiting join page ────────────────────────────────────────
  if (hasOrg && location.pathname === '/join-organization') {
    return <Navigate to="/" replace />;
  }

  // ── Onboarding guard: redirect if wizard not completed ────────────────────
  const localOnboardingDone = localStorage.getItem('gravisales_onboarding_done');
  const isDone = onboardingDone || localOnboardingDone;
  const exemptFromOnboarding = ['/onboarding', '/join-organization'].includes(location.pathname);
  if (hasOrg && !isDone && !exemptFromOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}

/** Main application with routing */
export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Invite acceptance page is public (no login required to accept) */}
        <Route path="/invite/:token" element={<InvitePage />} />

        {/* ── Protected: org join ────────────────────────────────────────── */}
        <Route path="/join-organization" element={
          <ProtectedRoute>
            <JoinOrganizationPage />
          </ProtectedRoute>
        } />

        {/* ── Protected: onboarding wizard ───────────────────────────────── */}
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } />

        {/* ── Protected: main pages ──────────────────────────────────────── */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/deals" element={
          <ProtectedRoute>
            <DealsPage />
          </ProtectedRoute>
        } />

        <Route path="/deals/:id" element={
          <ProtectedRoute>
            <DealDetailsPage />
          </ProtectedRoute>
        } />

        <Route path="/clients" element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        } />

        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <ClientCardPage />
          </ProtectedRoute>
        } />

        <Route path="/contacts" element={
          <ProtectedRoute>
            <ContactsPage />
          </ProtectedRoute>
        } />

        <Route path="/contacts/:id" element={
          <ProtectedRoute>
            <ContactCardPage />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />

        <Route path="/import" element={
          <ProtectedRoute>
            <ImportPage />
          </ProtectedRoute>
        } />

        {/* ── Catch-all ─────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
