import { type ReactElement, useState } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, CheckCircle2, MoreHorizontal, Plus,
    Mail, Phone, MapPin, Building2, Users
} from 'lucide-react';

/** Тип этапа сделки */
type StageStatus = 'completed' | 'current' | 'pending';

/** Описание этапа */
interface Stage {
    key: string;
    labelKey: string;
    status: StageStatus;
}

/** Пример данных сделки */
const MOCK_STAGES: Stage[] = [
    { key: 'prospecting', labelKey: 'deals.stages.prospecting', status: 'completed' },
    { key: 'qualified', labelKey: 'deals.stages.qualified', status: 'completed' },
    { key: 'discovery', labelKey: 'deals.stages.discovery', status: 'completed' },
    { key: 'proposalSent', labelKey: 'deals.stages.proposalSent', status: 'current' },
    { key: 'negotiation', labelKey: 'deals.stages.negotiation', status: 'pending' },
    { key: 'closed', labelKey: 'deals.stages.closed', status: 'pending' },
];

/**
 * Страница подробной карточки сделки
 * @example <DealDetailsPage />
 */
export function DealDetailsPage(): ReactElement {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'notes' | 'history'>('overview');

    // Мок-данные (в будущем — API-запрос по id)
    const dealName = 'SaaS Collaboration Tool Deal';
    void id; // используется при реальном API

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: 'overview', label: t('deals.details.tabs.overview') },
        { key: 'tasks', label: t('deals.details.tabs.tasks') },
        { key: 'notes', label: t('deals.details.tabs.notes') },
        { key: 'history', label: t('deals.details.tabs.history') },
    ];

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">

                {/* Навигация назад */}
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        {t('deals.details.backToDeals')}
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">{dealName}</h1>

                    {/* Вкладки */}
                    <div className="flex gap-1 mt-5 border-b border-gray-200">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Контент вкладки Обзор */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* Левая колонка (2/3) */}
                        <div className="xl:col-span-2 flex flex-col gap-6">

                            {/* Карточка этапов */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-base font-bold text-gray-900">{t('deals.details.stages')}</h2>
                                    <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm text-gray-700 flex items-center gap-1.5">
                                        {t('deals.details.moveToNextStage')}
                                    </button>
                                </div>

                                {/* Прогресс этапов */}
                                <div className="relative">
                                    {/* Линия */}
                                    <div className="absolute left-5 right-5 top-4 h-0.5 bg-gray-100 -z-10" />
                                    <div className="flex items-start justify-between gap-2">
                                        {MOCK_STAGES.map((stage) => (
                                            <div key={stage.key} className="flex flex-col items-center gap-2 flex-1">
                                                {/* Индикатор */}
                                                <div className="bg-white px-1">
                                                    {stage.status === 'completed' && (
                                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-sm">
                                                            <CheckCircle2 className="w-5 h-5 text-white" />
                                                        </div>
                                                    )}
                                                    {stage.status === 'current' && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-dashed bg-white flex items-center justify-center">
                                                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                                        </div>
                                                    )}
                                                    {stage.status === 'pending' && (
                                                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Название */}
                                                <span className={`text-xs font-medium text-center leading-tight ${stage.status === 'pending' ? 'text-gray-300' :
                                                        stage.status === 'current' ? 'text-indigo-600' :
                                                            'text-gray-700'
                                                    }`}>
                                                    {t(stage.labelKey)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Детали сделки */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-base font-bold text-gray-900 mb-5">{t('deals.details.opportunityDetails')}</h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <FieldBlock label={t('deals.details.fields.opportunityId')} value="OP-001" />
                                    <FieldBlock label={t('deals.details.fields.industry')} value="Технологии / ПО" />
                                    <FieldBlock label={t('deals.details.fields.closeDate')} value="05.12.2024" />
                                    <FieldBlock label={t('deals.details.fields.probability')} value="70%" />
                                </div>

                                <h2 className="text-base font-bold text-gray-900 mb-5">{t('deals.details.financials')}</h2>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <FieldBlock label={t('deals.details.fields.expectedRevenue')} value="8 000 ₽" />
                                    <FieldBlock label={t('deals.details.fields.discount')} value="10%" />
                                    <FieldBlock label={t('deals.details.fields.subscriptionDetails')} value="80 ₽/пользователь/год" />
                                    <FieldBlock label={t('deals.details.fields.competitorPricing')} value="85 ₽/пользователь/год" />
                                </div>
                            </div>
                        </div>

                        {/* Правая боковая панель (1/3) */}
                        <div className="flex flex-col gap-4">

                            {/* Контакты */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                                        {t('deals.details.contacts')}
                                        <button className="text-gray-400 hover:text-indigo-600 transition-colors">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </h3>
                                    <button className="text-gray-400 hover:text-gray-700">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Карточка контакта */}
                                <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-indigo-50 py-1.5 px-4 text-center text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                                        {t('deals.details.primaryContact')}
                                    </div>
                                    <div className="p-4 bg-white relative">
                                        <button className="absolute right-3 top-3 text-gray-300 hover:text-gray-600 transition-colors">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 overflow-hidden flex-shrink-0">
                                                <img src="https://i.pravatar.cc/150?img=1" alt="avatar" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Мария Иванова</p>
                                                <p className="text-xs text-gray-500">Менеджер по продуктам</p>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                <span>maria@example.com</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                <span>+7 (495) 555-0112</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Компания */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base font-bold text-gray-900">{t('deals.details.company')}</h3>
                                    <button className="text-gray-400 hover:text-gray-700">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                        <Building2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 text-sm">Code Sphere</p>
                                        <p className="text-xs text-gray-500">Технологии</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">{t('deals.details.industry')}</p>
                                        <p className="text-sm font-medium text-gray-800">Технологии</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">{t('deals.details.location')}</p>
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-gray-400" />
                                            <p className="text-sm font-medium text-gray-800">Москва</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-0.5">{t('deals.details.employeeRange')}</p>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">100K+</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Другие вкладки: заглушки */}
                {activeTab !== 'overview' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                        <p className="text-gray-300 text-lg font-medium mb-2">{t(`deals.details.tabs.${activeTab}`)}</p>
                        <p className="text-gray-300 text-sm">{t('deals.noDealsHint')}</p>
                    </div>
                )}

            </div>
        </DashboardLayout>
    );
}

/**
 * Блок поля с меткой и значением
 * @example <FieldBlock label="Отрасль" value="Технологии" />
 */
function FieldBlock({ label, value }: { label: string; value: string }): ReactElement {
    return (
        <div>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}
