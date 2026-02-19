/**
 * Login page with username/password form.
 * Large, readable inputs with proper spacing and premium feel.
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
                localStorage.setItem('gravisales_token', result.token.access_token);
                localStorage.setItem('gravisales_username', username.trim()); // Store username for profile updates
                if (result.token.refresh_token) {
                    localStorage.setItem('gravisales_refresh_token', result.token.refresh_token);
                }
                if (rememberMe) {
                    localStorage.setItem('gravisales_username', username.trim());
                } else {
                    localStorage.removeItem('gravisales_username');
                }
                navigate('/');
            } else {
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

    // Load saved username on mount
    useState(() => {
        const savedUsername = localStorage.getItem('gravisales_username');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    });

    return (
        <AuthLayout>
            <div className="w-full">
                {/* Title - Left aligned */}
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight text-left leading-tight">
                    {t('login.title')}
                </h1>
                <p className="text-gray-500 text-lg md:text-xl mb-14 text-left max-w-md leading-loose">
                    {t('login.subtitle')}
                </p>

                {/* Error Banner */}
                {errors.general && (
                    <div className="w-full mb-8 p-6 rounded-2xl bg-red-50 border border-red-200
                          text-red-700 text-base animate-fade-in flex items-center gap-4 leading-relaxed" role="alert">
                        <span className="text-2xl">⚠️</span>
                        {errors.general}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-12 w-full" noValidate>
                    {/* Username */}
                    <div className="mb-12">
                        <label
                            htmlFor="login-username"
                            className="block text-base font-semibold text-gray-800 mb-12"
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
                            className={`w-full px-5 py-6 rounded-2xl border-2 text-lg
                         transition-all duration-200
                         bg-gray-50 hover:bg-white
                         placeholder:text-gray-400
                         focus:outline-none focus:ring-4 focus:ring-cyan-100
                         focus:border-[#19cbfe] focus:bg-white
                         ${errors.username
                                    ? 'border-red-400 bg-red-50 ring-2 ring-red-100'
                                    : 'border-gray-200'}`}
                        />
                        {errors.username && (
                            <p className="mt-2 text-sm text-red-600 font-medium leading-relaxed">{errors.username}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-8 mt-4">
                            <label
                                htmlFor="login-password"
                                className="text-base font-semibold text-gray-800"
                            >
                                {t('login.password')}
                            </label>
                            <button
                                type="button"
                                className="text-sm text-[#19cbfe] hover:text-[#17a8d4]
                           font-semibold transition-colors cursor-pointer"
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
                                className={`w-full px-5 py-6 pr-14 rounded-2xl border-2 text-lg
                           transition-all duration-200
                           bg-gray-50 hover:bg-white
                           placeholder:text-gray-400
                           focus:outline-none focus:ring-4 focus:ring-cyan-100
                           focus:border-[#19cbfe] focus:bg-white
                           ${errors.password
                                        ? 'border-red-400 bg-red-50 ring-2 ring-red-100'
                                        : 'border-gray-200'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg
                           text-gray-400 hover:text-gray-600 hover:bg-gray-100
                           transition-all cursor-pointer"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-600 font-medium leading-relaxed">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-5 h-5 rounded-md border-2 border-gray-300
                         text-[#19cbfe] focus:ring-cyan-500
                         accent-[#19cbfe] cursor-pointer"
                        />
                        <span className="text-base text-gray-600 leading-relaxed">
                            {t('login.rememberMe')}
                        </span>
                    </label>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3
                       h-16 px-8 rounded-2xl text-lg font-bold
                       bg-[#19cbfe] text-white
                       hover:bg-[#17a8d4]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-200 cursor-pointer
                       shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300
                       active:scale-[0.98] mt-10!"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('login.submitting')}
                            </>
                        ) : (
                            <>
                                <LogIn className="w-5 h-5" />
                                {t('login.submit')}
                            </>
                        )}
                    </button>
                </form>

                {/* Register link */}
                <p className="mt-12 text-left text-base text-gray-500 leading-relaxed">
                    {t('login.noAccount')}{' '}
                    <Link
                        to="/register"
                        className="text-[#19cbfe] hover:text-[#17a8d4]
                       font-bold transition-colors"
                    >
                        {t('login.register')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
