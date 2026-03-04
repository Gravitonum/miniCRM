/**
 * DealsPage — страница сделок с видами Kanban и Список.
 * Использует shadcn/ui: Dialog, Select, Badge, Button, Input, Card.
 *
 * @example
 * <DealsPage />
 */
import { type ReactElement, useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
    Plus, Filter, LayoutGrid, List, ChevronRight,
    Calendar, Banknote, User, Briefcase, Layers, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dealsApi, type Deal } from '../../api/deals';
import { clientsApi, type ClientCompany } from '../../api/clients';
import { getAppUser } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge, type BadgeProps } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogFooter,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { cn } from '../../lib/utils';

/** Статусы этапов воронки */
type StageKey = 'prospecting' | 'qualified' | 'discovery' | 'proposalSent' | 'negotiation' | 'closed';

/** Config of stages */
const STAGES: { key: StageKey; badge: BadgeProps['variant'] }[] = [
    { key: 'prospecting', badge: 'slate' },
    { key: 'qualified', badge: 'blue' },
    { key: 'discovery', badge: 'violet' },
    { key: 'proposalSent', badge: 'amber' },
    { key: 'negotiation', badge: 'orange' },
    { key: 'closed', badge: 'emerald' },
];

const STAGE_KANBAN_COLORS: Record<StageKey, { header: string; dot: string }> = {
    prospecting: { header: 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800', dot: 'bg-slate-400' },
    qualified: { header: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', dot: 'bg-blue-500' },
    discovery: { header: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800', dot: 'bg-violet-500' },
    proposalSent: { header: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', dot: 'bg-amber-500' },
    negotiation: { header: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', dot: 'bg-orange-500' },
    closed: { header: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', dot: 'bg-emerald-500' },
};

/** Форматирование суммы в рублях */
function formatAmount(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(amount);
}

interface NewDealFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (deal: Omit<Deal, 'id' | 'clientCompanyName'>) => void;
    managers: { username: string; id: string }[];
    clients: ClientCompany[];
}

/**
 * Модальная форма создания новой сделки (Dialog).
 */
function NewDealForm({ open, onClose, onSubmit, managers, clients }: NewDealFormProps): ReactElement {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [stage, setStage] = useState<StageKey>('prospecting');
    const [responsible, setResponsible] = useState('');
    const [deadline, setDeadline] = useState('');
    const [clientCompanyId, setClientCompanyId] = useState<string>('none');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [open]);

    /** Сброс формы при закрытии */
    function handleClose() {
        setName(''); setAmount(''); setStage('prospecting');
        setResponsible(''); setDeadline(''); setClientCompanyId('none'); setErrors({});
        onClose();
    }

    /** Валидация полей */
    function validate(): boolean {
        const newErrors: Record<string, string> = {};
        if (!name.trim()) newErrors.name = t('deals.form.errors.nameRequired');
        if (!amount || isNaN(Number(amount))) newErrors.amount = t('deals.form.errors.amountRequired');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    /** Отправка формы */
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        await new Promise((r) => setTimeout(r, 400));
        onSubmit({
            name: name.trim(),
            amount: Number(amount),
            stage,
            responsible: responsible.trim() || 'Не назначен',
            deadline: deadline || undefined,
            clientCompanyId: clientCompanyId !== 'none' ? clientCompanyId : undefined,
        });
        setSubmitting(false);
        handleClose();
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="max-w-md sm:max-w-xl overflow-y-auto max-h-[90vh] shadow-2xl border-border/50 !p-4">
                {/* Header с градиентом */}
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-border/50 -mx-4 -mt-4 px-4 pt-4 pb-4 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <Briefcase className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {t('deals.form.title')}
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                            Заполните поля ниже, чтобы добавить сделку
                        </p>
                    </div>
                </div>

                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
                    {/* Название */}
                    <div className="space-y-2">
                        <Label htmlFor="deal-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.name')}</Label>
                        <div className="relative flex items-center">
                            <Briefcase className="w-5 h-5 absolute left-4 text-muted-foreground/50 transition-colors peer-focus:text-primary pointer-events-none" />
                            <Input
                                ref={firstInputRef}
                                id="deal-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('deals.form.namePlaceholder')}
                                hasError={!!errors.name}
                                className="bg-background peer h-[56px] rounded-2xl"
                                style={{ paddingLeft: '3.2rem' }}
                            />
                        </div>
                        {errors.name && <p className="text-xs text-destructive font-medium">{errors.name}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Сумма */}
                        <div className="space-y-2">
                            <Label htmlFor="deal-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.amount')}</Label>
                            <div className="relative flex items-center">
                                <Banknote className="w-5 h-5 absolute left-4 text-muted-foreground/50 transition-colors peer-focus:text-primary pointer-events-none" />
                                <Input
                                    id="deal-amount"
                                    type="text"
                                    value={amount ? new Intl.NumberFormat('ru-RU').format(Number(amount)) : ''}
                                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
                                    placeholder={t('deals.form.amountPlaceholder')}
                                    hasError={!!errors.amount}
                                    className="bg-background font-medium peer h-[56px] rounded-2xl"
                                    style={{ paddingLeft: '3.2rem' }}
                                />
                            </div>
                            {errors.amount && <p className="text-xs text-destructive font-medium">{errors.amount}</p>}
                        </div>

                        {/* Этап */}
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.stage')}</Label>
                            <Select value={stage} onValueChange={(v) => setStage(v as StageKey)}>
                                <SelectTrigger className="bg-background transition-colors h-[56px] px-5 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-2xl w-full">
                                    <div className="flex items-center gap-3">
                                        <Layers className="w-5 h-5 text-muted-foreground/50" />
                                        <SelectValue />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="border-border/50">
                                    {STAGES.map((s) => (
                                        <SelectItem key={s.key} value={s.key} className="cursor-pointer">
                                            {t(`deals.stages.${s.key}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deal-client" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.client')}</Label>
                        <Select value={clientCompanyId} onValueChange={(v) => setClientCompanyId(v)}>
                            <SelectTrigger id="deal-client" className="bg-background transition-colors h-[56px] px-5 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-2xl w-full">
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-muted-foreground/50" />
                                    <SelectValue placeholder={t('deals.form.clientPlaceholder', 'Выберите компанию клиента')} />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="border-border/50 max-h-[250px]">
                                <SelectItem value="none" className="cursor-pointer text-muted-foreground italic">
                                    {t('deals.form.noClient', 'Без привязки к компании')}
                                </SelectItem>
                                {clients.map((c) => (
                                    <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                                        {c.name} {c.inn ? `(ИНН: ${c.inn})` : ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Ответственный */}
                        <div className="space-y-2">
                            <Label htmlFor="deal-responsible" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.responsible')}</Label>
                            <Select value={responsible} onValueChange={(v) => setResponsible(v)}>
                                <SelectTrigger id="deal-responsible" className="bg-background transition-colors h-[56px] px-5 border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/20 rounded-2xl w-full">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-muted-foreground/50" />
                                        <SelectValue placeholder={t('deals.form.responsiblePlaceholder')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="border-border/50">
                                    {managers.map((m) => (
                                        <SelectItem key={m.username} value={m.username} className="cursor-pointer">
                                            {m.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Дедлайн */}
                        <div className="space-y-2">
                            <Label htmlFor="deal-deadline" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('deals.form.deadline')}</Label>
                            <div className="relative flex items-center">
                                <Calendar className="w-5 h-5 absolute left-4 text-muted-foreground/50 transition-colors peer-focus:text-primary pointer-events-none" />
                                <Input
                                    id="deal-deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="bg-background peer h-[56px] rounded-2xl"
                                    style={{ paddingLeft: '3.2rem' }}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-6 border-t border-border/50 gap-3">
                        <Button type="button" variant="outline" onClick={handleClose} className="flex-1 py-6 border-border/60 transition-colors text-base font-medium rounded-xl">
                            {t('deals.form.cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1 py-6 shadow-md hover:shadow-lg transition-all text-base font-medium rounded-xl">
                            {submitting ? t('deals.form.submitting') : t('deals.form.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** Карточка сделки на Kanban-доске */
function DealCard({ deal, onClick, onDragStart }: { deal: Deal; onClick: () => void; onDragStart?: (e: React.DragEvent) => void }): ReactElement {
    const { t } = useTranslation();
    const isOverdue = deal.deadline ? new Date(deal.deadline) < new Date() : false;
    const stageConf = STAGES.find((s) => s.key === deal.stage);

    return (
        <div
            onClick={onClick}
            draggable={!!onDragStart}
            onDragStart={onDragStart}
            className="bg-card rounded-xl border border-border !p-5 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group flex flex-col gap-3.5 overflow-hidden relative min-w-0"
        >
            <div className="flex flex-col min-w-0 gap-1">
                <p className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors line-clamp-2 leading-snug" title={deal.name}>
                    {deal.name}
                </p>
                <p className="text-primary font-bold text-base truncate">{formatAmount(deal.amount)}</p>
            </div>

            <div className="flex items-center justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">{deal.responsible.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate" title={deal.responsible}>{deal.responsible}</span>
                </div>
                {deal.deadline && (
                    <span className={cn('text-xs font-medium flex items-center gap-1 shrink-0', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                        <Calendar className="w-3 h-3" />
                        {new Date(deal.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>

            {stageConf && (
                <div className="pt-3.5 px-2 border-t border-border flex items-center overflow-hidden">
                    <Badge variant={stageConf.badge} className="truncate max-w-full" title={t(`deals.stages.${deal.stage}`)}>
                        <span className="truncate">{t(`deals.stages.${deal.stage}`)}</span>
                    </Badge>
                </div>
            )}
        </div>
    );
}

/**
 * Страница «Сделки» с видами Kanban и Список.
 */
export function DealsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [showNewDealForm, setShowNewDealForm] = useState(false);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [clients, setClients] = useState<ClientCompany[]>([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [managers, setManagers] = useState<{ username: string; id: string }[]>([]);

    // State for Confirm Dialog on Won/Lost
    const [confirmStage, setConfirmStage] = useState<{ dealId: string, oldStage: StageKey, newStage: StageKey } | null>(null);
    const [confirmComment, setConfirmComment] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        setIsLoading(true);

        async function fetchData() {
            try {
                // Fetch deals & clients
                const [dealsData, clientsData] = await Promise.all([
                    dealsApi.getDeals(),
                    clientsApi.getAll()
                ]);
                setDeals(dealsData as Deal[]);
                setClients(clientsData);

                // Fetch managers (users in same org)
                const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user');
                if (username) {
                    const appUserResult = await getAppUser(username);
                    if (appUserResult.success && appUserResult.user?.orgCode) {
                        const orgUsers = await dealsApi.getOrgUsers(appUserResult.user.orgCode);
                        setManagers(orgUsers);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch DealsPage data', err);
            } finally {
                setIsLoading(false);
            }
        }

        void fetchData();
    }, []);

    /** Добавление новой сделки */
    async function handleAddDeal(newDeal: Omit<Deal, 'id' | 'clientCompanyName'>): Promise<void> {
        try {
            const savedDeal = await dealsApi.createDeal(newDeal);
            setDeals((prev) => [savedDeal as Deal, ...prev]);
        } catch (error) {
            console.error('Failed to save deal', error);
        }
    }

    const filteredDeals = deals.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.responsible.toLowerCase().includes(search.toLowerCase())
    );

    /** Drag-and-Drop handlers */
    function handleDragStart(e: React.DragEvent, dealId: string) {
        e.dataTransfer.setData('dealId', dealId);
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    async function handleDrop(e: React.DragEvent, newStage: StageKey) {
        e.preventDefault();
        const dealId = e.dataTransfer.getData('dealId');
        if (!dealId) return;

        const deal = deals.find((d) => d.id === dealId);
        if (!deal || deal.stage === newStage) return;

        // Если переставили в closed (или если бы были этапы won/lost), запрашиваем подтверждение
        // В нашем конфиге STAGES закрытым считается 'closed'
        if (newStage === 'closed') {
            setConfirmStage({ dealId, oldStage: deal.stage as StageKey, newStage });
            setConfirmComment('');
            return;
        }

        // Optimistic update
        const oldStage = deal.stage;
        setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

        try {
            await dealsApi.updateDeal(dealId, { stage: newStage });
        } catch (error) {
            console.error('Failed to move deal', error);
            // Revert on error
            setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: oldStage } : d)));
        }
    }

    async function handleConfirmStageChange() {
        if (!confirmStage) return;
        setIsConfirming(true);
        const { dealId, oldStage, newStage } = confirmStage;

        // Optimistic update
        setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: newStage } : d)));

        try {
            // В будущем тут можно сохранять комментарий confirmComment в ленту взаимодействий сделки
            await dealsApi.updateDeal(dealId, { stage: newStage });
        } catch (error) {
            console.error('Failed to move deal', error);
            // Revert on error
            setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, stage: oldStage } : d)));
        } finally {
            setIsConfirming(false);
            setConfirmStage(null);
        }
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                {/* Page header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{t('deals.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-sm">{t('deals.subtitle')}</p>
                    </div>
                    <Button
                        id="btn-new-deal"
                        onClick={() => setShowNewDealForm(true)}
                        className="shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('deals.add')}
                    </Button>
                </div>

                {/* Toolbar */}
                <Card className="!px-4 !py-3 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6 rounded-xl">
                    <div className="flex items-center gap-3 w-full sm:flex-1 min-w-0">
                        <div className="relative flex-1 sm:max-w-md">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('deals.search')}
                                className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all truncate"
                            />
                        </div>
                        <button className="p-2 shrink-0 text-muted-foreground hover:bg-accent rounded-lg border border-border transition-colors hidden sm:flex items-center gap-1.5 text-sm">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>

                    {/* View switcher */}
                    <div className="flex items-center gap-0.5 bg-muted p-1 rounded-lg self-end sm:self-auto">
                        <button
                            id="btn-view-kanban"
                            onClick={() => setViewMode('kanban')}
                            title="Доска"
                            className={cn(
                                'p-2 rounded-md transition-all',
                                viewMode === 'kanban'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            id="btn-view-list"
                            onClick={() => setViewMode('list')}
                            title="Список"
                            className={cn(
                                'p-2 rounded-md transition-all',
                                viewMode === 'list'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </Card>

                {/* Kanban / List */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-16 text-muted-foreground">
                        {t('deals.loading', 'Загрузка сделок...')}
                    </div>
                ) : viewMode === 'kanban' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {STAGES.map((stageConfig) => {
                                const stageDeals = filteredDeals.filter((d) => d.stage === stageConfig.key);
                                const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
                                const colors = STAGE_KANBAN_COLORS[stageConfig.key];

                                return (
                                    <div
                                        key={stageConfig.key}
                                        className="w-64 shrink-0 flex flex-col gap-3"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => { void handleDrop(e, stageConfig.key); }}
                                    >
                                        <div className={cn('flex items-center justify-between px-3 py-2 rounded-xl border gap-2', colors.header)}>
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <span className={cn('w-2 h-2 rounded-full shrink-0', colors.dot)} />
                                                <span className="text-xs font-semibold text-foreground truncate">
                                                    {t(`deals.stages.${stageConfig.key}`)}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium bg-background/60 rounded-full px-1.5 shrink-0">
                                                    {stageDeals.length}
                                                </span>
                                            </div>
                                            {totalAmount > 0 && (
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {formatAmount(totalAmount)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Cards */}
                                        <div className="flex flex-col gap-2 min-h-[80px]">
                                            {stageDeals.map((deal) => (
                                                <DealCard
                                                    key={deal.id}
                                                    deal={deal}
                                                    onClick={() => navigate(`/deals/${deal.id}`)}
                                                    onDragStart={(e) => handleDragStart(e, deal.id)}
                                                />
                                            ))}
                                            {stageDeals.length === 0 && (
                                                <div className="border-2 border-dashed border-border rounded-xl h-16 flex items-center justify-center">
                                                    <span className="text-xs text-muted-foreground/40">—</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <Card className="overflow-hidden rounded-xl">
                        {filteredDeals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <LayoutGrid className="w-10 h-10 text-muted-foreground/20 mb-3" />
                                <p className="font-medium text-muted-foreground">{t('deals.noDeals')}</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">{t('deals.noDealsHint')}</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/50 border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
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
                                                className="border-b border-border/50 hover:bg-primary/5 cursor-pointer transition-colors group"
                                                onClick={() => navigate(`/deals/${deal.id}`)}
                                            >
                                                <td className="p-4 font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{deal.name}</td>
                                                <td className="p-4 text-foreground font-medium text-sm">{formatAmount(deal.amount)}</td>
                                                <td className="p-4">
                                                    {stageConf && (
                                                        <Badge variant={stageConf.badge}>
                                                            {t(`deals.stages.${deal.stage}`)}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4 text-muted-foreground text-sm">{deal.responsible}</td>
                                                <td className={cn('p-4 text-sm font-medium', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                                                    {deal.deadline
                                                        ? new Date(deal.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </td>
                                                <td className="p-4">
                                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </Card>
                )}
            </div>

            {/* New Deal Modal */}
            <NewDealForm
                open={showNewDealForm}
                onClose={() => setShowNewDealForm(false)}
                onSubmit={handleAddDeal}
                managers={managers}
                clients={clients}
            />

            {/* Confirm Stage Modal */}
            <Dialog open={!!confirmStage} onOpenChange={(v) => { if (!v && !isConfirming) setConfirmStage(null); }}>
                <DialogContent className="max-w-md shadow-2xl border-border/50">
                    <DialogTitle className="text-xl font-bold">{t('deals.confirmStageTitle', 'Подтверждение статуса')}</DialogTitle>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            {t('deals.confirmStageDesc', 'Вы переносите сделку в закрытый этап. Пожалуйста, укажите комментарий (причину):')}
                        </p>
                        <Input
                            value={confirmComment}
                            onChange={(e) => setConfirmComment(e.target.value)}
                            placeholder={t('deals.confirmCommentPlaceholder', 'Например: Клиент подписал договор...')}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmStage(null)} disabled={isConfirming}>
                            {t('deals.form.cancel')}
                        </Button>
                        <Button onClick={handleConfirmStageChange} disabled={isConfirming}>
                            {t('deals.form.submit')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
