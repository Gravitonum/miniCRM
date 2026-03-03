import { type ReactElement, useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
    Plus, Search, Filter, LayoutGrid, List, X, ChevronRight,
    Calendar, DollarSign, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/** Статусы этапов воронки */
type StageKey = 'prospecting' | 'qualified' | 'discovery' | 'proposalSent' | 'negotiation' | 'closed';

/** Модель сделки */
interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: StageKey;
    responsible: string;
    deadline?: string;
}

/** Сценарные данные-заглушки */
const MOCK_DEALS: Deal[] = [
    { id: '1', name: 'Лицензия на ПО', amount: 8000, stage: 'proposalSent', responsible: 'Иван Смирнов', deadline: '2024-12-15' },
    { id: '2', name: 'Корпоративное развертывание', amount: 25000, stage: 'negotiation', responsible: 'Мария Иванова', deadline: '2024-11-30' },
    { id: '3', name: 'Сервисный контракт', amount: 5500, stage: 'discovery', responsible: 'Алексей Петров', deadline: '2024-12-20' },
    { id: '4', name: 'Поставка оборудования', amount: 12000, stage: 'qualified', responsible: 'Екатерина Кузнецова' },
    { id: '5', name: 'Консалтинговый проект', amount: 3200, stage: 'prospecting', responsible: 'Дмитрий Волков' },
];

/** Конфигурация этапов (порядок и цвета) */
const STAGES: { key: StageKey; color: string; bg: string; border: string }[] = [
    { key: 'prospecting', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
    { key: 'qualified', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { key: 'discovery', color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { key: 'proposalSent', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { key: 'negotiation', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { key: 'closed', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

/** Форматирование суммы */
function formatAmount(amount: number): string {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
}

/** Пропсы формы новой сделки */
interface NewDealFormProps {
    onClose: () => void;
    onSubmit: (deal: Omit<Deal, 'id'>) => void;
}

/**
 * Слайд-оверная форма создания новой сделки
 * @example <NewDealForm onClose={() => {}} onSubmit={(d) => console.log(d)} />
 */
function NewDealForm({ onClose, onSubmit }: NewDealFormProps): ReactElement {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [stage, setStage] = useState<StageKey>('prospecting');
    const [responsible, setResponsible] = useState('');
    const [deadline, setDeadline] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        firstInputRef.current?.focus();
    }, []);

    /** Валидация полей формы */
    function validate(): boolean {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = t('deals.form.errors.nameRequired');
        if (!amount || isNaN(Number(amount))) newErrors.amount = t('deals.form.errors.amountRequired');
        if (!stage) newErrors.stage = t('deals.form.errors.stageRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /** Отправка формы */
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        // Имитация задержки API
        await new Promise((r) => setTimeout(r, 600));
        onSubmit({ name: name.trim(), amount: Number(amount), stage, responsible: responsible.trim() || 'Не назначен', deadline: deadline || undefined });
        setSubmitting(false);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Затемнённый фон */}
            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Панель формы */}
            <div className="w-full max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Заголовок */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">{t('deals.form.title')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Закрыть"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Поля формы */}
                <form onSubmit={(e) => { void handleSubmit(e); }} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                    {/* Название */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deals.form.name')}</label>
                        <input
                            ref={firstInputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('deals.form.namePlaceholder')}
                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                    </div>

                    {/* Сумма */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deals.form.amount')}</label>
                        <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={t('deals.form.amountPlaceholder')}
                                min="0"
                                className={`w-full pl-9 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${errors.amount ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    {/* Этап воронки */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deals.form.stage')}</label>
                        <select
                            value={stage}
                            onChange={(e) => setStage(e.target.value as StageKey)}
                            className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        >
                            {STAGES.map((s) => (
                                <option key={s.key} value={s.key}>{t(`deals.stages.${s.key}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Ответственный */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deals.form.responsible')}</label>
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={responsible}
                                onChange={(e) => setResponsible(e.target.value)}
                                placeholder={t('deals.form.responsiblePlaceholder')}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Дедлайн */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('deals.form.deadline')}</label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>
                </form>

                {/* Кнопки */}
                <div className="px-6 py-5 border-t border-gray-100 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        {t('deals.form.cancel')}
                    </button>
                    <button
                        onClick={(e) => { void handleSubmit(e as unknown as React.FormEvent); }}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
                    >
                        {submitting ? t('deals.form.submitting') : t('deals.form.submit')}
                    </button>
                </div>
            </div>
        </div>
    );
}

/** Карточка сделки на Kanban-доске */
function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }): ReactElement {
    const isOverdue = deal.deadline ? new Date(deal.deadline) < new Date() : false;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
        >
            <p className="font-semibold text-gray-900 text-sm mb-3 group-hover:text-indigo-700 transition-colors">{deal.name}</p>
            <p className="text-indigo-600 font-bold text-base mb-3">{formatAmount(deal.amount)}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">{deal.responsible.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-gray-500 truncate max-w-[80px]">{deal.responsible}</span>
                </div>
                {deal.deadline && (
                    <span className={`text-xs font-medium flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(deal.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Страница «Сделки» с видами Kanban и Список
 * @example <DealsPage />
 */
export function DealsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [showNewDealForm, setShowNewDealForm] = useState(false);
    const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
    const [search, setSearch] = useState('');

    /** Добавление новой сделки */
    function handleAddDeal(newDeal: Omit<Deal, 'id'>): void {
        const deal: Deal = { ...newDeal, id: String(Date.now()) };
        setDeals((prev) => [deal, ...prev]);
    }

    /** Фильтрация по поиску */
    const filteredDeals = deals.filter((d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.responsible.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Шапка страницы */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{t('deals.title')}</h1>
                        <p className="text-gray-500 mt-1 text-sm">{t('deals.subtitle')}</p>
                    </div>
                    <button
                        id="btn-new-deal"
                        onClick={() => setShowNewDealForm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('deals.add')}
                    </button>
                </div>

                {/* Тулбар: поиск + переключатель вида */}
                <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('deals.search')}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors hidden sm:flex items-center gap-1.5 text-sm">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100 self-end sm:self-auto">
                        <button
                            id="btn-view-kanban"
                            onClick={() => setViewMode('kanban')}
                            title="Доска"
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            id="btn-view-list"
                            onClick={() => setViewMode('list')}
                            title="Список"
                            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Контент: Канбан или Список */}
                {viewMode === 'kanban' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {STAGES.map((stageConfig) => {
                                const stageDeals = filteredDeals.filter((d) => d.stage === stageConfig.key);
                                const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);

                                return (
                                    <div key={stageConfig.key} className="w-64 flex flex-col gap-3">
                                        {/* Заголовок колонки */}
                                        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${stageConfig.bg} border ${stageConfig.border}`}>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${stageConfig.color.replace('text-', 'bg-')}`} />
                                                <span className={`text-xs font-semibold ${stageConfig.color}`}>
                                                    {t(`deals.stages.${stageConfig.key}`)}
                                                </span>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    {stageDeals.length}
                                                </span>
                                            </div>
                                            {totalAmount > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    {formatAmount(totalAmount)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Карточки */}
                                        <div className="flex flex-col gap-2 min-h-[100px]">
                                            {stageDeals.map((deal) => (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    onClick={() => navigate(`/deals/${deal.id}`)}
                                                />
                                            ))}
                                            {stageDeals.length === 0 && (
                                                <div className="border-2 border-dashed border-gray-100 rounded-xl h-16 flex items-center justify-center">
                                                    <span className="text-xs text-gray-300">—</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {filteredDeals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <LayoutGrid className="w-10 h-10 text-gray-200 mb-3" />
                                <p className="font-medium text-gray-400">{t('deals.noDeals')}</p>
                                <p className="text-sm text-gray-300 mt-1">{t('deals.noDealsHint')}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                                        <th className="font-semibold p-4 py-3">{t('deals.table.name')}</th>
                                        <th className="font-semibold p-4 py-3">{t('deals.table.amount')}</th>
                                        <th className="font-semibold p-4 py-3">{t('deals.table.stage')}</th>
                                        <th className="font-semibold p-4 py-3">{t('deals.table.owner')}</th>
                                        <th className="font-semibold p-4 py-3">{t('deals.table.deadline')}</th>
                                        <th className="p-4 py-3 w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDeals.map((deal) => {
                                        const stageConf = STAGES.find((s) => s.key === deal.stage);
                                        const isOverdue = deal.deadline ? new Date(deal.deadline) < new Date() : false;
                                        return (
                                            <tr
                                                key={deal.id}
                                                className="border-b border-gray-50 hover:bg-indigo-50/30 cursor-pointer transition-colors group"
                                                onClick={() => navigate(`/deals/${deal.id}`)}
                                            >
                                                <td className="p-4 font-semibold text-gray-900 text-sm group-hover:text-indigo-700 transition-colors">{deal.name}</td>
                                                <td className="p-4 text-gray-700 font-medium text-sm">{formatAmount(deal.amount)}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${stageConf?.bg ?? 'bg-gray-50'} ${stageConf?.color ?? 'text-gray-600'}`}>
                                                        {t(`deals.stages.${deal.stage}`)}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 text-sm">{deal.responsible}</td>
                                                <td className={`p-4 text-sm font-medium ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {deal.deadline
                                                        ? new Date(deal.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Форма новой сделки */}
            {showNewDealForm && (
                <NewDealForm
                    onClose={() => setShowNewDealForm(false)}
                    onSubmit={handleAddDeal}
                />
            )}
        </DashboardLayout>
    );
}
