/**
 * OnboardingPage — 4-шаговый визард первоначальной настройки компании.
 * Показывается новому CompanyAdmin после первого входа.
 *
 * Шаги:
 * 1. Выбор языка интерфейса
 * 2. Настройка компании (название, валюта, часовой пояс)
 * 3. Создание первой воронки с дефолтными этапами
 * 4. Приглашение коллег
 *
 * @example
 * <Route path="/onboarding" element={<OnboardingPage />} />
 */
import { useState, useEffect, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Globe, Building2, Filter, Users,
    ChevronRight, ChevronLeft, Check,
    Sparkles, Plus, X, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getAppUser, updateOnboardingStatus } from '../lib/api';
import { funnelsApi, companyApi } from '../api/settings';
import apiClient from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InviteEntry {
    email: string;
    role: 'manager' | 'viewer';
}

// ─── Step 1: Language ─────────────────────────────────────────────────────────

interface Step1Props {
    onNext: () => void;
}

/**
 * Шаг 1: Выбор языка интерфейса.
 */
function Step1Language({ onNext }: Step1Props): ReactElement {
    const { t, i18n } = useTranslation();
    const [selected, setSelected] = useState(i18n.language.split('-')[0] || 'ru');

    const languages = [
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'en', label: 'English', flag: '🇬🇧' },
        { code: 'kk', label: 'Қазақша', flag: '🇰🇿' },
        { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    ];

    function handleSelect(code: string) {
        setSelected(code);
        void i18n.changeLanguage(code);
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('onboarding.steps.language.title')}</h2>
                <p className="text-muted-foreground mt-2">{t('onboarding.steps.language.subtitle')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {languages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => handleSelect(lang.code)}
                        className={cn(
                            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                            selected === lang.code
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                        )}
                    >
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                            <p className="font-semibold text-sm">{lang.label}</p>
                            <p className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</p>
                        </div>
                        {selected === lang.code && (
                            <Check className="w-4 h-4 ml-auto shrink-0" />
                        )}
                    </button>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                {t('onboarding.steps.language.hint')}
            </p>

            <button
                onClick={onNext}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
                {t('onboarding.next')}
                <ChevronRight className="w-4 h-4" />
            </button>
        </div>
    );
}

// ─── Step 2: Company ──────────────────────────────────────────────────────────

interface Step2Props {
    onNext: () => void;
    onBack: () => void;
}

/**
 * Шаг 2: Настройка профиля компании.
 */
function Step2Company({ onNext, onBack }: Step2Props): ReactElement {
    const { t, i18n } = useTranslation();
    const [name, setName] = useState('');
    const [currency, setCurrency] = useState('RUB');
    const [timezone, setTimezone] = useState('Europe/Moscow');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timezones = [
        { value: 'Europe/Moscow', label: 'Москва (UTC+3)' },
        { value: 'Europe/Kaliningrad', label: 'Калининград (UTC+2)' },
        { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (UTC+5)' },
        { value: 'Asia/Novosibirsk', label: 'Новосибирск (UTC+7)' },
        { value: 'Asia/Vladivostok', label: 'Владивосток (UTC+10)' },
        { value: 'Asia/Almaty', label: 'Алматы (UTC+6)' },
        { value: 'Asia/Tashkent', label: 'Ташкент (UTC+5)' },
        { value: 'UTC', label: 'UTC' },
        { value: 'Europe/London', label: 'Лондон (UTC+0)' },
    ];

    const currencies = [
        { value: 'RUB', label: '₽ Рубль (RUB)' },
        { value: 'USD', label: '$ Доллар (USD)' },
        { value: 'EUR', label: '€ Евро (EUR)' },
        { value: 'KZT', label: '₸ Тенге (KZT)' },
        { value: 'UZS', label: "So'm Сум (UZS)" },
    ];

    useEffect(() => {
        async function load() {
            try {
                const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
                if (username) {
                    const appUserResult = await getAppUser(username);
                    if (appUserResult.success && appUserResult.user?.orgCode) {
                        const company = await companyApi.getByOrgCode(appUserResult.user.orgCode);
                        if (company) {
                            if (company.name) setName(company.name);
                            if (company.currency) setCurrency(company.currency);
                            if (company.timezone) setTimezone(company.timezone);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load company details for onboarding:', err);
            }
        }
        void load();
    }, []);

    /**
     * Сохранить данные компании через API и перейти к следующему шагу.
     */
    async function handleNext(): Promise<void> {
        if (!name.trim()) {
            setError(t('onboarding.steps.company.errors.nameRequired'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
            if (username) {
                const appUserResult = await getAppUser(username);
                if (appUserResult.success && appUserResult.user?.orgCode) {
                    const company = await companyApi.getByOrgCode(appUserResult.user.orgCode);
                    if (company) {
                        await companyApi.update(company.id, {
                            name: name.trim(),
                            currency,
                            timezone,
                            defaultLanguage: i18n.language.split('-')[0]
                        });
                    }
                }
            }
            onNext();
        } catch (err) {
            console.error('Failed to update company:', err);
            // Non-blocking: just go next even if update failed
            onNext();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-blue-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('onboarding.steps.company.title')}</h2>
                <p className="text-muted-foreground mt-2">{t('onboarding.steps.company.subtitle')}</p>
            </div>

            <div className="space-y-4">
                {/* Company Name */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('onboarding.steps.company.name')} <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="onboarding-company-name"
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={t('onboarding.steps.company.namePlaceholder')}
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    {error && <p className="text-xs text-destructive mt-1">{error}</p>}
                </div>

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('onboarding.steps.company.currency')}
                    </label>
                    <select
                        id="onboarding-currency"
                        value={currency}
                        onChange={e => setCurrency(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                        {currencies.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>

                {/* Timezone */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('onboarding.steps.company.timezone')}
                    </label>
                    <select
                        id="onboarding-timezone"
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                    >
                        {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {t('onboarding.back')}
                </button>
                <button
                    onClick={() => void handleNext()}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t('onboarding.next')}
                    {!saving && <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Funnel ───────────────────────────────────────────────────────────

interface Step3Props {
    onNext: () => void;
    onBack: () => void;
}

/**
 * Шаг 3: Создание первой воронки с дефолтными этапами.
 */
function Step3Funnel({ onNext, onBack }: Step3Props): ReactElement {
    const { t } = useTranslation();
    const [funnelName, setFunnelName] = useState('');
    const [creating, setCreating] = useState(false);

    /** Дефолтные этапы воронки по ТЗ */
    const DEFAULT_STAGES = [
        { name: 'Новый', statusType: 'open' as const, orderIdx: 1 },
        { name: 'Квалификация', statusType: 'open' as const, orderIdx: 2 },
        { name: 'КП отправлено', statusType: 'open' as const, orderIdx: 3 },
        { name: 'Переговоры', statusType: 'open' as const, orderIdx: 4 },
        { name: 'Выигран', statusType: 'won' as const, orderIdx: 5 },
        { name: 'Проигран', statusType: 'lost' as const, orderIdx: 6 },
    ];

    /**
     * Создать воронку с дефолтными этапами, затем перейти к шагу 4.
     */
    async function handleCreate(): Promise<void> {
        const name = funnelName.trim() || t('onboarding.steps.funnel.defaultName');
        setCreating(true);
        try {
            const funnel = await funnelsApi.createFunnel(name);
            await Promise.all(
                DEFAULT_STAGES.map(stage =>
                    funnelsApi.createStage({ ...stage, funnelId: funnel.id })
                )
            );
        } catch (err) {
            console.error('Failed to create funnel:', err);
        } finally {
            setCreating(false);
            onNext();
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-8 h-8 text-violet-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('onboarding.steps.funnel.title')}</h2>
                <p className="text-muted-foreground mt-2">{t('onboarding.steps.funnel.subtitle')}</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('onboarding.steps.funnel.nameLabel')}
                    </label>
                    <input
                        id="onboarding-funnel-name"
                        type="text"
                        value={funnelName}
                        onChange={e => setFunnelName(e.target.value)}
                        placeholder={t('onboarding.steps.funnel.namePlaceholder')}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* Preview default stages */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {t('onboarding.steps.funnel.defaultStages')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_STAGES.map(stage => (
                            <span
                                key={stage.name}
                                className={cn(
                                    'px-2.5 py-1 rounded-full text-xs font-medium',
                                    stage.statusType === 'won' ? 'bg-emerald-500/10 text-emerald-600' :
                                        stage.statusType === 'lost' ? 'bg-red-500/10 text-red-600' :
                                            'bg-blue-500/10 text-blue-600'
                                )}
                            >
                                {stage.name}
                            </span>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    {t('onboarding.steps.funnel.skipHint')}
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {t('onboarding.back')}
                </button>
                <button
                    onClick={() => void handleCreate()}
                    disabled={creating}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-500 text-white rounded-xl font-semibold hover:bg-violet-600 disabled:opacity-60 transition-colors"
                >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {creating ? t('onboarding.finishing') : t('onboarding.next')}
                </button>
            </div>

            <button
                onClick={onNext}
                disabled={creating}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                {t('onboarding.skip')} →
            </button>
        </div>
    );
}

// ─── Step 4: Invite ───────────────────────────────────────────────────────────

interface Step4Props {
    onFinish: () => void;
    onBack: () => void;
}

/**
 * Шаг 4: Приглашение коллег по email.
 */
function Step4Invite({ onFinish, onBack }: Step4Props): ReactElement {
    const { t } = useTranslation();
    const [invites, setInvites] = useState<InviteEntry[]>([{ email: '', role: 'manager' }]);
    const [sending, setSending] = useState(false);

    function addEntry() {
        setInvites(prev => [...prev, { email: '', role: 'manager' }]);
    }

    function removeEntry(idx: number) {
        setInvites(prev => prev.filter((_, i) => i !== idx));
    }

    function updateEntry(idx: number, field: keyof InviteEntry, value: string) {
        setInvites(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
    }

    /**
     * Отправить приглашения через CompanyInvite API и завершить онбординг.
     */
    async function handleFinish(): Promise<void> {
        const validInvites = invites.filter(i => i.email.trim());
        if (validInvites.length === 0) {
            onFinish();
            return;
        }

        setSending(true);
        try {
            const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
            let companyId: string | undefined;
            let invitedBy: string | undefined;

            if (username) {
                const appUserResult = await getAppUser(username);
                if (appUserResult.success && appUserResult.user) {
                    invitedBy = appUserResult.user.id;
                    if (appUserResult.user.orgCode) {
                        const company = await companyApi.getByOrgCode(appUserResult.user.orgCode);
                        companyId = company?.id;
                    }
                }
            }

            // Create invite records
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            await Promise.allSettled(
                validInvites.map(invite =>
                    apiClient.post('/application/api/CompanyInvite', {
                        email: invite.email,
                        role: invite.role,
                        companyId,
                        invitedBy,
                        token: crypto.randomUUID(),
                        expiresAt,
                    })
                )
            );
        } catch (err) {
            console.error('Failed to send invites:', err);
        } finally {
            setSending(false);
            onFinish();
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('onboarding.steps.invite.title')}</h2>
                <p className="text-muted-foreground mt-2">{t('onboarding.steps.invite.subtitle')}</p>
            </div>

            <div className="space-y-3">
                {invites.map((entry, idx) => (
                    <div key={idx} className="flex gap-2">
                        <input
                            type="email"
                            value={entry.email}
                            onChange={e => updateEntry(idx, 'email', e.target.value)}
                            placeholder={t('onboarding.steps.invite.emailPlaceholder')}
                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                        <select
                            value={entry.role}
                            onChange={e => updateEntry(idx, 'role', e.target.value)}
                            className="px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="manager">{t('onboarding.steps.invite.roleManager')}</option>
                            <option value="viewer">{t('onboarding.steps.invite.roleViewer')}</option>
                        </select>
                        {invites.length > 1 && (
                            <button
                                onClick={() => removeEntry(idx)}
                                className="p-2.5 rounded-xl border-2 border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}

                <button
                    onClick={addEntry}
                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('onboarding.steps.invite.addMore')}
                </button>

                <p className="text-xs text-muted-foreground text-center">
                    {t('onboarding.steps.invite.skipHint')}
                </p>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                    {t('onboarding.back')}
                </button>
                <button
                    onClick={() => void handleFinish()}
                    disabled={sending}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {sending ? t('onboarding.finishing') : t('onboarding.finish')}
                </button>
            </div>

            <button
                onClick={onFinish}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                {t('onboarding.skip')} →
            </button>
        </div>
    );
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

const TOTAL_STEPS = 4;

/**
 * OnboardingPage — визард первоначальной настройки (4 шага).
 * После завершения перенаправляет на Dashboard.
 */
export function OnboardingPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [doNotShowAgain, setDoNotShowAgain] = useState(false);

    /**
     * Сохранить флаг завершения онбординга и перейти на главную.
     */
    async function handleFinish() {
        const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
        if (username) {
            if (doNotShowAgain || step === TOTAL_STEPS) {
                await updateOnboardingStatus(username, true);
                localStorage.setItem('gravisales_onboarding_done', '1');
            }
        }
        void navigate('/', { replace: true });
    }

    async function handleSkip() {
        const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
        // Always set the flag when skipping to avoid being redirected back to onboarding immediately
        localStorage.setItem('gravisales_onboarding_done', '1');

        if (username && doNotShowAgain) {
            await updateOnboardingStatus(username, true);
        }
        void navigate('/', { replace: true });
    }

    // Step labels for progress indicator

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                        <Sparkles className="w-4 h-4" />
                        {t('onboarding.title')}
                    </div>
                    <p className="text-muted-foreground">{t('onboarding.step', { current: step, total: TOTAL_STEPS })}</p>
                </div>

                {/* Progress bar */}
                <div className="flex gap-2 mb-8">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1.5 flex-1 rounded-full transition-all',
                                i + 1 <= step ? 'bg-primary' : 'bg-muted'
                            )}
                        />
                    ))}
                </div>

                {/* Card */}
                <div className="bg-card rounded-2xl border border-border shadow-lg p-8">
                    {step === 1 && (
                        <Step1Language onNext={() => setStep(2)} />
                    )}
                    {step === 2 && (
                        <Step2Company
                            onNext={() => setStep(3)}
                            onBack={() => setStep(1)}
                        />
                    )}
                    {step === 3 && (
                        <Step3Funnel
                            onNext={() => setStep(4)}
                            onBack={() => setStep(2)}
                        />
                    )}
                    {step === 4 && (
                        <Step4Invite
                            onFinish={handleFinish}
                            onBack={() => setStep(3)}
                        />
                    )}

                    {/* Do not show again & Skip */}
                    <div className="mt-8 pt-6 border-t border-border flex flex-col items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                            <input
                                type="checkbox"
                                checked={doNotShowAgain}
                                onChange={(e) => setDoNotShowAgain(e.target.checked)}
                                className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-background"
                            />
                            {t('onboarding.doNotShowAgain')}
                        </label>
                        <button
                            onClick={handleSkip}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('onboarding.exit', 'Выход из мастера настройки')} →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
