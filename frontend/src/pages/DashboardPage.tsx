/**
 * DashboardPage — главная страница дашборда с карточками метрик.
 * Использует shadcn/ui Card компоненты.
 */
import { type ReactElement } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, Briefcase, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { cn } from '../lib/utils';

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
    gradient: string;
}

/**
 * Карточка метрики
 */
function MetricCard({ title, value, change, isPositive, icon, gradient }: MetricCardProps): ReactElement {
    const { t } = useTranslation();
    return (
        <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 !pb-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', gradient)}>
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-extrabold text-foreground mb-1 truncate">{value}</p>
                <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-600' : 'text-red-500')}>
                    {isPositive
                        ? <ArrowUpRight className="w-3 h-3 shrink-0" />
                        : <ArrowDownRight className="w-3 h-3 shrink-0" />
                    }
                    <span className="truncate">{change}</span>
                    <span className="text-muted-foreground font-normal ml-1 truncate">{t('dashboard.metrics.vsLastMonth', 'vs прошлый месяц')}</span>
                </div>
            </CardContent>
        </Card>
    );
}

export function DashboardPage(): ReactElement {
    const { t } = useTranslation();

    const metrics: MetricCardProps[] = [
        {
            title: t('dashboard.metrics.revenue', 'Выручка'),
            value: '₽4.2M',
            change: '+12.5%',
            isPositive: true,
            icon: <DollarSign className="w-5 h-5 text-violet-600" />,
            gradient: 'bg-violet-100',
        },
        {
            title: t('dashboard.metrics.deals', 'Активных сделок'),
            value: '84',
            change: '+8.2%',
            isPositive: true,
            icon: <Briefcase className="w-5 h-5 text-blue-600" />,
            gradient: 'bg-blue-100',
        },
        {
            title: t('dashboard.metrics.customers', 'Клиентов'),
            value: '1,240',
            change: '+4.1%',
            isPositive: true,
            icon: <Users className="w-5 h-5 text-emerald-600" />,
            gradient: 'bg-emerald-100',
        },
        {
            title: t('dashboard.metrics.conversion', 'Конверсия'),
            value: '24.5%',
            change: '-2.3%',
            isPositive: false,
            icon: <TrendingUp className="w-5 h-5 text-orange-600" />,
            gradient: 'bg-orange-100',
        },
    ];

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

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {metrics.map((m) => (
                        <MetricCard key={m.title} {...m} />
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Main chart placeholder */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.revenueChart', 'Динамика выручки')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 flex items-end gap-1.5 px-2">
                                {[60, 45, 80, 55, 70, 90, 75, 85, 95, 65, 88, 100].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-t-sm bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer relative group"
                                        style={{ height: `${h}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                            ₽{h * 42}K
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 px-2 text-xs text-muted-foreground">
                                {['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'].map((m) => (
                                    <span key={m}>{t(`dashboard.months.${m}`)}</span>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{t('dashboard.pipeline', 'Воронка продаж')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'search', value: 32, color: 'bg-slate-400' },
                                { label: 'qualification', value: 24, color: 'bg-blue-500' },
                                { label: 'discussion', value: 18, color: 'bg-violet-500' },
                                { label: 'proposal', value: 14, color: 'bg-amber-500' },
                                { label: 'negotiation', value: 9, color: 'bg-orange-500' },
                                { label: 'closed', value: 5, color: 'bg-emerald-500' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="space-y-1.5 px-1">
                                    <div className="flex justify-between text-xs gap-2">
                                        <span className="text-muted-foreground truncate">{t(`dashboard.stages.${label}`)}</span>
                                        <span className="font-semibold text-foreground shrink-0">{value}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all duration-500', color)}
                                            style={{ width: `${(value / 32) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">{t('dashboard.recentActivity', 'Последняя активность')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { action: 'newDeal', name: 'Лицензия на ПО', time: '5m', dot: 'bg-blue-500' },
                                { action: 'dealMoved', name: 'Корпоративное развертывание', time: '1h', dot: 'bg-violet-500' },
                                { action: 'newClient', name: 'ООО «Технологии»', time: '3h', dot: 'bg-emerald-500' },
                            ].map(({ action, name, time, dot }) => (
                                <div key={name} className="flex items-start gap-3">
                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', dot)} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-muted-foreground">{t(`dashboard.activity.${action}`)}</p>
                                        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                                    </div>
                                    <span className="text-xs text-muted-foreground/60 shrink-0">{t(`dashboard.activity.ago`, { time })}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
