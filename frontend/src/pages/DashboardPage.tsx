/**
 * DashboardPage — главная страница дашборда.
 * Реальные виджеты: «Мои сделки», «Выиграно в этом месяце»,
 * «Дедлайны этой недели», «Клиенты».
 */
import { useEffect, useState, type ReactElement } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp, Users, Briefcase, DollarSign,
    ArrowUpRight, ArrowDownRight, Trophy, Calendar,
    Loader2, AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';
import { dealsApi, type Deal } from '../api/deals';
import { clientsApi } from '../api/clients';
import { getAppUser } from '../lib/api';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface DashboardStats {
    myDeals: number;
    wonThisMonth: number;
    wonAmountThisMonth: number;
    deadlinesThisWeek: number;
    totalClients: number;
}

interface RecentDeal {
    id: string;
    name: string;
    amount: number;
    deadline?: string;
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

interface MetricCardProps {
    title: string;
    value: string;
    sub?: string;
    isPositive?: boolean;
    icon: React.ReactNode;
    gradient: string;
    loading?: boolean;
}

/**
 * Карточка метрики дашборда.
 */
function MetricCard({ title, value, sub, isPositive, icon, gradient, loading }: MetricCardProps): ReactElement {
    return (
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', gradient)}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground text-sm">загрузка...</span>
                    </div>
                ) : (
                    <>
                        <p className="text-2xl font-extrabold text-foreground mb-1 truncate">{value}</p>
                        {sub && (
                            <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive !== false ? 'text-emerald-600' : 'text-red-500')}>
                                {isPositive !== false ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                                <span className="truncate">{sub}</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function isThisMonth(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function isThisWeek(dateStr?: string): boolean {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Mon
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    return d >= startOfWeek && d <= endOfWeek;
}

function formatAmount(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return String(n);
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────

export function DashboardPage(): ReactElement {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        myDeals: 0,
        wonThisMonth: 0,
        wonAmountThisMonth: 0,
        deadlinesThisWeek: 0,
        totalClients: 0,
    });
    const [recentDeals, setRecentDeals] = useState<RecentDeal[]>([]);
    const [pipelineStages, setPipelineStages] = useState<{ name: string; count: number; color: string }[]>([]);

    const STAGE_COLORS: Record<string, string> = {
        won: 'bg-emerald-500',
        lost: 'bg-red-400',
        open: 'bg-blue-500',
    };
    const STAGE_BG_COLORS: string[] = [
        'bg-slate-400', 'bg-blue-500', 'bg-violet-500',
        'bg-amber-500', 'bg-orange-500', 'bg-emerald-500',
    ];

    useEffect(() => {
        async function loadDashboard() {
            setLoading(true);
            setError(null);
            try {
                const username = localStorage.getItem('gravisales_username') || '';

                // Fetch all deals and clients in parallel
                const [allDeals, allClients] = await Promise.all([
                    dealsApi.getDeals(),
                    clientsApi.getAll().catch(() => [] as ReturnType<typeof clientsApi.getAll> extends Promise<infer T> ? T : never[]),
                ]);

                // My deals (responsible = current user)
                const myDeals = username
                    ? allDeals.filter(d => d.responsible === username)
                    : allDeals;

                // Won this month
                const wonDeals = allDeals.filter(d => {
                    const stage = d.stage?.toLowerCase?.() || '';
                    return stage === 'won' || stage === 'won' || d.stage === 'won';
                });
                const wonThisMonth = wonDeals.filter(d => isThisMonth(d.deadline)).length;
                const wonAmountThisMonth = wonDeals
                    .filter(d => isThisMonth(d.deadline))
                    .reduce((sum, d) => sum + (d.amount || 0), 0);

                // Deadlines this week (active deals only)
                const activeDeals = allDeals.filter(d => {
                    const s = d.stage?.toLowerCase?.() || '';
                    return s !== 'won' && s !== 'lost';
                });
                const deadlinesThisWeek = activeDeals.filter(d => isThisWeek(d.deadline)).length;

                // Build pipeline breakdown by stage
                const stageMap = new Map<string, number>();
                activeDeals.forEach(d => {
                    const s = d.stage || 'unknown';
                    stageMap.set(s, (stageMap.get(s) || 0) + 1);
                });
                const pipeline = Array.from(stageMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6)
                    .map(([name, count], i) => ({
                        name,
                        count,
                        color: STAGE_BG_COLORS[i] || 'bg-primary',
                    }));

                // Recent active deals (top 3 with upcoming deadlines)
                const sortedByDeadline = [...activeDeals]
                    .filter(d => d.deadline)
                    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
                    .slice(0, 5);

                setStats({
                    myDeals: myDeals.length,
                    wonThisMonth,
                    wonAmountThisMonth,
                    deadlinesThisWeek,
                    totalClients: (allClients as Deal[]).length,
                });
                setRecentDeals(sortedByDeadline.map(d => ({
                    id: d.id,
                    name: d.name,
                    amount: d.amount,
                    deadline: d.deadline,
                })));
                setPipelineStages(pipeline);
            } catch (err) {
                console.error('Dashboard load failed:', err);
                setError('Не удалось загрузить данные');
            } finally {
                setLoading(false);
            }
        }
        loadDashboard();
    }, []);

    const maxPipelineCount = Math.max(...pipelineStages.map(s => s.count), 1);

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title', 'Dashboard')}</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {t('dashboard.subtitle', 'Обзор активности и ключевых метрик')}
                    </p>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-xl text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <MetricCard
                        loading={loading}
                        title={t('dashboard.metrics.deals', 'Мои активные сделки')}
                        value={String(stats.myDeals)}
                        icon={<Briefcase className="w-5 h-5 text-blue-600" />}
                        gradient="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <MetricCard
                        loading={loading}
                        title={t('dashboard.metrics.revenue', 'Выиграно в этом месяце')}
                        value={stats.wonAmountThisMonth > 0
                            ? `₽${formatAmount(stats.wonAmountThisMonth)}`
                            : `${stats.wonThisMonth} сд.`}
                        sub={stats.wonThisMonth > 0 ? `${stats.wonThisMonth} сделок закрыто` : undefined}
                        isPositive
                        icon={<Trophy className="w-5 h-5 text-amber-600" />}
                        gradient="bg-amber-100 dark:bg-amber-900/30"
                    />
                    <MetricCard
                        loading={loading}
                        title="Дедлайны на этой неделе"
                        value={String(stats.deadlinesThisWeek)}
                        sub={stats.deadlinesThisWeek > 0 ? 'Требуют внимания' : 'Нет срочных сделок'}
                        isPositive={stats.deadlinesThisWeek === 0}
                        icon={<Calendar className="w-5 h-5 text-violet-600" />}
                        gradient="bg-violet-100 dark:bg-violet-900/30"
                    />
                    <MetricCard
                        loading={loading}
                        title={t('dashboard.metrics.customers', 'Клиентов')}
                        value={String(stats.totalClients)}
                        icon={<Users className="w-5 h-5 text-emerald-600" />}
                        gradient="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Pipeline breakdown */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                                {t('dashboard.pipeline', 'Воронка продаж')} — активные сделки
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : pipelineStages.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">Нет активных сделок</p>
                            ) : (
                                pipelineStages.map(({ name, count, color }) => (
                                    <div key={name} className="space-y-1.5 px-1">
                                        <div className="flex justify-between text-xs gap-2">
                                            <span className="text-muted-foreground truncate">{name}</span>
                                            <span className="font-semibold text-foreground shrink-0">{count}</span>
                                        </div>
                                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={cn('h-full rounded-full transition-all duration-500', color)}
                                                style={{ width: `${(count / maxPipelineCount) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Deadlines this week */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                Ближайшие дедлайны
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : recentDeals.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-6">Нет предстоящих дедлайнов</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentDeals.map(deal => {
                                        const daysLeft = deal.deadline
                                            ? Math.ceil((new Date(deal.deadline).getTime() - Date.now()) / 86400000)
                                            : null;
                                        return (
                                            <div key={deal.id} className="flex items-start gap-3">
                                                <div className={cn(
                                                    'w-2 h-2 rounded-full mt-1.5 shrink-0',
                                                    daysLeft !== null && daysLeft <= 2 ? 'bg-red-500' :
                                                        daysLeft !== null && daysLeft <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                )} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{deal.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {deal.deadline}
                                                        {daysLeft !== null && (
                                                            <span className={cn(
                                                                'ml-1',
                                                                daysLeft <= 0 ? 'text-red-500 font-medium' :
                                                                    daysLeft <= 2 ? 'text-amber-600' : ''
                                                            )}>
                                                                ({daysLeft <= 0 ? 'просрочено' : `${daysLeft} дн.`})
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                                {deal.amount > 0 && (
                                                    <span className="text-xs text-muted-foreground shrink-0">
                                                        ₽{formatAmount(deal.amount)}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Card className="sm:col-span-3">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                Сводка по сделкам
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {[
                                        { label: 'Всего сделок (у меня)', value: String(stats.myDeals), color: 'text-blue-600' },
                                        { label: 'Выиграно в месяце', value: String(stats.wonThisMonth), color: 'text-emerald-600' },
                                        { label: 'Выручка в месяце', value: `₽${formatAmount(stats.wonAmountThisMonth)}`, color: 'text-amber-600' },
                                        { label: 'Дедлайны на неделе', value: String(stats.deadlinesThisWeek), color: stats.deadlinesThisWeek > 3 ? 'text-red-500' : 'text-violet-600' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label} className="text-center">
                                            <p className={cn('text-2xl font-extrabold', color)}>{value}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
