/**
 * Main application entry point with routing.
 * Configures React Router with login, register, and dashboard routes.
 *
 * @example
 * // Routes:
 * // /login → LoginPage
 * // /register → RegisterPage
 * // / → Dashboard (placeholder)
 */
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * Placeholder dashboard page — displayed after successful login.
 * Will be replaced with the actual dashboard in later development.
 */
function DashboardPlaceholder(): ReactElement {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-secondary)]">
      <div className="text-center p-8 bg-[var(--color-bg-primary)] rounded-2xl shadow-xl max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-white">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          GraviSales CRM
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-4">
          Вы успешно вошли в систему! Dashboard будет реализован в следующем этапе.
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('gravisales_token');
            localStorage.removeItem('gravisales_refresh_token');
            window.location.href = '/login';
          }}
          className="px-4 py-2 rounded-xl text-sm font-medium
                     bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]
                     hover:bg-[var(--color-border)]
                     transition-colors cursor-pointer"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

export default function App(): ReactElement {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<DashboardPlaceholder />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
