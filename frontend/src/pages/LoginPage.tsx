/**
 * LoginPage — страница входа с shadcn/ui компонентами.
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
import { login, getAppUser, createAppUser } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { cn } from '../lib/utils';

/** Ошибки полей формы входа */
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
     * Валидирует поля формы входа.
     * @returns true если форма корректна
     */
    function validateForm(): boolean {
        const newErrors: LoginErrors = {};
        if (!username.trim()) newErrors.username = t('login.errors.usernameRequired') || 'Username is required';
        if (!password) newErrors.password = t('login.errors.passwordRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Отправка формы входа.
     * Вызывает GraviBase auth API и сохраняет токен.
     */
    async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});

        try {
            const loginResult = await login(username.trim(), password);

            if (loginResult.success && loginResult.token) {
                const token = loginResult.token;
                localStorage.setItem('gravisales_token', token.access_token);
                localStorage.setItem('gravisales_username', username.trim());
                if (token.refresh_token) localStorage.setItem('gravisales_refresh_token', token.refresh_token);
                sessionStorage.setItem('gravisales_current_user', username.trim());

                const appUserResult = await getAppUser(username.trim());

                if (!appUserResult.success && appUserResult.error === 'notFound') {
                    await createAppUser(username.trim());
                    navigate('/join-organization');
                    return;
                }

                if (appUserResult.user) {
                    const user = appUserResult.user;
                    if (!user.isActive) {
                        setErrors({ general: t('login.errors.accountDisabled') || 'Account is disabled.' });
                        localStorage.clear();
                        return;
                    }
                    navigate(user.orgCode ? '/' : '/join-organization');
                } else {
                    setErrors({ general: t('login.errors.serverError') });
                }
            } else {
                const errorKey = loginResult.error === 'invalidCredentials'
                    ? 'login.errors.invalidCredentials'
                    : loginResult.error === 'networkError'
                        ? 'login.errors.networkError'
                        : 'login.errors.serverError';
                setErrors({ general: t(errorKey) });
            }
        } catch (err) {
            console.error('Login error:', err);
            setErrors({ general: t('login.errors.serverError') });
        } finally {
            setIsLoading(false);
        }
    }

    // Предзаполнение сохранённого логина
    useState(() => {
        const savedUsername = localStorage.getItem('gravisales_username');
        if (savedUsername) { setUsername(savedUsername); setRememberMe(true); }
    });

    return (
        <AuthLayout>
            <div className="w-full">
                <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight leading-tight">
                    {t('login.title')}
                </h1>
                <p className="text-muted-foreground text-base mb-10 leading-relaxed">
                    {t('login.subtitle')}
                </p>

                {/* General Error */}
                {errors.general && (
                    <div
                        className="w-full mb-6 px-4 py-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-fade-in"
                        role="alert"
                    >
                        <span className="text-lg shrink-0">⚠️</span>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full" noValidate>
                    {/* Username */}
                    <div className="flex flex-col gap-3">
                        <Label htmlFor="login-username">
                            {t('login.username') || 'Username'}
                        </Label>
                        <Input
                            id="login-username"
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                if (errors.username) setErrors((p) => ({ ...p, username: undefined }));
                            }}
                            placeholder={t('login.usernamePlaceholder') || 'Enter username'}
                            autoComplete="username"
                            autoFocus
                            hasError={!!errors.username}
                        />
                        {errors.username && (
                            <p className="text-xs text-destructive font-medium mt-1">{errors.username}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">{t('login.password')}</Label>
                            <button
                                type="button"
                                className="text-xs text-[#19cbfe] hover:text-[#17a8d4] font-semibold transition-colors"
                            >
                                {t('login.forgotPassword')}
                            </button>
                        </div>
                        <div className="relative">
                            <Input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                                }}
                                placeholder={t('login.passwordPlaceholder')}
                                autoComplete="current-password"
                                hasError={!!errors.password}
                                className="pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-destructive font-medium">{errors.password}</p>
                        )}
                    </div>

                    {/* Remember me */}
                    <label className="flex items-center gap-3 cursor-pointer select-none group">
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className={cn(
                                    'w-5 h-5 rounded-md border-2 cursor-pointer',
                                    'accent-[#19cbfe]'
                                )}
                            />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                            {t('login.rememberMe')}
                        </span>
                    </label>

                    {/* Submit */}
                    <Button
                        type="submit"
                        variant="cyan"
                        size="xl"
                        disabled={isLoading}
                        className="w-full mt-2"
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
                    </Button>
                </form>

                <p className="mt-8 text-sm text-muted-foreground">
                    {t('login.noAccount')}{' '}
                    <Link
                        to="/register"
                        className="text-[#19cbfe] hover:text-[#17a8d4] font-semibold transition-colors"
                    >
                        {t('login.register')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
