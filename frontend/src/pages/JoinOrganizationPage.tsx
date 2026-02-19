/**
 * Join Organization page.
 * Post-login flow: Enter organization code → lookup company → confirm → update profile.
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowRight, Search, LogOut } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { lookupCompanyByOrgCode, updateUserProfile } from '../lib/api';
import type { CompanyLookupResult } from '../lib/api';

interface JoinOrgErrors {
    orgCode?: string;
    general?: string;
}



export function JoinOrganizationPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // State
    const [orgCode, setOrgCode] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [lookupResult, setLookupResult] = useState<CompanyLookupResult | null>(null);
    const [errors, setErrors] = useState<JoinOrgErrors>({});

    /**
     * Validates org code format.
     */
    function validateOrgCode(codeToValidate: string = orgCode.trim()): boolean {
        const newErrors: JoinOrgErrors = {};

        if (!codeToValidate) {
            newErrors.orgCode = t('register.errors.orgCodeRequired'); // Reuse translations
        } else if (!/^[a-zA-Z0-9-]+$/.test(codeToValidate)) {
            newErrors.orgCode = t('register.errors.orgCodeInvalid');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Looks up the company by org code.
     */
    async function handleLookup(e: FormEvent<HTMLFormElement>): Promise<void> {
        e.preventDefault();
        const orgCodeToLookup = orgCode.trimEnd();

        if (!validateOrgCode(orgCodeToLookup)) return;

        setIsLookingUp(true);
        setLookupResult(null);

        try {
            const result = await lookupCompanyByOrgCode(orgCodeToLookup.toUpperCase());
            setLookupResult(result);

            if (!result.found) {
                setErrors({ orgCode: t('register.errors.orgNotFound') });
            }
        } catch {
            setErrors({ orgCode: t('register.errors.orgNotFound') });
        } finally {
            setIsLookingUp(false);
        }
    }

    /**
     * Joins the organization (updates user profile).
     */
    async function handleJoin(): Promise<void> {
        if (!lookupResult?.found || !lookupResult.company) return;

        setIsJoining(true);
        const username = localStorage.getItem('gravisales_username'); // Need to ensure we save this on login!

        if (!username) {
            // Fallback if username missing, redirect to login
            navigate('/login');
            return;
        }

        try {
            const result = await updateUserProfile(username, [
                { attribute: 'orgCode', value: lookupResult.company.orgCode }
            ]);

            if (result.success) {
                navigate('/');
            } else {
                setErrors({ general: t('register.errors.joinFailed') || 'Failed to join organization' });
            }
        } catch {
            setErrors({ general: t('register.errors.joinFailed') || 'Failed to join organization' });
        } finally {
            setIsJoining(false);
        }
    }

    return (
        <AuthLayout>
            <div className="w-full animate-fade-in flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight text-left leading-tight">
                        {t('joinOrg.title') || 'Join Organization'}
                    </h1>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            navigate('/login');
                        }}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title={t('auth.logout') || 'Logout'}
                    >
                        <LogOut className="w-6 h-6" />
                    </button>
                </div>

                <p className="text-gray-500 text-lg md:text-xl mb-12 text-left max-w-md leading-loose">
                    {t('joinOrg.subtitle') || 'Please enter your organization code to continue.'}
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

                {/* Lookup Form */}
                <form onSubmit={handleLookup} className="space-y-12 w-full" noValidate>
                    <div className="w-full">
                        <label
                            htmlFor="org-code"
                            className="block text-lg font-semibold text-gray-800 mb-6"
                        >
                            {t('register.step1.orgCode')}
                        </label>
                        <div className="relative">
                            <input
                                id="org-code"
                                type="text"
                                value={orgCode}
                                onChange={(e) => {
                                    setOrgCode(e.target.value.toUpperCase());
                                    setLookupResult(null);
                                    if (errors.orgCode) setErrors({});
                                }}
                                placeholder={t('register.step1.orgCodePlaceholder')}
                                autoFocus
                                className={`w-full px-6 py-6 rounded-2xl border-2 text-xl uppercase
                       font-mono tracking-widest text-left
                       transition-all duration-200
                       bg-gray-50 hover:bg-white
                       placeholder:text-gray-300
                       placeholder:normal-case placeholder:font-sans placeholder:tracking-normal
                       placeholder:text-lg
                       focus:outline-none focus:ring-4 focus:ring-cyan-100
                       focus:border-[#19cbfe] focus:bg-white
                       ${errors.orgCode ? 'border-red-400 bg-red-50 ring-2 ring-red-100' : 'border-gray-200'}`}
                            />
                        </div>
                        {errors.orgCode && (
                            <p className="mt-3 text-base text-red-600 font-medium text-left leading-relaxed">{errors.orgCode}</p>
                        )}
                    </div>

                    {/* Lookup Result Card */}
                    {lookupResult?.found && lookupResult.company && (
                        <div className="p-8 rounded-2xl bg-emerald-50 border-2 border-emerald-100
                        animate-fade-in text-left shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-base font-medium text-emerald-700 mb-1 leading-relaxed">
                                        {t('register.step1.orgFound')}
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-900 mb-6 leading-relaxed">
                                        {lookupResult.company.name}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={handleJoin}
                                        disabled={isJoining}
                                        className="w-full flex items-center justify-center gap-3
                           h-16 px-8 rounded-2xl text-lg font-bold
                           bg-emerald-600 text-white
                           hover:bg-emerald-700
                           transition-all duration-200 cursor-pointer
                           shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300
                           active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isJoining ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                {t('joinOrg.joining') || 'Joining...'}
                                            </>
                                        ) : (
                                            <>
                                                {t('joinOrg.confirm') || 'Join Organization'}
                                                <ArrowRight className="w-6 h-6" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lookup Button */}
                    {!lookupResult?.found && (
                        <button
                            type="submit"
                            disabled={isLookingUp}
                            className="w-full flex items-center justify-center gap-3
                     h-16 px-8 rounded-2xl text-lg font-bold
                     bg-[#19cbfe] text-white
                     hover:bg-[#17a8d4]
                     disabled:opacity-60 disabled:cursor-not-allowed
                     transition-all duration-200 cursor-pointer
                     shadow-lg shadow-cyan-200 hover:shadow-xl hover:shadow-cyan-300
                     active:scale-[0.98] mt-10!"
                        >
                            {isLookingUp ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    {t('register.step1.lookingUp')}
                                </>
                            ) : (
                                <>
                                    <Search className="w-6 h-6" />
                                    {t('register.step1.lookup')}
                                </>
                            )}
                        </button>
                    )}
                </form>
            </div>
        </AuthLayout>
    );
}
