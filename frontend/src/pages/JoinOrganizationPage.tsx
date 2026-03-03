/**
 * JoinOrganizationPage — страница ввода кода организации.
 * Пост-логин флоу: ввод кода → поиск компании → подтверждение.
 */
import { useState, type ReactElement } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowRight, Search, LogOut } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { lookupCompanyByOrgCode, updateAppUserOrg } from '../lib/api';
import type { CompanyLookupResult } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

interface JoinOrgErrors {
    orgCode?: string;
    general?: string;
}

export function JoinOrganizationPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [orgCode, setOrgCode] = useState('');
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [lookupResult, setLookupResult] = useState<CompanyLookupResult | null>(null);
    const [errors, setErrors] = useState<JoinOrgErrors>({});

    /**
     * Валидирует формат кода организации.
     */
    function validateOrgCode(codeToValidate: string = orgCode.trim()): boolean {
        const newErrors: JoinOrgErrors = {};
        if (!codeToValidate) newErrors.orgCode = t('register.errors.orgCodeRequired');
        else if (!/^[a-zA-Z0-9-]+$/.test(codeToValidate)) newErrors.orgCode = t('register.errors.orgCodeInvalid');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /**
     * Поиск компании по коду организации.
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
            if (!result.found) setErrors({ orgCode: t('register.errors.orgNotFound') });
        } catch {
            setErrors({ orgCode: t('register.errors.orgNotFound') });
        } finally {
            setIsLookingUp(false);
        }
    }

    /**
     * Присоединение к организации (обновление профиля пользователя).
     */
    async function handleJoin(): Promise<void> {
        if (!lookupResult?.found || !lookupResult.company) return;

        setIsJoining(true);
        const username = sessionStorage.getItem('gravisales_current_user');

        if (!username) {
            setErrors({ general: t('login.errors.sessionExpired') || 'Session expired. Please login again.' });
            return;
        }

        try {
            const appUserResult = await updateAppUserOrg(username, lookupResult.company.orgCode);
            if (appUserResult.success) {
                navigate('/');
            } else {
                setErrors({ general: t('register.errors.joinFailed') || 'Failed to update app user record' });
            }
        } catch (err) {
            console.error('Join error:', err);
            setErrors({ general: t('register.errors.joinFailed') || 'Failed to join organization' });
        } finally {
            setIsJoining(false);
        }
    }

    return (
        <AuthLayout>
            <div className="w-full animate-fade-in flex flex-col">
                <div className="flex justify-between items-start mb-3">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                        {t('joinOrg.title') || 'Join Organization'}
                    </h1>
                    <button
                        onClick={() => { localStorage.clear(); navigate('/login'); }}
                        className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors mt-1 shrink-0"
                        title={t('auth.logout') || 'Logout'}
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-muted-foreground text-base mb-8 leading-relaxed">
                    {t('joinOrg.subtitle') || 'Please enter your organization code to continue.'}
                </p>

                {/* General Error */}
                {errors.general && (
                    <div className="w-full mb-6 px-4 py-4 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-sm flex items-center gap-3 animate-fade-in" role="alert">
                        <span className="text-lg shrink-0">⚠️</span>
                        {errors.general}
                    </div>
                )}

                <form onSubmit={handleLookup} className="space-y-6 w-full" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="org-code" className="text-base">
                            {t('register.step1.orgCode')}
                        </Label>
                        <Input
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
                            hasError={!!errors.orgCode}
                            className="uppercase font-mono tracking-widest text-lg"
                        />
                        {errors.orgCode && (
                            <p className="text-xs text-destructive font-medium">{errors.orgCode}</p>
                        )}
                    </div>

                    {/* Lookup Result */}
                    {lookupResult?.found && lookupResult.company && (
                        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-100 animate-fade-in">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-emerald-700 mb-1">
                                        {t('register.step1.orgFound')}
                                    </p>
                                    <p className="text-xl font-bold text-emerald-900 mb-5">
                                        {lookupResult.company.name}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="emerald"
                                        size="lg"
                                        onClick={handleJoin}
                                        disabled={isJoining}
                                        className="w-full"
                                    >
                                        {isJoining ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" />{t('joinOrg.joining') || 'Joining...'}</>
                                        ) : (
                                            <>{t('joinOrg.confirm') || 'Join Organization'}<ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lookup button */}
                    {!lookupResult?.found && (
                        <Button
                            type="submit"
                            variant="cyan"
                            size="xl"
                            disabled={isLookingUp}
                            className="w-full"
                        >
                            {isLookingUp ? (
                                <><Loader2 className="w-4 h-4 animate-spin" />{t('register.step1.lookingUp')}</>
                            ) : (
                                <><Search className="w-4 h-4" />{t('register.step1.lookup')}</>
                            )}
                        </Button>
                    )}
                </form>
            </div>
        </AuthLayout>
    );
}
