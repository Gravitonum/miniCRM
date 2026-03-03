/**
 * RegisterPage — страница регистрации с shadcn/ui компонентами.
 * Простой одношаговый флоу: имя пользователя → email → пароль.
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { register, assignRole } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

/** Ошибки полей формы регистрации */
interface RegisterErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

export function RegisterPage(): ReactElement {
    const { t } = useTranslation();

    const [isSuccess, setIsSuccess] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [errors, setErrors] = useState<RegisterErrors>({});

    /**
     * Валидирует поля формы регистрации.
     * @returns true если форма корректна
     */
    function validate(): boolean {
        const newErrors: RegisterErrors = {};

        if (!username.trim()) newErrors.username = t('register.errors.usernameRequired');
        else if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(username.trim())) newErrors.username = t('register.errors.usernameInvalid');
        else if (username.trim().length < 3) newErrors.username = t('register.errors.usernameTooShort');

        if (!email.trim()) newErrors.email = t('register.errors.emailRequired');
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('register.errors.emailInvalid');

        if (!password) newErrors.password = t('register.errors.passwordRequired');
        else if (password.length < 8) newErrors.password = t('register.errors.passwordTooShort');

        if (!confirmPassword) newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
        else if (password !== confirmPassword) newErrors.confirmPassword = t('register.errors.passwordsMismatch');

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Отправка формы регистрации.
     */
    async function handleRegister(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!validate()) return;

        setIsRegistering(true);
        setErrors({});

        try {
            const result = await register(username.trim(), email.trim(), password);

            if (result.success && result.token) {
                localStorage.setItem('gravisales_token', result.token.access_token);
                if (result.token.refresh_token) {
                    localStorage.setItem('gravisales_refresh_token', result.token.refresh_token);
                }
                if (result.username) await assignRole(result.username, 'Viewer');
                setIsSuccess(true);
            } else {
                const errorKey = result.error === 'usernameExists'
                    ? 'register.errors.usernameExists'
                    : result.error === 'passwordTooShort'
                        ? 'register.errors.passwordTooShort'
                        : result.error === 'networkError'
                            ? 'register.errors.networkError'
                            : 'register.errors.registrationFailed';
                setErrors({ general: t(errorKey) });
            }
        } catch {
            setErrors({ general: t('register.errors.registrationFailed') });
        } finally {
            setIsRegistering(false);
        }
    }

    /**
     * Вычисляет силу пароля (0–4).
     */
    function getPasswordStrength(): number {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    }

    const strengthColors = ['bg-destructive', 'bg-destructive', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500'];

    return (
        <AuthLayout>
            <div className="w-full">
                {!isSuccess ? (
                    <div className="animate-fade-in flex flex-col w-full">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight leading-tight">
                            {t('register.title')}
                        </h1>
                        <p className="text-muted-foreground text-base mb-8 leading-relaxed">
                            {t('register.step1.subtitle')}
                        </p>

                        {errors.general && (
                            <div className="w-full mb-6 px-4 py-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-fade-in" role="alert">
                                <span className="text-lg shrink-0">⚠️</span>
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="flex flex-col gap-8 w-full" noValidate>
                            {/* Username */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="reg-username">{t('register.step2.username')}</Label>
                                <Input
                                    id="reg-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => { setUsername(e.target.value); if (errors.username) setErrors((p) => ({ ...p, username: undefined })); }}
                                    placeholder={t('register.step2.usernamePlaceholder')}
                                    autoFocus
                                    hasError={!!errors.username}
                                />
                                {errors.username && <p className="text-xs text-destructive font-medium">{errors.username}</p>}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="reg-email">{t('register.step2.email')}</Label>
                                <Input
                                    id="reg-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: undefined })); }}
                                    placeholder={t('register.step2.emailPlaceholder')}
                                    autoComplete="email"
                                    hasError={!!errors.email}
                                />
                                {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
                            </div>

                            {/* Password */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="reg-password">{t('register.step2.password')}</Label>
                                <div className="relative">
                                    <Input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: undefined })); }}
                                        placeholder={t('register.step2.passwordPlaceholder')}
                                        autoComplete="new-password"
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
                                {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}

                                {/* Password strength bar */}
                                {password.length > 0 && (
                                    <div className="flex gap-1.5 h-1.5 px-0.5 mt-2">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`flex-1 rounded-full transition-all duration-300 ${getPasswordStrength() >= level ? strengthColors[level] : 'bg-muted'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="flex flex-col gap-3">
                                <Label htmlFor="reg-confirm-password">{t('register.step2.confirmPassword')}</Label>
                                <Input
                                    id="reg-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined })); }}
                                    placeholder={t('register.step2.confirmPasswordPlaceholder')}
                                    autoComplete="new-password"
                                    hasError={!!errors.confirmPassword}
                                />
                                {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword}</p>}
                            </div>

                            <Button
                                type="submit"
                                variant="cyan"
                                size="xl"
                                disabled={isRegistering}
                                className="w-full mt-2"
                            >
                                {isRegistering ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" />{t('register.step2.submitting')}</>
                                ) : (
                                    <><UserPlus className="w-4 h-4" />{t('register.step2.submit')}</>
                                )}
                            </Button>
                        </form>

                        <p className="mt-6 text-sm text-muted-foreground">
                            {t('register.haveAccount')}{' '}
                            <Link to="/login" className="text-[#19cbfe] hover:text-[#17a8d4] font-semibold transition-colors">
                                {t('register.login')}
                            </Link>
                        </p>
                    </div>
                ) : (
                    /* ── Success ── */
                    <div className="text-left animate-fade-in py-8 flex flex-col">
                        <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8 shadow-sm border border-emerald-100">
                            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
                            {t('register.success.title')}
                        </h1>
                        <p className="text-muted-foreground text-base mb-10 leading-relaxed">
                            {t('register.success.message')}
                        </p>
                        <Button variant="cyan" size="lg" asChild>
                            <Link to="/login">{t('register.success.goToLogin')}</Link>
                        </Button>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
