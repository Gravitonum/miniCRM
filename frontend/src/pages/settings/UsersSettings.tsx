/**
 * UsersSettings — вкладка управления пользователями.
 * Поддерживает invite flow с выбором роли, список текущих пользователей
 * и список ожидающих приглашений с возможностью отзыва.
 */
import { useEffect, useState, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Mail, Check, AlertCircle, Loader2, UserX, UserCheck,
    Clock, Trash2, ChevronDown, Send
} from 'lucide-react';
import { getAppUser, type AppUser } from '../../lib/api';
import { usersApi, companyApi, inviteApi, type User, type CompanyInvite, type Company } from '../../api/settings';

type Role = 'manager' | 'company_admin' | 'viewer';

const ROLES: { value: Role; labelKey: string }[] = [
    { value: 'manager', labelKey: 'invite.roles.manager' },
    { value: 'company_admin', labelKey: 'invite.roles.company_admin' },
    { value: 'viewer', labelKey: 'invite.roles.viewer' },
];

export function UsersSettings(): ReactElement {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [invites, setInvites] = useState<CompanyInvite[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<Role>('manager');
    const [inviting, setInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    const loadData = useCallback(async (orgCode: string, companyId: string) => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, invitesData] = await Promise.all([
                usersApi.getAll(orgCode),
                inviteApi.getAll(companyId),
            ]);
            setUsers(usersData);
            setInvites(invitesData.filter(inv => !inv.isAccepted));
        } catch (err) {
            console.error('Failed to load users/invites:', err);
            setError(t('settings.users.loadError', 'Не удалось загрузить пользователей'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        async function init() {
            const username = localStorage.getItem('gravisales_username');
            if (!username) { setLoading(false); return; }

            const res = await getAppUser(username);
            if (!res.success || !res.user?.orgCode) { setLoading(false); return; }

            setCurrentUser(res.user);
            const comp = await companyApi.getByOrgCode(res.user.orgCode);
            setCompany(comp);

            if (comp) {
                await loadData(res.user.orgCode, comp.id);
            } else {
                setLoading(false);
            }
        }
        init();
    }, [loadData]);

    /**
     * Отправить invite на email с выбранной ролью.
     * Создаёт запись CompanyInvite в GraviBase.
     */
    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;
        setInviting(true);
        try {
            const newInvite = await inviteApi.create(company.id, inviteEmail.trim(), inviteRole);
            setInvites(prev => [newInvite, ...prev]);
            setInviteEmail('');
            setInviteSuccess(true);
            setTimeout(() => setInviteSuccess(false), 3000);
        } catch (err) {
            console.error('Failed to send invite:', err);
        } finally {
            setInviting(false);
        }
    }

    /** Отозвать ожидающее приглашение */
    async function handleRevoke(id: string) {
        try {
            await inviteApi.revoke(id);
            setInvites(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error('Failed to revoke invite:', err);
        }
    }

    /** Заблокировать / разблокировать пользователя */
    async function toggleUser(id: string, active: boolean) {
        try {
            await usersApi.toggleActive(id, active);
            setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: active } : u));
        } catch (err) {
            console.error('Failed to toggle user:', err);
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    if (!currentUser?.orgCode) {
        return (
            <div className="p-6 bg-card border border-border rounded-xl">
                <p className="text-sm text-foreground">{t('settings.users.noCompany', 'Вы не привязаны ни к одной компании.')}</p>
            </div>
        );
    }

    const pendingInvites = invites.filter(i => !i.isAccepted);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-foreground">
                    {t('settings.users.title', 'Пользователи')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t('settings.users.subtitle', 'Приглашайте коллег и управляйте их доступом')}
                </p>
            </div>

            {/* Invite block */}
            <div className="p-5 bg-card border border-border rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-foreground">
                    {t('settings.users.inviteTitle', 'Пригласить пользователя')}
                </h3>
                <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <input
                            type="email"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={inviteRole}
                            onChange={e => setInviteRole(e.target.value as Role)}
                            className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {ROLES.map(r => (
                                <option key={r.value} value={r.value}>
                                    {t(r.labelKey, r.value)}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                    <button
                        type="submit"
                        disabled={inviting || !inviteEmail}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shrink-0"
                    >
                        {inviting
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Send className="w-4 h-4" />}
                        {t('settings.users.sendInvite', 'Отправить')}
                    </button>
                </form>
                {inviteSuccess && (
                    <p className="text-sm text-green-600 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        {t('onboarding.steps.invite.inviteSent', 'Приглашение отправлено')}
                    </p>
                )}
            </div>

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-muted/20">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <h3 className="text-sm font-semibold text-foreground">
                            Ожидают принятия ({pendingInvites.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-border">
                        {pendingInvites.map(inv => (
                            <div key={inv.id} className="p-4 flex items-center justify-between gap-4 hover:bg-accent/30 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                                    <p className="text-xs text-muted-foreground">{t(`invite.roles.${inv.role}`, inv.role)}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[11px] bg-amber-500/10 text-amber-600 font-medium px-2 py-1 rounded-full uppercase tracking-wider">
                                        pending
                                    </span>
                                    <button
                                        onClick={() => handleRevoke(inv.id)}
                                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
                                        title="Отозвать"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Users list */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <h3 className="text-sm font-semibold text-foreground">
                        {t('settings.users.listTitle', 'Текущие пользователи')}
                    </h3>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {users.length} {t('settings.users.count', 'чел.')}
                    </span>
                </div>
                {error ? (
                    <div className="p-5 flex items-center gap-2 text-destructive text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {users.length === 0 && (
                            <p className="p-5 text-sm text-muted-foreground text-center">Нет пользователей</p>
                        )}
                        {users.map(u => (
                            <div key={u.id} className="p-5 flex items-center justify-between hover:bg-accent/40 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {u.username}
                                        {currentUser?.username === u.username && (
                                            <span className="ml-2 text-xs text-muted-foreground">({t('settings.users.you', 'Вы')})</span>
                                        )}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${u.isActive ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                                        {u.isActive ? <Check className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                        {u.isActive
                                            ? t('settings.users.statusActive', 'Активен')
                                            : t('settings.users.statusInactive', 'Заблокирован')}
                                    </span>
                                    {currentUser?.username !== u.username && (
                                        <button
                                            onClick={() => toggleUser(u.id, !u.isActive)}
                                            className={`p-1.5 rounded-lg border transition-colors ${u.isActive
                                                ? 'border-destructive text-destructive hover:bg-destructive/10'
                                                : 'border-green-600 text-green-600 hover:bg-green-600/10'}`}
                                            title={u.isActive
                                                ? t('settings.users.block', 'Заблокировать')
                                                : t('settings.users.unblock', 'Разблокировать')}
                                        >
                                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
