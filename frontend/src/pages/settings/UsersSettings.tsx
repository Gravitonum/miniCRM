/**
 * UsersSettings — вкладка управления пользователями (invite flow, roles).
 */
import { useEffect, useState, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Check, AlertCircle, Loader2, UserX, UserCheck } from 'lucide-react';
import { getAppUser, type AppUser } from '../../lib/api';
import { usersApi, type User } from '../../api/settings';

export function UsersSettings(): ReactElement {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviting, setInviting] = useState(false);

    const loadUsers = useCallback(async (orgCode: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await usersApi.getAll(orgCode);
            setUsers(data);
        } catch (err) {
            console.error('Failed to load users:', err);
            setError(t('settings.users.loadError', 'Не удалось загрузить пользователей'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        async function init() {
            const username = localStorage.getItem('gravisales_username');
            if (username) {
                const res = await getAppUser(username);
                if (res.success && res.user) {
                    setCurrentUser(res.user);
                    if (res.user.orgCode) {
                        await loadUsers(res.user.orgCode);
                        return;
                    }
                }
            }
            setLoading(false);
        }
        init();
    }, [loadUsers]);


    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        setInviting(true);
        // Заглушка отправки инвайта, т.к. бэкенда для инвайтов пока нет в ТЗ API (CompanyInvite)
        await new Promise(r => setTimeout(r, 1000));
        setInviteEmail('');
        setInviting(false);
        // show success toast or similar
    }

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-foreground">
                    {t('settings.users.title', 'Пользователи')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t('settings.users.subtitle', 'Приглашайте коллег и управляйте их доступом')}
                </p>
            </div>

            {/* Блок отправки приглашения */}
            <div className="p-5 bg-card border border-border rounded-xl">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                    {t('settings.users.inviteTitle', 'Пригласить пользователя')}
                </h3>
                <form onSubmit={handleInvite} className="flex gap-3">
                    <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="email"
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={inviting || !inviteEmail}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t('settings.users.sendInvite', 'Отправить')}</span>}
                    </button>
                </form>
            </div>

            {/* Список пользователей */}
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
                        {users.map(u => (
                            <div key={u.id} className="p-5 flex items-center justify-between hover:bg-accent/40 transition-colors">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {u.username} {currentUser.username === u.username && <span className="ml-2 text-xs text-muted-foreground">({t('settings.users.you', 'Вы')})</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email || '—'}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider ${u.isActive ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
                                        }`}>
                                        {u.isActive ? <Check className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                                        {u.isActive ? t('settings.users.statusActive', 'Активен') : t('settings.users.statusInactive', 'Заблокирован')}
                                    </span>

                                    {currentUser.username !== u.username && (
                                        <button
                                            onClick={() => toggleUser(u.id, !u.isActive)}
                                            className={`p-1.5 rounded-lg border transition-colors ${u.isActive
                                                ? 'border-destructive text-destructive hover:bg-destructive/10'
                                                : 'border-green-600 text-green-600 hover:bg-green-600/10'
                                                }`}
                                            title={u.isActive ? t('settings.users.block', 'Заблокировать') : t('settings.users.unblock', 'Разблокировать')}
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
