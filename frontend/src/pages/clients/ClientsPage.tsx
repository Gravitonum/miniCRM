/**
 * ClientsPage — список компаний-клиентов с поиском и фильтрами.
 *
 * @example
 * Доступна по роуту /clients
 */
import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, Building2, Globe, Filter, X,
    ChevronRight, AlertCircle, Loader2, RefreshCw, FileDown
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { clientsApi, directoriesApi, type ClientCompany, type Directory } from '../../api/clients';
import { exportToExcel } from '../../lib/exportUtils';
import { konturFocusApi } from '../../api/konturFocus';

// ─── Sub-components ──────────────────────────────────────────

/** Форма создания/редактирования клиента */
interface ClientFormProps {
    onSuccess: () => void;
    onCancel: () => void;
    directories: {
        legalForms: Directory[];
        relationTypes: Directory[];
        leadSources: Directory[];
    };
}

function ClientForm({ onSuccess, onCancel, directories }: ClientFormProps): ReactElement {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        name: '',
        inn: '',
        legalFormId: '',
        relationTypeId: '',
        sourceId: '',
        address: '',
        website: '',
    });
    const [saving, setSaving] = useState(false);
    const [loadingFocus, setLoadingFocus] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Обработчик создания клиента
     */
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!form.name.trim()) {
            setError(t('clients.form.errors.nameRequired', 'Введите название компании'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await clientsApi.create({
                name: form.name.trim(),
                inn: form.inn.trim() || undefined,
                legalFormId: form.legalFormId || undefined,
                relationTypeId: form.relationTypeId || undefined,
                sourceId: form.sourceId || undefined,
                address: form.address.trim() || undefined,
                website: form.website.trim() || undefined,
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to create client:', err);
            setError(t('clients.form.errors.createFailed', 'Ошибка при создании клиента'));
        } finally {
            setSaving(false);
        }
    }

    /**
     * Заполнить данные по ИНН через API Контур-Фокуса
     */
    async function handleAutofillInn() {
        const inn = form.inn.trim();
        if (!inn) {
            setError(t('clients.form.errors.innRequired', 'Для автозаполнения введите ИНН'));
            return;
        }

        setLoadingFocus(true);
        setError(null);

        try {
            const company = await konturFocusApi.fetchCompanyByInn(inn);
            if (!company) {
                setError(t('clients.form.errors.companyNotFound', 'Компания с таким ИНН не найдена'));
                return;
            }

            setForm(prev => ({
                ...prev,
                name: company.name || prev.name,
                address: company.address || prev.address,
            }));
            
            // Если есть неактивный статус, предупреждаем
            if (company.status && company.status.includes('Ликвидирован')) {
                 setError(`Внимание: статус компании - ${company.status}`);
            }

        } catch (err: any) {
            console.error('Failed to generic fetch kontur.focus:', err);
            setError(t('clients.form.errors.focusFailed', 'Не удалось получить данные из Контур-Фокус. Проверьте ключ API или ИНН.'));
        } finally {
            setLoadingFocus(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Название — обязательное */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('clients.form.name', 'Название')} <span className="text-destructive">*</span>
                </label>
                <input
                    id="client-name"
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder={t('clients.form.namePlaceholder', 'ООО «Ромашка»')}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    autoFocus
                />
            </div>

            {/* ИНН */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('clients.form.inn', 'ИНН')}{' '}
                    <span className="text-xs text-muted-foreground ml-1">(Контур.Фокус)</span>
                </label>
                <div className="flex gap-2">
                    <input
                        id="client-inn"
                        type="text"
                        value={form.inn}
                        onChange={e => setForm(p => ({ ...p, inn: e.target.value }))}
                        placeholder="7712345678"
                        className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                    <button
                        type="button"
                        onClick={handleAutofillInn}
                        disabled={loadingFocus || !form.inn.trim()}
                        className="whitespace-nowrap px-3 py-2 rounded-lg border border-input bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {loadingFocus && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Заполнить
                    </button>
                </div>
            </div>

            {/* ОПФ + Тип отношений */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('clients.form.legalForm', 'ОПФ')}
                    </label>
                    <select
                        id="client-legal-form"
                        value={form.legalFormId}
                        onChange={e => setForm(p => ({ ...p, legalFormId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    >
                        <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                        {directories.legalForms.map(d => (
                            <option key={d.id} value={d.id}>{d.value}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('clients.form.relationType', 'Тип отношений')}
                    </label>
                    <select
                        id="client-relation-type"
                        value={form.relationTypeId}
                        onChange={e => setForm(p => ({ ...p, relationTypeId: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    >
                        <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                        {directories.relationTypes.map(d => (
                            <option key={d.id} value={d.id}>{d.value}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Источник лида */}
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('clients.form.source', 'Источник лида')}
                </label>
                <select
                    id="client-source"
                    value={form.sourceId}
                    onChange={e => setForm(p => ({ ...p, sourceId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                >
                    <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                    {directories.leadSources.map(d => (
                        <option key={d.id} value={d.id}>{d.value}</option>
                    ))}
                </select>
            </div>

            {/* Адрес + Сайт */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('clients.form.address', 'Адрес')}
                    </label>
                    <input
                        id="client-address"
                        type="text"
                        value={form.address}
                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                        placeholder={t('clients.form.addressPlaceholder', 'г. Москва, ул. Ленина, 1')}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('clients.form.website', 'Сайт')}
                    </label>
                    <input
                        id="client-website"
                        type="text"
                        value={form.website}
                        onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                        placeholder="https://example.com"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                    {t('clients.form.cancel', 'Отмена')}
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    id="client-form-submit"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('clients.form.saving', 'Сохранение...') : t('clients.form.submit', 'Создать клиента')}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────

/** Страница списка клиентов */
export function ClientsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [clients, setClients] = useState<ClientCompany[]>([]);
    const [directories, setDirectories] = useState({
        legalForms: [] as Directory[],
        relationTypes: [] as Directory[],
        leadSources: [] as Directory[],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Filter state
    const [search, setSearch] = useState('');
    const [filterLegalForm, setFilterLegalForm] = useState('');
    const [filterRelationType, setFilterRelationType] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showAddModal, setShowAddModal] = useState(false);

    /**
     * Загрузить клиентов и справочники
     */
    const loadData = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const [allClients, allDirs] = await Promise.all([
                clientsApi.getAll(),
                directoriesApi.getAll(),
            ]);
            setClients(allClients);
            setDirectories({
                legalForms: allDirs.filter(d => d.type === 'legal_form'),
                relationTypes: allDirs.filter(d => d.type === 'client_relation'),
                leadSources: allDirs.filter(d => d.type === 'lead_source'),
            });
        } catch (err) {
            console.error('Failed to load clients:', err);
            setError(t('clients.errors.loadFailed', 'Не удалось загрузить клиентов'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { loadData(); }, [loadData]);

    /**
     * Применить фильтры и поиск к списку клиентов
     */
    const filtered = clients.filter(c => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || c.name.toLowerCase().includes(q)
            || (c.inn || '').includes(q);
        const matchLegal = !filterLegalForm || c.legalFormId === filterLegalForm;
        const matchRelation = !filterRelationType || c.relationTypeId === filterRelationType;
        const matchSource = !filterSource || c.sourceId === filterSource;
        return matchSearch && matchLegal && matchRelation && matchSource;
    });

    /**
     * Получить значение справочника по ID
     */
    function dirValue(dirs: Directory[], id?: string): string {
        return dirs.find(d => d.id === id)?.value || '—';
    }

    const hasActiveFilters = filterLegalForm || filterRelationType || filterSource;

    function clearFilters(): void {
        setFilterLegalForm('');
        setFilterRelationType('');
        setFilterSource('');
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            {t('clients.title', 'Клиенты')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('clients.subtitle', 'Управление базой компаний-клиентов')}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                            onClick={() => exportToExcel(filtered, 'clients_export')}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors shadow-sm"
                        >
                            <FileDown className="w-4 h-4" />
                            Экспорт
                        </button>
                        <button
                            id="add-client-btn"
                            onClick={() => setShowAddModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            {t('clients.add', 'Добавить клиента')}
                        </button>
                    </div>
                </div>

                {/* ── Search & Filters ── */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            id="clients-search"
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('clients.search', 'Поиск по названию или ИНН...')}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                    </div>
                    <button
                        id="clients-filter-btn"
                        onClick={() => setShowFilters(v => !v)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${hasActiveFilters
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-foreground hover:bg-accent'
                            }`}
                    >
                        <Filter className="w-4 h-4" />
                        {t('clients.filters', 'Фильтры')}
                        {hasActiveFilters && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                                {[filterLegalForm, filterRelationType, filterSource].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={loadData}
                        title={t('clients.refresh', 'Обновить')}
                        className="p-2.5 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Filters Panel ── */}
                {showFilters && (
                    <div className="p-4 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('clients.filterTitle', 'Фильтрация')}
                            </h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                    {t('clients.clearFilters', 'Сбросить')}
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('clients.form.legalForm', 'ОПФ')}
                                </label>
                                <select
                                    value={filterLegalForm}
                                    onChange={e => setFilterLegalForm(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                                >
                                    <option value="">{t('clients.all', 'Все')}</option>
                                    {directories.legalForms.map(d => (
                                        <option key={d.id} value={d.id}>{d.value}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('clients.form.relationType', 'Тип отношений')}
                                </label>
                                <select
                                    value={filterRelationType}
                                    onChange={e => setFilterRelationType(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                                >
                                    <option value="">{t('clients.all', 'Все')}</option>
                                    {directories.relationTypes.map(d => (
                                        <option key={d.id} value={d.id}>{d.value}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('clients.form.source', 'Источник')}
                                </label>
                                <select
                                    value={filterSource}
                                    onChange={e => setFilterSource(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                                >
                                    <option value="">{t('clients.all', 'Все')}</option>
                                    {directories.leadSources.map(d => (
                                        <option key={d.id} value={d.id}>{d.value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{t('clients.loading', 'Загрузка...')}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertCircle className="w-7 h-7 text-destructive" />
                        </div>
                        <p className="text-sm text-destructive">{error}</p>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            {t('clients.retry', 'Попробовать снова')}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Building2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-base font-medium text-foreground">
                            {search || hasActiveFilters
                                ? t('clients.noResults', 'Ничего не найдено')
                                : t('clients.empty', 'Клиентов пока нет')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {search || hasActiveFilters
                                ? t('clients.noResultsHint', 'Попробуйте изменить параметры поиска')
                                : t('clients.emptyHint', 'Нажмите «+ Добавить клиента», чтобы начать')}
                        </p>
                    </div>
                ) : (
                    /* Таблица клиентов */
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-[1fr_120px_160px_160px_40px] gap-4 px-6 py-3 bg-muted/40 border-b border-border">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('clients.table.name', 'Название')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('clients.table.inn', 'ИНН')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('clients.table.legalForm', 'ОПФ')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('clients.table.relationType', 'Тип отношений')}
                            </span>
                            <span />
                        </div>

                        {/* Table Rows */}
                        <div className="divide-y divide-border">
                            {filtered.map(client => (
                                <div
                                    key={client.id}
                                    onClick={() => navigate(`/clients/${client.id}`)}
                                    className="grid grid-cols-1 sm:grid-cols-[1fr_120px_160px_160px_40px] gap-2 sm:gap-4 px-6 py-4 hover:bg-accent/40 transition-colors cursor-pointer group"
                                >
                                    {/* Name & details */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-9 h-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-4.5 h-4.5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {client.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {client.address && (
                                                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                        {client.address}
                                                    </span>
                                                )}
                                                {client.website && (
                                                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                                                        <Globe className="w-3 h-3" />
                                                        {client.website.replace(/^https?:\/\//, '')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* INN */}
                                    <span className="text-sm text-muted-foreground self-center font-mono">
                                        {client.inn || '—'}
                                    </span>

                                    {/* Legal Form */}
                                    <span className="text-sm text-foreground self-center">
                                        {dirValue(directories.legalForms, client.legalFormId)}
                                    </span>

                                    {/* Relation Type */}
                                    <span className="text-sm text-foreground self-center">
                                        {dirValue(directories.relationTypes, client.relationTypeId)}
                                    </span>

                                    {/* Arrow */}
                                    <div className="hidden sm:flex items-center justify-end">
                                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-muted/20 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                {t('clients.total', 'Показано')}: <span className="font-semibold text-foreground">{filtered.length}</span>
                                {filtered.length !== clients.length && (
                                    <span className="ml-1 text-muted-foreground">
                                        {t('clients.outOf', 'из')} {clients.length}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Client Modal ── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">
                                {t('clients.form.title', 'Новый клиент')}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="!p-4">
                            <ClientForm
                                directories={directories}
                                onSuccess={() => {
                                    setShowAddModal(false);
                                    loadData();
                                }}
                                onCancel={() => setShowAddModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
