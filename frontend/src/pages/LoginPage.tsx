/**
 * Login page with username/password form.
 * Supports i18n and form validation.
 *
 * @example
 * // Route: /login
 * <LoginPage />
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { login } from '../lib/api';

/** Form field errors */
interface LoginErrors {
    username?: string;
    password?: string;
    general?: string;
}

export function LoginPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<LoginErrors>({});

    /**
     * Validates the login form fields.
     * @returns true if form is valid
     */
    function validateForm(): boolean {
        const newErrors: LoginErrors = {};

        if (!username.trim()) {
            newErrors.username = t('login.errors.usernameRequired');
        }
        if (!password) {
            newErrors.password = t('login.errors.passwordRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Handles login form submission.
     * Calls GraviBase auth API and stores token on success.
     */
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const result = await login(username.trim(), password);

            if (result.success && result.token) {
                // Store token
                localStorage.setItem('gravisales_token', result.token.access_token);
                if (result.token.refresh_token) {
                    localStorage.setItem('gravisales_refresh_token', result.token.refresh_token);
                }
                if (rememberMe) {
                    localStorage.setItem('gravisales_username', username.trim());
                } else {
                    localStorage.removeItem('gravisales_username');
                }

                // Navigate to dashboard (for now, just show success)
                navigate('/');
            } else {
                // Map API error to i18n key
                const errorKey = result.error === 'invalidCredentials'
                    ? 'login.errors.invalidCredentials'
                    : result.error === 'networkError'
                        ? 'login.errors.networkError'
                        : 'login.errors.serverError';

                setErrors({ general: t(errorKey) });
            }
        } catch {
            setErrors({ general: t('login.errors.serverError') });
        } finally {
            setIsLoading(false);
        }
    }

    // Load saved username
    useState(() => {
        const savedUsername = localStorage.getItem('gravisales_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    });

    return (
        <AuthLayout>
            <div>
                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                    {t('login.title')}
                </h1>
                <p className="text-[var(--color-text-secondary)] mb-8">
                    {t('login.subtitle')}
                </p>

                {/* Error Banner */}
                {errors.general && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200
                          text-red-700 text-sm animate-fade-in" role="alert">
                        {errors.general}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    {/* Username */}
                    <div>
                        <label
                            htmlFor="login-username"
                            className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                        >
                            {t('login.username')}
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                            }}
                            placeholder={t('login.usernamePlaceholder')}
                            autoComplete="username"
                            autoFocus
                            className={`w-full px-4 py-3 rounded-xl border text-sm
                         transition-all duration-200
                         bg-[var(--color-bg-primary)]
                         placeholder:text-[var(--color-text-tertiary)]
                         focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                         focus:border-[var(--color-primary)]
                         ${errors.username
                                    ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                    : 'border-[var(--color-border)]'}`}
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-[var(--color-error)]">{errors.username}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label
                                htmlFor="login-password"
                                className="block text-sm font-medium text-[var(--color-text-primary)]"
                            >
                                {t('login.password')}
                            </label>
                            <button
                                type="button"
                                className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
                           font-medium transition-colors cursor-pointer"
                            >
                                {t('login.forgotPassword')}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                }}
                                placeholder={t('login.passwordPlaceholder')}
                                autoComplete="current-password"
                                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm
                           transition-all duration-200
                           bg-[var(--color-bg-primary)]
                           placeholder:text-[var(--color-text-tertiary)]
                           focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                           focus:border-[var(--color-primary)]
                           ${errors.password
                                        ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                        : 'border-[var(--color-border)]'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2
                           text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]
                           transition-colors cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-xs text-[var(--color-error)]">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[var(--color-border)]
                         text-[var(--color-primary)] focus:ring-[var(--color-primary)]
                         accent-[var(--color-primary)]"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)]">
                            {t('login.rememberMe')}
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-2
                       px-6 py-3 rounded-xl text-sm font-semibold
                       bg-[var(--color-primary)] text-white
                       hover:bg-[var(--color-primary-hover)]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer
                       shadow-md hover:shadow-lg active:scale-[0.98]"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('login.submitting')}
                            </>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                {t('login.submit')}
                            </>
                        )}
                    </button>
                </form>

                {/* Register link */}
                <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                    {t('login.noAccount')}{' '}
                    <Link
                        to="/register"
                        className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
                       font-semibold transition-colors"
                    >
                        {t('login.register')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
