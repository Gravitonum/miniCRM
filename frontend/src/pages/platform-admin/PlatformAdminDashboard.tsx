/**
 * PlatformAdminDashboard — панель суперадминистратора.
 * Список всех тенантов с возможностью поиска, блокировки и разблокировки.
 *
 * @example
 * Доступна по роуту /platform-admin/dashboard (только для SuperAdmin)
 */
import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, Search, Building2, LogOut, Loader2,
    AlertCircle, RefreshCw, Lock, Unlock, X, CheckCircle2
} from 'lucide-react';
import {
    platformAdminApi, getPlatformAdminSession, clearPlatformAdminSession,
    type TenantCompany
} from '../../api/platformAdmin';
import { cn } from '../../lib/utils';

/** Модальное окно причины блокировки */
interface BlockModalProps {
    company: TenantCompany;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

function BlockModal({ company, onConfirm, onClose }: BlockModalProps): ReactElement {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-border bg-destructive/5">
                    <div className="w-9 h-9 bg-destructive/10 rounded-xl flex items-center justify-center">
                        <Lock className="w-4 h-4 text-destructive" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Заблокировать тенанта</h3>
                        <p className="text-xs text-muted-foreground">{company.name} ({company.orgCode})</p>
                    </div>
                    <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Причина блокировки <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="Опишите причину блокировки аккаунта..."
                            rows={3}
                            autoFocus
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive transition-colors resize-none"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-background text-foreground font-semibold hover:bg-accent transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => { if (reason.trim()) onConfirm(reason.trim()); }}
                            disabled={!reason.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 disabled:opacity-50 transition-colors"
                        >
                            Заблокировать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Главная панель суперадминистратора */
export function PlatformAdminDashboard(): ReactElement {
    const navigate = useNavigate();
    const session = getPlatformAdminSession();

    const [companies, setCompanies] = useState<TenantCompany[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [blockingCompany, setBlockingCompany] = useState<TenantCompany | null>(null);
    const [actionInProgress, setActionInProgress] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    /** Загрузить список тенантов */
    const loadCompanies = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const data = await platformAdminApi.getCompanies();
            setCompanies(data);
        } catch (err) {
            console.error('Failed to load companies:', err);
            setError('Не удалось загрузить список тенантов');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void loadCompanies(); }, [loadCompanies]);

    /** Показать уведомление с автоскрытием */
    function showToast(message: string, type: 'success' | 'error'): void {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }

    /** Выйти из панели админа */
    function handleLogout(): void {
        clearPlatformAdminSession();
        navigate('/platform-admin/login', { replace: true });
    }

    /** Заблокировать тенанта */
    async function handleBlock(company: TenantCompany, reason: string): Promise<void> {
        setBlockingCompany(null);
        setActionInProgress(company.id);
        try {
            await platformAdminApi.blockCompany(company.id, reason);
            setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isBlocked: true, blockedReason: reason } : c));
            showToast(`Тенант «${company.name}» заблокирован`, 'success');
        } catch (err) {
            console.error('Block error:', err);
            showToast('Ошибка при блокировке', 'error');
        } finally {
            setActionInProgress(null);
        }
    }

    /** Разблокировать тенанта */
    async function handleUnblock(company: TenantCompany): Promise<void> {
        setActionInProgress(company.id);
        try {
            await platformAdminApi.unblockCompany(company.id);
            setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, isBlocked: false, blockedReason: undefined } : c));
            showToast(`Тенант «${company.name}» разблокирован`, 'success');
        } catch (err) {
            console.error('Unblock error:', err);
            showToast('Ошибка при разблокировке', 'error');
        } finally {
            setActionInProgress(null);
        }
    }

    const filtered = companies.filter(c => {
        const q = search.toLowerCase();
        return !q || c.name.toLowerCase().includes(q) || c.orgCode.toLowerCase().includes(q);
    });

    const activeCount = companies.filter(c => !c.isBlocked).length;
    const blockedCount = companies.filter(c => c.isBlocked).length;

    return (
        <div className="min-h-screen bg-background">
            {/* Toast */}
            {toast && (
                <div className={cn(
                    'fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all',
                    toast.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                        : 'bg-destructive/10 border-destructive/20 text-destructive'
                )}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <span className="font-bold text-foreground text-sm">GraviSales SuperAdmin</span>
                            {session && (
                                <span className="text-xs text-muted-foreground ml-2">· {session.email}</span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Выйти
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Page title */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Управление тенантами</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Список всех организаций на платформе</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Всего организаций', value: companies.length, color: 'text-foreground' },
                        { label: 'Активных', value: activeCount, color: 'text-emerald-600' },
                        { label: 'Заблокированных', value: blockedCount, color: 'text-destructive' },
                    ].map(s => (
                        <div key={s.label} className="bg-card border border-border rounded-xl p-4">
                            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Search + Refresh */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            id="admin-search"
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Поиск по названию или коду организации..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => void loadCompanies()}
                        title="Обновить"
                        className="p-2.5 rounded-xl border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Загрузка тенантов...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                        <p className="text-muted-foreground text-sm">{error}</p>
                        <button
                            onClick={() => void loadCompanies()}
                            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                        >
                            Повторить
                        </button>
                    </div>
                ) : (
                    <div className="bg-card border border-border rounded-xl overflow-hidden">
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[1fr_160px_120px_80px_160px] gap-4 px-6 py-3 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            <span>Организация</span>
                            <span>Код (orgCode)</span>
                            <span>Валюта / ТЗ</span>
                            <span>Статус</span>
                            <span className="text-right">Действие</span>
                        </div>

                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                                    <Building2 className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {search ? 'Ничего не найдено' : 'Тенантов пока нет'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filtered.map(company => (
                                    <div
                                        key={company.id}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px_80px_160px] gap-2 md:gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                                    >
                                        {/* Name */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                'w-9 h-9 shrink-0 rounded-lg flex items-center justify-center',
                                                company.isBlocked ? 'bg-destructive/10' : 'bg-primary/10'
                                            )}>
                                                <Building2 className={cn('w-4 h-4', company.isBlocked ? 'text-destructive' : 'text-primary')} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{company.name}</p>
                                                {company.isBlocked && company.blockedReason && (
                                                    <p className="text-xs text-destructive truncate">{company.blockedReason}</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* OrgCode */}
                                        <span className="text-sm text-muted-foreground font-mono self-center">{company.orgCode}</span>
                                        {/* Currency / TZ */}
                                        <span className="text-xs text-muted-foreground self-center">
                                            {[company.currency, company.timezone].filter(Boolean).join(' / ') || '—'}
                                        </span>
                                        {/* Status */}
                                        <div className="self-center">
                                            <span className={cn(
                                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                                company.isBlocked
                                                    ? 'bg-destructive/10 text-destructive'
                                                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                            )}>
                                                {company.isBlocked ? 'Заблок.' : 'Активен'}
                                            </span>
                                        </div>
                                        {/* Action */}
                                        <div className="flex justify-end self-center">
                                            {actionInProgress === company.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            ) : company.isBlocked ? (
                                                <button
                                                    onClick={() => void handleUnblock(company)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                >
                                                    <Unlock className="w-3.5 h-3.5" />
                                                    Разблокировать
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setBlockingCompany(company)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                                                >
                                                    <Lock className="w-3.5 h-3.5" />
                                                    Заблокировать
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        {filtered.length > 0 && (
                            <div className="px-6 py-3 bg-muted/20 border-t border-border text-xs text-muted-foreground">
                                Показано: <span className="font-semibold text-foreground">{filtered.length}</span>
                                {filtered.length !== companies.length && ` из ${companies.length}`}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Block Modal */}
            {blockingCompany && (
                <BlockModal
                    company={blockingCompany}
                    onConfirm={reason => void handleBlock(blockingCompany, reason)}
                    onClose={() => setBlockingCompany(null)}
                />
            )}
        </div>
    );
}
