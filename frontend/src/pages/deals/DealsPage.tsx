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
    Plus, Search, Filter, LayoutGrid, List, ChevronRight,
    Calendar, DollarSign, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge, type BadgeProps } from '../../components/ui/badge';
import { Card } from '../../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
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

/** Модель сделки */
interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: StageKey;
    responsible: string;
    deadline?: string;
}

/** Демо-данные */
const MOCK_DEALS: Deal[] = [
    { id: '1', name: 'Лицензия на ПО', amount: 8000, stage: 'proposalSent', responsible: 'Иван Смирнов', deadline: '2025-12-15' },
    { id: '2', name: 'Корпоративное развертывание', amount: 25000, stage: 'negotiation', responsible: 'Мария Иванова', deadline: '2025-11-30' },
    { id: '3', name: 'Сервисный контракт', amount: 5500, stage: 'discovery', responsible: 'Алексей Петров', deadline: '2025-12-20' },
    { id: '4', name: 'Поставка оборудования', amount: 12000, stage: 'qualified', responsible: 'Екатерина Кузнецова' },
    { id: '5', name: 'Консалтинговый проект', amount: 3200, stage: 'prospecting', responsible: 'Дмитрий Волков' },
];

/** Конфигурация этапов */
const STAGES: { key: StageKey; badge: BadgeProps['variant'] }[] = [
    { key: 'prospecting', badge: 'slate' },
    { key: 'qualified', badge: 'blue' },
    { key: 'discovery', badge: 'violet' },
    { key: 'proposalSent', badge: 'amber' },
    { key: 'negotiation', badge: 'orange' },
    { key: 'closed', badge: 'emerald' },
];

const STAGE_KANBAN_COLORS: Record<StageKey, { header: string; dot: string }> = {
    prospecting: { header: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400' },
    qualified: { header: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500' },
    discovery: { header: 'bg-violet-50 border-violet-200', dot: 'bg-violet-500' },
    proposalSent: { header: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500' },
    negotiation: { header: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
    closed: { header: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
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
    onSubmit: (deal: Omit<Deal, 'id'>) => void;
}

/**
 * Модальная форма создания новой сделки (Dialog).
 */
function NewDealForm({ open, onClose, onSubmit }: NewDealFormProps): ReactElement {
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
        if (open) {
            setTimeout(() => firstInputRef.current?.focus(), 50);
        }
    }, [open]);

    /** Сброс формы при закрытии */
    function handleClose() {
        setName(''); setAmount(''); setStage('prospecting');
        setResponsible(''); setDeadline(''); setErrors({});
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
        });
        setSubmitting(false);
        handleClose();
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('deals.form.title')}</DialogTitle>
                </DialogHeader>

                <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4 py-2">
                    {/* Название */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deal-name">{t('deals.form.name')}</Label>
                        <Input
                            ref={firstInputRef}
                            id="deal-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t('deals.form.namePlaceholder')}
                            hasError={!!errors.name}
                        />
                        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    {/* Сумма */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deal-amount">{t('deals.form.amount')}</Label>
                        <div className="relative">
                            <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                id="deal-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={t('deals.form.amountPlaceholder')}
                                min="0"
                                hasError={!!errors.amount}
                                className="pl-9"
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                    </div>

                    {/* Этап */}
                    <div className="space-y-1.5">
                        <Label>{t('deals.form.stage')}</Label>
                        <Select value={stage} onValueChange={(v) => setStage(v as StageKey)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STAGES.map((s) => (
                                    <SelectItem key={s.key} value={s.key}>
                                        {t(`deals.stages.${s.key}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Ответственный */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deal-responsible">{t('deals.form.responsible')}</Label>
                        <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                id="deal-responsible"
                                value={responsible}
                                onChange={(e) => setResponsible(e.target.value)}
                                placeholder={t('deals.form.responsiblePlaceholder')}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    {/* Дедлайн */}
                    <div className="space-y-1.5">
                        <Label htmlFor="deal-deadline">{t('deals.form.deadline')}</Label>
                        <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                                id="deal-deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2 gap-3">
                        <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                            {t('deals.form.cancel')}
                        </Button>
                        <Button type="submit" disabled={submitting} className="flex-1">
                            {submitting ? t('deals.form.submitting') : t('deals.form.submit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/** Карточка сделки на Kanban-доске */
function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }): ReactElement {
    const { t } = useTranslation();
    const isOverdue = deal.deadline ? new Date(deal.deadline) < new Date() : false;
    const stageConf = STAGES.find((s) => s.key === deal.stage);

    return (
        <div
            onClick={onClick}
            className="bg-card rounded-xl border border-border p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
        >
            <p className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {deal.name}
            </p>
            <p className="text-primary font-bold text-base mb-3">{formatAmount(deal.amount)}</p>
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-primary">{deal.responsible.charAt(0)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{deal.responsible}</span>
                </div>
                {deal.deadline && (
                    <span className={cn('text-xs font-medium flex items-center gap-1 shrink-0', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                        <Calendar className="w-3 h-3" />
                        {new Date(deal.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                )}
            </div>
            {stageConf && (
                <div className="mt-3 pt-3 border-t border-border">
                    <Badge variant={stageConf.badge}>{t(`deals.stages.${deal.stage}`)}</Badge>
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
    const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
    const [search, setSearch] = useState('');

    /** Добавление новой сделки */
    function handleAddDeal(newDeal: Omit<Deal, 'id'>): void {
        setDeals((prev) => [{ ...newDeal, id: String(Date.now()) }, ...prev]);
    }

    const filteredDeals = deals.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.responsible.toLowerCase().includes(search.toLowerCase())
    );

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
                <Card className="px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3 rounded-xl">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('deals.search')}
                                className="w-full pl-9 pr-4 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all"
                            />
                        </div>
                        <button className="p-2 text-muted-foreground hover:bg-accent rounded-lg border border-border transition-colors hidden sm:flex items-center gap-1.5 text-sm">
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
                {viewMode === 'kanban' ? (
                    <div className="overflow-x-auto pb-4">
                        <div className="flex gap-4 min-w-max">
                            {STAGES.map((stageConfig) => {
                                const stageDeals = filteredDeals.filter((d) => d.stage === stageConfig.key);
                                const totalAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
                                const colors = STAGE_KANBAN_COLORS[stageConfig.key];

                                return (
                                    <div key={stageConfig.key} className="w-64 flex flex-col gap-3">
                                        {/* Column header */}
                                        <div className={cn('flex items-center justify-between px-3 py-2 rounded-xl border', colors.header)}>
                                            <div className="flex items-center gap-2">
                                                <span className={cn('w-2 h-2 rounded-full', colors.dot)} />
                                                <span className="text-xs font-semibold text-foreground">
                                                    {t(`deals.stages.${stageConfig.key}`)}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-medium bg-background/60 rounded-full px-1.5">
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
            />
        </DashboardLayout>
    );
}
