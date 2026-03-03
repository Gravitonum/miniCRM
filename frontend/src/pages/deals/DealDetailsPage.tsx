import { type ReactElement, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, CheckCircle2, MoreHorizontal, Plus,
    Mail, Phone, MapPin, Building2, Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

/** Тип этапа сделки */
type StageStatus = 'completed' | 'current' | 'pending';

/** Описание этапа */
interface Stage {
    key: string;
    labelKey: string;
    status: StageStatus;
}

const MOCK_STAGES: Stage[] = [
    { key: 'prospecting', labelKey: 'deals.stages.prospecting', status: 'completed' },
    { key: 'qualified', labelKey: 'deals.stages.qualified', status: 'completed' },
    { key: 'discovery', labelKey: 'deals.stages.discovery', status: 'completed' },
    { key: 'proposalSent', labelKey: 'deals.stages.proposalSent', status: 'current' },
    { key: 'negotiation', labelKey: 'deals.stages.negotiation', status: 'pending' },
    { key: 'closed', labelKey: 'deals.stages.closed', status: 'pending' },
];

/**
 * Блок поля с меткой и значением.
 * @example <FieldBlock label="Отрасль" value="Технологии" />
 */
function FieldBlock({ label, value }: { label: string; value: string }): ReactElement {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
    );
}

/**
 * Страница подробной карточки сделки.
 * @example <DealDetailsPage />
 */
export function DealDetailsPage(): ReactElement {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'notes' | 'history'>('overview');

    const dealName = 'SaaS Collaboration Tool Deal';
    void id;

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: 'overview', label: t('deals.details.tabs.overview') },
        { key: 'tasks', label: t('deals.details.tabs.tasks') },
        { key: 'notes', label: t('deals.details.tabs.notes') },
        { key: 'history', label: t('deals.details.tabs.history') },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">

                {/* Back + title + tabs */}
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        {t('deals.details.backToDeals')}
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">{dealName}</h1>

                    <div className="flex gap-0.5 mt-5 border-b border-border">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={cn(
                                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
                                    activeTab === tab.key
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Overview tab */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Left column */}
                        <div className="xl:col-span-2 flex flex-col gap-6">

                            {/* Stages card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                    <CardTitle className="text-base">{t('deals.details.stages')}</CardTitle>
                                    <Button variant="outline" size="sm">
                                        {t('deals.details.moveToNextStage')}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative">
                                        <div className="absolute left-5 right-5 top-4 h-0.5 bg-border -z-10" />
                                        <div className="flex items-start justify-between gap-2">
                                            {MOCK_STAGES.map((stage) => (
                                                <div key={stage.key} className="flex flex-col items-center gap-2 flex-1">
                                                    <div className="bg-card px-1">
                                                        {stage.status === 'completed' && (
                                                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                                                                <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                                                            </div>
                                                        )}
                                                        {stage.status === 'current' && (
                                                            <div className="w-8 h-8 rounded-full border-2 border-primary border-dashed bg-card flex items-center justify-center">
                                                                <div className="w-3 h-3 rounded-full bg-primary" />
                                                            </div>
                                                        )}
                                                        {stage.status === 'pending' && (
                                                            <div className="w-8 h-8 rounded-full border-2 border-border bg-muted/50 flex items-center justify-center">
                                                                <div className="w-2.5 h-2.5 rounded-full bg-border" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className={cn(
                                                        'text-xs font-medium text-center leading-tight',
                                                        stage.status === 'pending' ? 'text-muted-foreground/40' :
                                                            stage.status === 'current' ? 'text-primary' : 'text-foreground'
                                                    )}>
                                                        {t(stage.labelKey)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Deal details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">{t('deals.details.opportunityDetails')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <FieldBlock label={t('deals.details.fields.opportunityId')} value="OP-001" />
                                        <FieldBlock label={t('deals.details.fields.industry')} value="Технологии / ПО" />
                                        <FieldBlock label={t('deals.details.fields.closeDate')} value="05.12.2025" />
                                        <FieldBlock label={t('deals.details.fields.probability')} value="70%" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-4">{t('deals.details.financials')}</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <FieldBlock label={t('deals.details.fields.expectedRevenue')} value="8 000 ₽" />
                                            <FieldBlock label={t('deals.details.fields.discount')} value="10%" />
                                            <FieldBlock label={t('deals.details.fields.subscriptionDetails')} value="80 ₽/пользователь/год" />
                                            <FieldBlock label={t('deals.details.fields.competitorPricing')} value="85 ₽/пользователь/год" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right sidebar */}
                        <div className="flex flex-col gap-4">

                            {/* Contacts */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-base flex items-center gap-1.5">
                                        {t('deals.details.contacts')}
                                        <button className="text-muted-foreground hover:text-primary transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </CardTitle>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <div className="bg-primary/10 py-1.5 px-4 text-center text-xs font-semibold text-primary uppercase tracking-wide">
                                            {t('deals.details.primaryContact')}
                                        </div>
                                        <div className="p-4 relative">
                                            <button className="absolute right-3 top-3 text-muted-foreground/40 hover:text-foreground transition-colors">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 overflow-hidden flex-shrink-0">
                                                    <img src="https://i.pravatar.cc/150?img=1" alt="avatar" className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">Мария Иванова</p>
                                                    <p className="text-xs text-muted-foreground">Менеджер по продуктам</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <span>maria@example.com</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Phone className="w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <span>+7 (495) 555-0112</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Company */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-base">{t('deals.details.company')}</CardTitle>
                                    <button className="text-muted-foreground hover:text-foreground">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground text-sm">Code Sphere</p>
                                            <p className="text-xs text-muted-foreground">Технологии</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FieldBlock label={t('deals.details.industry')} value="Технологии" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">{t('deals.details.location')}</p>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3 text-muted-foreground/60" />
                                                <p className="text-sm font-semibold text-foreground">Москва</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">{t('deals.details.employeeRange')}</p>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3 text-muted-foreground/60" />
                                                <span className="text-sm font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">100K+</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Other tabs placeholders */}
                {activeTab !== 'overview' && (
                    <Card>
                        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                            <p className="text-muted-foreground/40 text-lg font-medium mb-2">{t(`deals.details.tabs.${activeTab}`)}</p>
                            <p className="text-muted-foreground/30 text-sm">{t('deals.noDealsHint')}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
