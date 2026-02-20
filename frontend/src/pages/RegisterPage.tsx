/**
 * Registration page.
 * Simple 1-step flow: Enter user details -> Register.
 * Organization code is handled post-login if needed.
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { register, assignRole } from '../lib/api';

/** Registration form errors */
interface RegisterErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

export function RegisterPage(): ReactElement {
    const { t } = useTranslation();

    // State
    const [isSuccess, setIsSuccess] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [errors, setErrors] = useState<RegisterErrors>({});

    /**
     * Validates registration form fields.
     */
    function validate(): boolean {
        const newErrors: RegisterErrors = {};

        if (!username.trim()) {
            newErrors.username = t('register.errors.usernameRequired');
        } else if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(username.trim())) {
            newErrors.username = t('register.errors.usernameInvalid');
        } else if (username.trim().length < 3) {
            newErrors.username = t('register.errors.usernameTooShort');
        }

        if (!email.trim()) {
            newErrors.email = t('register.errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = t('register.errors.emailInvalid');
        }

        if (!password) {
            newErrors.password = t('register.errors.passwordRequired');
        } else if (password.length < 8) {
            newErrors.password = t('register.errors.passwordTooShort');
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('register.errors.passwordsMismatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Handles the registration form submission.
     */
    async function handleRegister(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!validate()) return;

        setIsRegistering(true);
        setErrors({});

        try {
            const result = await register(
                username.trim(),
                email.trim(),
                password
            );

            if (result.success && result.token) {
                // We don't auto-login here usually in strict security, but for UX we often do.
                // However, the requested flow implies we might want to redirect to login or auto-login.
                // Based on previous code, we saved tokens.
                localStorage.setItem('gravisales_token', result.token.access_token);
                if (result.token.refresh_token) {
                    localStorage.setItem('gravisales_refresh_token', result.token.refresh_token);
                }

                // Assign default "Viewer" role
                if (result.username) {
                    await assignRole(result.username, 'Viewer');
                }

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
     * Calculates password strength for the indicator.
     */
    function getPasswordStrength(): number {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    }

    /** Shared input class builder */
    function inputClasses(hasError: boolean): string {
        return `w-full px-5 py-6 rounded-2xl border-2 text-base
           transition-all duration-200
           bg-gray-50 hover:bg-white
           placeholder:text-gray-400
           focus:outline-none focus:ring-4 focus:ring-cyan-100
           focus:border-[#19cbfe] focus:bg-white
           ${hasError ? 'border-red-400 bg-red-50 ring-2 ring-red-100' : 'border-gray-200'}`;
    }

    return (
        <AuthLayout>
            <div className="w-full">
                {!isSuccess ? (
                    <div className="animate-fade-in flex flex-col w-full">
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-8 tracking-tight text-left leading-tight">
                            {t('register.title')}
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl mb-12 text-left max-w-md leading-loose">
                            {t('register.step1.subtitle')}
                        </p>

                        {/* General Error */}
                        {errors.general && (
                            <div className="w-full mb-8 p-6 rounded-2xl bg-red-50 border border-red-200
                               text-red-700 text-base animate-fade-in flex items-center gap-4 leading-relaxed"
                                role="alert">
                                <span className="text-2xl">⚠️</span>
                                {errors.general}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-8 w-full" noValidate>
                            {/* Username */}
                            <div>
                                <label htmlFor="reg-username"
                                    className="block text-base font-semibold text-gray-800 mb-4">
                                    {t('register.step2.username')}
                                </label>
                                <input
                                    id="reg-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
                                    }}
                                    placeholder={t('register.step2.usernamePlaceholder')}
                                    autoFocus
                                    className={inputClasses(!!errors.username)}
                                />
                                {errors.username && (
                                    <p className="mt-2 text-sm text-red-600 font-medium leading-relaxed">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label htmlFor="reg-email"
                                    className="block text-base font-semibold text-gray-800 mb-4">
                                    {t('register.step2.email')}
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    placeholder={t('register.step2.emailPlaceholder')}
                                    autoComplete="email"
                                    className={inputClasses(!!errors.email)}
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 font-medium leading-relaxed">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="reg-password"
                                    className="block text-base font-semibold text-gray-800 mb-4">
                                    {t('register.step2.password')}
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                                        }}
                                        placeholder={t('register.step2.passwordPlaceholder')}
                                        autoComplete="new-password"
                                        className={`${inputClasses(!!errors.password)} pr-14`}
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

                                {/* Password Strength Indicator */}
                                <div className="mt-4 flex gap-2 h-2 px-1">
                                    {[1, 2, 3, 4].map((level) => (
                                        <div
                                            key={level}
                                            className={`flex-1 rounded-full transition-all duration-300
                                 ${getPasswordStrength() >= level
                                                    ? level <= 1 ? 'bg-red-400'
                                                        : level <= 2 ? 'bg-orange-400'
                                                            : level <= 3 ? 'bg-yellow-400'
                                                                : 'bg-emerald-500'
                                                    : 'bg-gray-100'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="reg-confirm-password"
                                    className="block text-base font-semibold text-gray-800 mb-4">
                                    {t('register.step2.confirmPassword')}
                                </label>
                                <input
                                    id="reg-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (errors.confirmPassword)
                                            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                                    }}
                                    placeholder={t('register.step2.confirmPasswordPlaceholder')}
                                    autoComplete="new-password"
                                    className={inputClasses(!!errors.confirmPassword)}
                                />
                                {errors.confirmPassword && (
                                    <p className="mt-2 text-sm text-red-600 font-medium leading-relaxed">{errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isRegistering}
                                className="w-full flex items-center justify-center gap-3
                           h-16 px-8 rounded-2xl text-lg font-bold
                           bg-[#19cbfe] text-white
                           hover:bg-[#17a8d4]
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 cursor-pointer
                           shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300
                           active:scale-[0.98] mt-10!"
                            >
                                {isRegistering ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        {t('register.step2.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-5 h-5" />
                                        {t('register.step2.submit')}
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="mt-12 text-left text-base text-gray-500 leading-relaxed">
                            {t('register.haveAccount')}{' '}
                            <Link to="/login" className="text-[#19cbfe] hover:text-[#17a8d4] font-bold transition-colors">
                                {t('register.login')}
                            </Link>
                        </p>
                    </div>
                ) : (
                    /* ── Success State ── */
                    <div className="text-left animate-fade-in py-12 flex flex-col">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center
                            mb-8 shadow-sm">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
                            {t('register.success.title')}
                        </h1>
                        <p className="text-gray-500 text-lg md:text-xl mb-12 max-w-md leading-loose">
                            {t('register.success.message')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-3
                         h-16 px-10 rounded-2xl text-lg font-bold
                         bg-[#19cbfe] text-white
                         hover:bg-[#17a8d4]
                         transition-all duration-200
                         shadow-lg shadow-cyan-200 hover:shadow-xl w-full sm:w-auto"
                        >
                            {t('register.success.goToLogin')}
                        </Link>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
