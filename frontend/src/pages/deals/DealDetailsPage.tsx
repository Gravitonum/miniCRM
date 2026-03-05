import { type ReactElement, useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft, CheckCircle2, MoreHorizontal, Plus,
    Mail, Phone, MapPin, Building2, Loader2, AlertCircle, Phone as PhoneIcon, Video, FileText, StickyNote, History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { dealsApi, type Deal, type DealProduct } from '../../api/deals';
import { clientsApi, interactionsApi, type ClientCompany, type Interaction, directoriesApi, type Directory } from '../../api/clients';

const INTERACTION_ICONS = {
    call: PhoneIcon,
    meeting: Video,
    email: Mail,
    note: StickyNote,
};

const INTERACTION_COLORS = {
    call: 'text-blue-500 bg-blue-500/10',
    meeting: 'text-violet-500 bg-violet-500/10',
    email: 'text-amber-500 bg-amber-500/10',
    note: 'text-green-500 bg-green-500/10',
};

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
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'notes' | 'history'>('overview');

    const [deal, setDeal] = useState<Deal | null>(null);
    const [company, setCompany] = useState<ClientCompany | null>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [products, setProducts] = useState<DealProduct[]>([]);
    const [directories, setDirectories] = useState<Directory[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [productForm, setProductForm] = useState({ categoryId: '', quantity: 1, price: 0 });
    const [addingProduct, setAddingProduct] = useState(false);

    const [showAddInteraction, setShowAddInteraction] = useState(false);
    const [interactionForm, setInteractionForm] = useState({
        type: 'note' as Interaction['type'],
        description: '',
        interactionDate: new Date().toISOString().slice(0, 16),
    });
    const [addingInteraction, setAddingInteraction] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        setError(null);
        try {
            const [dealData, historyData, productsData, dirs] = await Promise.all([
                dealsApi.getDealById(id),
                interactionsApi.get({ dealId: id }),
                dealsApi.getProducts(id),
                directoriesApi.getAll()
            ]);
            setDeal(dealData);
            setProducts(productsData);
            setDirectories(dirs);
            setInteractions(historyData.sort((a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()));

            if (dealData.clientCompanyId) {
                const compData = await clientsApi.getById(dealData.clientCompanyId);
                setCompany(compData);
            }
        } catch (err) {
            console.error('Failed to load deal details', err);
            setError(t('deals.details.loadError', 'Не удалось загрузить данные сделки'));
        } finally {
            setIsLoading(false);
        }
    }, [id, t]);

    useEffect(() => { void loadData(); }, [loadData]);

    async function handleAddProduct(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !productForm.categoryId) return;
        setAddingProduct(true);
        try {
            await dealsApi.addProduct(id, productForm.categoryId, productForm.quantity, productForm.price);
            setShowAddProduct(false);
            setProductForm({ categoryId: '', quantity: 1, price: 0 });
            void loadData();
        } catch (err) {
            console.error('Failed to add product', err);
        } finally {
            setAddingProduct(false);
        }
    }

    async function handleRemoveProduct(productId: string) {
        if (!confirm('Удалить продукт?')) return;
        try {
            await dealsApi.removeProduct(productId);
            void loadData();
        } catch (err) {
            console.error('Failed to remove product', err);
        }
    }

    async function handleAddInteraction(e: React.FormEvent) {
        e.preventDefault();
        if (!id || !interactionForm.description.trim()) return;
        setAddingInteraction(true);
        try {
            await interactionsApi.create({
                type: interactionForm.type,
                dealId: id,
                clientCompanyId: deal?.clientCompanyId,
                interactionDate: new Date(interactionForm.interactionDate).toISOString(),
                description: interactionForm.description.trim(),
            });
            setShowAddInteraction(false);
            setInteractionForm({ type: 'note', description: '', interactionDate: new Date().toISOString().slice(0, 16) });
            void loadData();
        } catch (err) {
            console.error('Failed to add interaction', err);
        } finally {
            setAddingInteraction(false);
        }
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !deal) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <p className="text-sm text-destructive">{error || t('deals.details.notFound', 'Сделка не найдена')}</p>
                    <Button onClick={() => navigate('/deals')}>{t('deals.details.backToDeals')}</Button>
                </div>
            </DashboardLayout>
        );
    }

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: 'overview', label: t('deals.details.tabs.overview') },
        { key: 'products', label: t('deals.details.tabs.products', 'Продукты') },
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
                    <h1 className="text-2xl font-bold text-foreground">{deal.name}</h1>

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
                                        <FieldBlock label={t('deals.details.fields.opportunityId')} value={deal.id.split('-')[0].toUpperCase()} />
                                        <FieldBlock label={t('deals.details.fields.industry')} value={company?.name || '—'} />
                                        <FieldBlock label={t('deals.details.fields.closeDate')} value={deal.deadline ? new Date(deal.deadline).toLocaleDateString('ru-RU') : '—'} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-4">{t('deals.details.financials')}</h3>
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <FieldBlock label={t('deals.details.fields.expectedRevenue')} value={`${deal.amount.toLocaleString('ru-RU')} ₽`} />
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
                                </CardHeader>
                                <CardContent>
                                    {company ? (
                                        <>
                                            <div className="flex items-center gap-3 mb-5 cursor-pointer group" onClick={() => navigate(`/clients/${company.id}`)}>
                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{company.name}</p>
                                                    <p className="text-xs text-muted-foreground">{company.inn ? `ИНН: ${company.inn}` : 'Отрасль не указана'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">{t('deals.details.location')}</p>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3 text-muted-foreground/60" />
                                                        <p className="text-sm font-semibold text-foreground">{company.address || '—'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-muted-foreground flex items-center justify-center py-6">
                                            Компания не привязана
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Вкладка Продукты (Реальные) */}
                {activeTab === 'products' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">{t('deals.details.tabs.products', 'Продукты')}</CardTitle>
                            <Button size="sm" onClick={() => setShowAddProduct(!showAddProduct)}>
                                <Plus className="w-4 h-4 mr-1 lg:hidden" />
                                <span className="hidden lg:inline">{showAddProduct ? t('clients.form.cancel', 'Отмена') : t('deals.products.add', '+ Добавить продукт')}</span>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {showAddProduct && (
                                <form onSubmit={handleAddProduct} className="mb-6 p-4 border border-border rounded-xl bg-card space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Категория / Название</label>
                                            <select
                                                required
                                                value={productForm.categoryId}
                                                onChange={e => setProductForm(p => ({ ...p, categoryId: e.target.value }))}
                                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                            >
                                                <option value="">Выберите продукт</option>
                                                {directories.filter(d => d.type === 'product_category').map(d => (
                                                    <option key={d.id} value={d.id}>{d.value}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Количество</label>
                                            <input
                                                type="number" min="1" required
                                                value={productForm.quantity}
                                                onChange={e => setProductForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-foreground mb-1">Цена (₽)</label>
                                            <input
                                                type="number" min="0" required
                                                value={productForm.price}
                                                onChange={e => setProductForm(p => ({ ...p, price: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" disabled={addingProduct} className="w-full sm:w-auto">
                                        {addingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                                    </Button>
                                </form>
                            )}

                            {products.length === 0 ? (
                                <div className="text-center text-muted-foreground py-10 text-sm">Нет добавленных продуктов</div>
                            ) : (
                                <div className="border border-border rounded-xl overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 pb-2">{t('deals.products.table.name', 'Наименование')}</th>
                                                <th className="px-4 py-3 pb-2">{t('deals.products.table.price', 'Цена')}</th>
                                                <th className="px-4 py-3 pb-2">{t('deals.products.table.quantity', 'Кол-во')}</th>
                                                <th className="px-4 py-3 pb-2">{t('deals.products.table.total', 'Сумма')}</th>
                                                <th className="px-4 py-3 pb-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {products.map(p => (
                                                <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-medium text-foreground">{p.productCategoryName || '—'}</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{p.unitPrice.toLocaleString()} ₽</td>
                                                    <td className="px-4 py-3 text-sm text-foreground">{p.quantityAmount} шт.</td>
                                                    <td className="px-4 py-3 text-sm font-bold text-primary">{(p.quantityAmount * p.unitPrice).toLocaleString()} ₽</td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <button onClick={() => handleRemoveProduct(p.id)} className="text-destructive text-xs hover:underline">Удалить</button>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/20">
                                                <td colSpan={3} className="px-4 py-3 text-sm font-bold text-right text-foreground">Итого:</td>
                                                <td colSpan={2} className="px-4 py-3 text-sm font-bold text-primary">{products.reduce((acc, p) => acc + (p.quantityAmount * p.unitPrice), 0).toLocaleString()} ₽</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Вкладка История (Взаимодействия) */}
                {activeTab === 'history' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">{t('deals.details.tabs.history')}</CardTitle>
                            <Button size="sm" variant="outline" onClick={() => setShowAddInteraction(!showAddInteraction)}>
                                <Plus className="w-4 h-4 mr-1" />
                                {showAddInteraction ? t('clients.form.cancel', 'Отмена') : 'Оставить заметку'}
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {showAddInteraction && (
                                <form onSubmit={handleAddInteraction} className="mb-6 space-y-3 p-4 border border-border bg-card rounded-xl">
                                    <div className="flex gap-2">
                                        {(['call', 'meeting', 'email', 'note'] as Interaction['type'][]).map(type => {
                                            const Icon = INTERACTION_ICONS[type] || FileText;
                                            return (
                                                <button
                                                    key={type} type="button" onClick={() => setInteractionForm(prev => ({ ...prev, type }))}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${interactionForm.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background hover:bg-accent'}`}
                                                >
                                                    <Icon className="w-3.5 h-3.5" />
                                                    {t(`clients.history.types.${type}`)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div>
                                        <input
                                            type="datetime-local" value={interactionForm.interactionDate}
                                            onChange={e => setInteractionForm(p => ({ ...p, interactionDate: e.target.value }))}
                                            className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
                                        />
                                    </div>
                                    <div>
                                        <textarea
                                            value={interactionForm.description}
                                            onChange={e => setInteractionForm(p => ({ ...p, description: e.target.value }))}
                                            placeholder="Что произошло..." rows={3}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm resize-none"
                                            autoFocus
                                        />
                                    </div>
                                    <Button type="submit" disabled={addingInteraction}>
                                        {addingInteraction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Добавить'}
                                    </Button>
                                </form>
                            )}
                            {interactions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <History className="w-8 h-8 text-muted-foreground/40 mb-2" />
                                    <p className="text-sm font-medium text-muted-foreground">Нет событий в истории</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {interactions.map(interaction => {
                                        const date = new Date(interaction.interactionDate);
                                        const Icon = INTERACTION_ICONS[interaction.type] || FileText;
                                        const color = INTERACTION_COLORS[interaction.type] || 'text-muted-foreground bg-muted';

                                        return (
                                            <div key={interaction.id} className="flex gap-4">
                                                <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center mt-1 ${color}`}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1 bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="font-semibold text-sm text-foreground capitalize">
                                                            {t(`clients.history.types.${interaction.type}`)}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-md">
                                                            {date.toLocaleDateString('ru-RU')} в {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                                        {interaction.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
