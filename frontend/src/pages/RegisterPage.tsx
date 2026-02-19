/**
 * Registration page with 2-step flow:
 * Step 1: Enter organization code → lookup company → confirm
 * Step 2: Fill user details → register via GraviBase API
 *
 * @example
 * // Route: /register
 * <RegisterPage />
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
    Building2, UserPlus, Loader2, CheckCircle2,
    ArrowRight, ArrowLeft, Eye, EyeOff, Search
} from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { lookupCompanyByOrgCode, register } from '../lib/api';
import type { CompanyLookupResult } from '../lib/api';

/** Step 1 errors */
interface Step1Errors {
    orgCode?: string;
}

/** Step 2 errors */
interface Step2Errors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
}

/** Confirmed organization info */
interface ConfirmedOrg {
    id: string;
    name: string;
    orgCode: string;
}

export function RegisterPage(): ReactElement {
    const { t } = useTranslation();

    // Step management
    const [step, setStep] = useState<1 | 2 | 'success'>(1);

    // Step 1 state
    const [orgCode, setOrgCode] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [lookupResult, setLookupResult] = useState<CompanyLookupResult | null>(null);
    const [confirmedOrg, setConfirmedOrg] = useState<ConfirmedOrg | null>(null);
    const [step1Errors, setStep1Errors] = useState<Step1Errors>({});

    // Step 2 state
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [step2Errors, setStep2Errors] = useState<Step2Errors>({});

    // ──────────────────────────────────────────────
    // Step 1: Organization Lookup
    // ──────────────────────────────────────────────

    /**
     * Validates org code format.
     * @returns true if valid
     */
    function validateOrgCode(): boolean {
        const newErrors: Step1Errors = {};

        if (!orgCode.trim()) {
            newErrors.orgCode = t('register.errors.orgCodeRequired');
        } else if (!/^[a-zA-Z0-9-]+$/.test(orgCode.trim())) {
            newErrors.orgCode = t('register.errors.orgCodeInvalid');
        }

        setStep1Errors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Looks up the company by org code.
     */
    async function handleLookup(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!validateOrgCode()) return;

        setIsLookingUp(true);
        setLookupResult(null);

        try {
            const result = await lookupCompanyByOrgCode(orgCode.trim().toUpperCase());
            setLookupResult(result);

            if (!result.found) {
                setStep1Errors({ orgCode: t('register.errors.orgNotFound') });
            }
        } catch {
            setStep1Errors({ orgCode: t('register.errors.orgNotFound') });
        } finally {
            setIsLookingUp(false);
        }
    }

    /**
     * Confirms the organization and moves to step 2.
     */
    function handleConfirmOrg(): void {
        if (lookupResult?.found && lookupResult.company) {
            setConfirmedOrg(lookupResult.company);
            setStep(2);
        }
    }

    // ──────────────────────────────────────────────
    // Step 2: Registration Form
    // ──────────────────────────────────────────────

    /**
     * Validates registration form fields.
     * @returns true if all fields are valid
     */
    function validateStep2(): boolean {
        const newErrors: Step2Errors = {};

        // Username validation
        if (!username.trim()) {
            newErrors.username = t('register.errors.usernameRequired');
        } else if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(username.trim())) {
            newErrors.username = t('register.errors.usernameInvalid');
        } else if (username.trim().length < 3) {
            newErrors.username = t('register.errors.usernameTooShort');
        }

        // Email validation
        if (!email.trim()) {
            newErrors.email = t('register.errors.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = t('register.errors.emailInvalid');
        }

        // Password validation
        if (!password) {
            newErrors.password = t('register.errors.passwordRequired');
        } else if (password.length < 8) {
            newErrors.password = t('register.errors.passwordTooShort');
        }

        // Confirm password
        if (!confirmPassword) {
            newErrors.confirmPassword = t('register.errors.confirmPasswordRequired');
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = t('register.errors.passwordsMismatch');
        }

        setStep2Errors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Handles the registration form submission.
     * Calls GraviBase registration API with profile attributes.
     */
    async function handleRegister(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        if (!validateStep2() || !confirmedOrg) return;

        setIsRegistering(true);
        setStep2Errors({});

        try {
            const result = await register(
                username.trim(),
                email.trim(),
                password,
                confirmedOrg.orgCode
            );

            if (result.success && result.token) {
                // Store token
                localStorage.setItem('gravisales_token', result.token.access_token);
                if (result.token.refresh_token) {
                    localStorage.setItem('gravisales_refresh_token', result.token.refresh_token);
                }
                setStep('success');
            } else {
                // Map error codes to i18n keys
                const errorKey = result.error === 'usernameExists'
                    ? 'register.errors.usernameExists'
                    : result.error === 'passwordTooShort'
                        ? 'register.errors.passwordTooShort'
                        : result.error === 'networkError'
                            ? 'register.errors.networkError'
                            : 'register.errors.registrationFailed';

                setStep2Errors({ general: t(errorKey) });
            }
        } catch {
            setStep2Errors({ general: t('register.errors.registrationFailed') });
        } finally {
            setIsRegistering(false);
        }
    }

    /**
     * Calculates password strength for the indicator.
     * @returns strength level 0-4
     */
    function getPasswordStrength(): number {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength;
    }

    // ──────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────

    return (
        <AuthLayout>
            <div>
                {/* ── Step 1: Organization Code ── */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            {t('register.title')}
                        </h1>
                        <p className="text-[var(--color-text-secondary)] mb-8">
                            {t('register.step1.subtitle')}
                        </p>

                        <form onSubmit={handleLookup} className="space-y-5" noValidate>
                            {/* Org Code Input */}
                            <div>
                                <label
                                    htmlFor="org-code"
                                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                                >
                                    {t('register.step1.orgCode')}
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2
                                  text-[var(--color-text-tertiary)]">
                                        <Building2 className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="org-code"
                                        type="text"
                                        value={orgCode}
                                        onChange={(e) => {
                                            setOrgCode(e.target.value.toUpperCase());
                                            setLookupResult(null);
                                            if (step1Errors.orgCode) setStep1Errors({});
                                        }}
                                        placeholder={t('register.step1.orgCodePlaceholder')}
                                        autoFocus
                                        className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm uppercase
                               font-mono tracking-wider
                               transition-all duration-200
                               bg-[var(--color-bg-primary)]
                               placeholder:text-[var(--color-text-tertiary)]
                               placeholder:normal-case placeholder:font-sans placeholder:tracking-normal
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                               focus:border-[var(--color-primary)]
                               ${step1Errors.orgCode
                                                ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                                : 'border-[var(--color-border)]'}`}
                                    />
                                </div>
                                {step1Errors.orgCode && (
                                    <p className="mt-1 text-xs text-[var(--color-error)]">{step1Errors.orgCode}</p>
                                )}
                                <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">
                                    {t('register.step1.orgCodeHint')}
                                </p>
                            </div>

                            {/* Lookup Result */}
                            {lookupResult?.found && lookupResult.company && (
                                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200
                                animate-fade-in">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-emerald-800">
                                                {t('register.step1.orgFound')}
                                            </p>
                                            <p className="text-lg font-bold text-emerald-900 mt-1">
                                                {lookupResult.company.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleConfirmOrg}
                                        className="w-full mt-4 flex items-center justify-center gap-2
                               px-6 py-3 rounded-xl text-sm font-semibold
                               bg-emerald-600 text-white
                               hover:bg-emerald-700
                               transition-all duration-200 cursor-pointer
                               shadow-md hover:shadow-lg active:scale-[0.98]"
                                    >
                                        {t('register.step1.confirm')}
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Lookup Button (shown when no result yet) */}
                            {!lookupResult?.found && (
                                <button
                                    type="submit"
                                    disabled={isLookingUp}
                                    className="w-full flex items-center justify-center gap-2
                             px-6 py-3 rounded-xl text-sm font-semibold
                             bg-[var(--color-primary)] text-white
                             hover:bg-[var(--color-primary-hover)]
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200 cursor-pointer
                             shadow-md hover:shadow-lg active:scale-[0.98]"
                                >
                                    {isLookingUp ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('register.step1.lookingUp')}
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-4 h-4" />
                                            {t('register.step1.lookup')}
                                        </>
                                    )}
                                </button>
                            )}
                        </form>

                        {/* Login link */}
                        <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                            {t('register.haveAccount')}{' '}
                            <Link
                                to="/login"
                                className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
                           font-semibold transition-colors"
                            >
                                {t('register.login')}
                            </Link>
                        </p>
                    </div>
                )}

                {/* ── Step 2: User Details ── */}
                {step === 2 && confirmedOrg && (
                    <div className="animate-fade-in">
                        {/* Back button + organization badge */}
                        <div className="flex items-center gap-2 mb-6">
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="p-1.5 rounded-lg text-[var(--color-text-secondary)]
                           hover:bg-[var(--color-bg-tertiary)]
                           transition-colors cursor-pointer"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg
                              bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                                <Building2 className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{confirmedOrg.name}</span>
                            </div>
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            {t('register.step2.title')}
                        </h1>
                        <p className="text-[var(--color-text-secondary)] mb-8">
                            {t('register.step2.subtitle', { orgName: confirmedOrg.name })}
                        </p>

                        {/* General Error */}
                        {step2Errors.general && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200
                              text-red-700 text-sm animate-fade-in" role="alert">
                                {step2Errors.general}
                            </div>
                        )}

                        <form onSubmit={handleRegister} className="space-y-4" noValidate>
                            {/* Username */}
                            <div>
                                <label
                                    htmlFor="reg-username"
                                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                                >
                                    {t('register.step2.username')}
                                </label>
                                <input
                                    id="reg-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                        if (step2Errors.username) setStep2Errors((prev) => ({ ...prev, username: undefined }));
                                    }}
                                    placeholder={t('register.step2.usernamePlaceholder')}
                                    autoFocus
                                    className={`w-full px-4 py-3 rounded-xl border text-sm
                             transition-all duration-200
                             bg-[var(--color-bg-primary)]
                             placeholder:text-[var(--color-text-tertiary)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                             focus:border-[var(--color-primary)]
                             ${step2Errors.username
                                            ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                            : 'border-[var(--color-border)]'}`}
                                />
                                {step2Errors.username && (
                                    <p className="mt-1 text-xs text-[var(--color-error)]">{step2Errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="reg-email"
                                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                                >
                                    {t('register.step2.email')}
                                </label>
                                <input
                                    id="reg-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (step2Errors.email) setStep2Errors((prev) => ({ ...prev, email: undefined }));
                                    }}
                                    placeholder={t('register.step2.emailPlaceholder')}
                                    autoComplete="email"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm
                             transition-all duration-200
                             bg-[var(--color-bg-primary)]
                             placeholder:text-[var(--color-text-tertiary)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                             focus:border-[var(--color-primary)]
                             ${step2Errors.email
                                            ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                            : 'border-[var(--color-border)]'}`}
                                />
                                {step2Errors.email && (
                                    <p className="mt-1 text-xs text-[var(--color-error)]">{step2Errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label
                                    htmlFor="reg-password"
                                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                                >
                                    {t('register.step2.password')}
                                </label>
                                <div className="relative">
                                    <input
                                        id="reg-password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (step2Errors.password) setStep2Errors((prev) => ({ ...prev, password: undefined }));
                                        }}
                                        placeholder={t('register.step2.passwordPlaceholder')}
                                        autoComplete="new-password"
                                        className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm
                               transition-all duration-200
                               bg-[var(--color-bg-primary)]
                               placeholder:text-[var(--color-text-tertiary)]
                               focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                               focus:border-[var(--color-primary)]
                               ${step2Errors.password
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
                                {step2Errors.password && (
                                    <p className="mt-1 text-xs text-[var(--color-error)]">{step2Errors.password}</p>
                                )}

                                {/* Password Strength Indicator */}
                                {password.length > 0 && (
                                    <div className="mt-2 flex gap-1">
                                        {[1, 2, 3, 4].map((level) => (
                                            <div
                                                key={level}
                                                className={`h-1.5 flex-1 rounded-full transition-all duration-300
                                   ${getPasswordStrength() >= level
                                                        ? level <= 1 ? 'bg-red-400'
                                                            : level <= 2 ? 'bg-orange-400'
                                                                : level <= 3 ? 'bg-yellow-400'
                                                                    : 'bg-emerald-500'
                                                        : 'bg-[var(--color-bg-tertiary)]'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="reg-confirm-password"
                                    className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
                                >
                                    {t('register.step2.confirmPassword')}
                                </label>
                                <input
                                    id="reg-confirm-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => {
                                        setConfirmPassword(e.target.value);
                                        if (step2Errors.confirmPassword)
                                            setStep2Errors((prev) => ({ ...prev, confirmPassword: undefined }));
                                    }}
                                    placeholder={t('register.step2.confirmPasswordPlaceholder')}
                                    autoComplete="new-password"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm
                             transition-all duration-200
                             bg-[var(--color-bg-primary)]
                             placeholder:text-[var(--color-text-tertiary)]
                             focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30
                             focus:border-[var(--color-primary)]
                             ${step2Errors.confirmPassword
                                            ? 'border-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
                                            : 'border-[var(--color-border)]'}`}
                                />
                                {step2Errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-[var(--color-error)]">{step2Errors.confirmPassword}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isRegistering}
                                className="w-full flex items-center justify-center gap-2
                           px-6 py-3 rounded-xl text-sm font-semibold
                           bg-[var(--color-primary)] text-white
                           hover:bg-[var(--color-primary-hover)]
                           disabled:opacity-60 disabled:cursor-not-allowed
                           transition-all duration-200 cursor-pointer
                           shadow-md hover:shadow-lg active:scale-[0.98]
                           mt-6!"
                            >
                                {isRegistering ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('register.step2.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        {t('register.step2.submit')}
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Login link */}
                        <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
                            {t('register.haveAccount')}{' '}
                            <Link
                                to="/login"
                                className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]
                           font-semibold transition-colors"
                            >
                                {t('register.login')}
                            </Link>
                        </p>
                    </div>
                )}

                {/* ── Success State ── */}
                {step === 'success' && (
                    <div className="text-center animate-fade-in py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center
                            mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3">
                            {t('register.success.title')}
                        </h1>
                        <p className="text-[var(--color-text-secondary)] mb-8">
                            {t('register.success.message')}
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-2
                         px-6 py-3 rounded-xl text-sm font-semibold
                         bg-[var(--color-primary)] text-white
                         hover:bg-[var(--color-primary-hover)]
                         transition-all duration-200
                         shadow-md hover:shadow-lg"
                        >
                            {t('register.success.goToLogin')}
                        </Link>
                    </div>
                )}
            </div>
        </AuthLayout>
    );
}
