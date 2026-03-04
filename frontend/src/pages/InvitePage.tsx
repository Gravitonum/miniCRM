/**
 * InvitePage — страница принятия приглашения по токену.
 * Доступна по публичному маршруту /invite/:token.
 *
 * Позволяет принять корпоративное приглашение: установить пароль,
 * создать учётную запись и автоматически войти в систему.
 *
 * @example
 * <Route path="/invite/:token" element={<InvitePage />} />
 */
import { useState, useEffect, type ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Mail, Building2, Shield } from 'lucide-react';
import apiClient from '../api/client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InviteData {
    id: string;
    email: string;
    role: string;
    companyId?: string;
    companyName?: string;
    expiresAt?: string;
    acceptedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Проверить, не истёк ли токен приглашения.
 */
function isExpired(invite: InviteData): boolean {
    if (!invite.expiresAt) return false;
    return new Date(invite.expiresAt) < new Date();
}

/**
 * Получить отображаемое название роли.
 */
function getRoleLabel(role: string, t: (key: string) => string): string {
    const key = `invite.roles.${role}`;
    const result = t(key);
    return result !== key ? result : role;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * Страница принятия приглашения с формой создания пароля.
 */
export function InvitePage(): ReactElement {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [invite, setInvite] = useState<InviteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteError, setInviteError] = useState<string | null>(null);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    /**
     * Загрузить данные приглашения по токену.
     */
    useEffect(() => {
        if (!token) {
            setInviteError(t('invite.notFound'));
            setLoading(false);
            return;
        }

        async function loadInvite(): Promise<void> {
            try {
                interface InviteRaw {
                    id: string;
                    email?: string;
                    role?: string;
                    companyId?: string;
                    expiresAt?: string;
                    acceptedAt?: string;
                    company?: { id: string; name?: string };
                }

                const resp = await apiClient.get<InviteRaw[] | { data: InviteRaw[] }>(
                    '/application/api/CompanyInvite',
                    { params: { filter: `token=="${token}"` } }
                );

                const rawList = Array.isArray(resp.data) ? resp.data : (resp.data?.data || []);
                if (rawList.length === 0) {
                    setInviteError(t('invite.notFound'));
                    return;
                }

                const raw = rawList[0];
                const inviteData: InviteData = {
                    id: raw.id,
                    email: raw.email || '',
                    role: raw.role || 'manager',
                    companyId: raw.companyId || raw.company?.id,
                    companyName: raw.company?.name,
                    expiresAt: raw.expiresAt,
                    acceptedAt: raw.acceptedAt,
                };

                if (inviteData.acceptedAt) {
                    // Already accepted → redirect
                    void navigate('/', { replace: true });
                    return;
                }

                setInvite(inviteData);
            } catch (err) {
                console.error('Failed to load invite:', err);
                setInviteError(t('invite.notFound'));
            } finally {
                setLoading(false);
            }
        }

        void loadInvite();
    }, [token, t, navigate]);

    /**
     * Принять приглашение: создать пользователя и отметить приглашение как принятое.
     */
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setFormError(null);

        if (!password) {
            setFormError(t('invite.errors.passwordRequired'));
            return;
        }
        if (password.length < 8) {
            setFormError(t('invite.errors.passwordTooShort'));
            return;
        }
        if (password !== confirmPassword) {
            setFormError(t('invite.errors.passwordsMismatch'));
            return;
        }

        setSubmitting(true);
        try {
            // Generate username from email
            const username = invite!.email.split('@')[0].replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 32);

            // Create user account in GraviBase
            await apiClient.post('/application/api/Users', {
                username,
                email: invite!.email,
                password,
                role: invite!.role,
                isActive: true,
            });

            // Mark invite as accepted
            await apiClient.put(`/application/api/CompanyInvite/${invite!.id}`, {
                acceptedAt: new Date().toISOString(),
            });

            setSuccess(true);

            // Redirect to login after 2s
            setTimeout(() => {
                void navigate('/login', { replace: true });
            }, 2500);
        } catch (err) {
            console.error('Failed to accept invite:', err);
            setFormError(t('invite.errors.failed'));
        } finally {
            setSubmitting(false);
        }
    }

    // ─── Loading state ──────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground text-sm">{t('invite.loading')}</p>
                </div>
            </div>
        );
    }

    // ─── Error state ────────────────────────────────────────────────────────
    if (inviteError || !invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        {inviteError || t('invite.notFound')}
                    </h1>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Проверьте ссылку или обратитесь к администратору компании
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Перейти ко входу
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Expired state ──────────────────────────────────────────────────────
    if (isExpired(invite)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-orange-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{t('invite.expired')}</h1>
                    <p className="text-muted-foreground mb-6 text-sm">
                        Попросите администратора отправить новое приглашение
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                    >
                        Перейти ко входу
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Success state ──────────────────────────────────────────────────────
    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <div className="w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Аккаунт создан!</h1>
                    <p className="text-muted-foreground text-sm">Перенаправление на страницу входа...</p>
                </div>
            </div>
        );
    }

    // ─── Invite form ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">{t('invite.title')}</h1>
                    <p className="text-muted-foreground mt-2 text-sm">{t('invite.subtitle')}</p>
                </div>

                {/* Invite info card */}
                <div className="bg-card rounded-2xl border border-border p-6 mb-6 space-y-3">
                    <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('invite.email')}</p>
                            <p className="text-sm font-semibold text-foreground">{invite.email}</p>
                        </div>
                    </div>
                    {invite.companyName && (
                        <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('invite.company')}</p>
                                <p className="text-sm font-semibold text-foreground">{invite.companyName}</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                            <p className="text-xs text-muted-foreground">{t('invite.role')}</p>
                            <p className="text-sm font-semibold text-foreground">{getRoleLabel(invite.role, t)}</p>
                        </div>
                    </div>
                </div>

                {/* Password form */}
                <div className="bg-card rounded-2xl border border-border p-6">
                    <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {formError}
                            </div>
                        )}

                        {/* Password field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                {t('invite.passwordLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    id="invite-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={t('invite.passwordPlaceholder')}
                                    autoFocus
                                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm password field */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                {t('invite.confirmLabel')}
                            </label>
                            <div className="relative">
                                <input
                                    id="invite-confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    placeholder={t('invite.confirmPlaceholder')}
                                    className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="invite-submit-btn"
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? t('invite.submitting') : t('invite.submit')}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="text-primary hover:underline">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}
