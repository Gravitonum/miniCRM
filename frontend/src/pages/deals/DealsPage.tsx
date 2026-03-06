/**
 * DealsPage — страница сделок с Kanban и списком.
 * Интегрирована с реальными воронками из БД.
 * Поддерживает drag-and-drop смены этапа, запись DealStageHistory,
 * подтверждение при переносе в won/lost, переключатель воронок.
 *
 * @example
 * <Route path="/deals" element={<DealsPage />} />
 */
import { type ReactElement, useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { useTranslation } from 'react-i18next';
import {
    Plus, LayoutGrid, List, ChevronRight,
    Calendar, Banknote, User, Loader2,
    AlertCircle, RefreshCw, Trophy, X, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { dealsApi, type Deal } from '../../api/deals';
import { clientsApi, contactsApi, type ClientCompany, type ContactPerson } from '../../api/clients';
import { funnelsApi, type Funnel, type FunnelStage } from '../../api/settings';
import { getAppUser } from '../../lib/api';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type KanbanView = 'kanban' | 'list';

/** Цветовое оформление колонки канбана по statusType */
function getStageColors(statusType: FunnelStage['statusType']): { header: string; dot: string } {
    switch (statusType) {
        case 'won': return { header: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', dot: 'bg-emerald-500' };
        case 'lost': return { header: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', dot: 'bg-red-500' };
        default: {
            // Rotate through a palette for 'open' stages
            return { header: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', dot: 'bg-blue-500' };
        }
    }
}

/** Open stage color by index (for variety) */
const OPEN_STAGE_PALETTE = [
    { header: 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700', dot: 'bg-slate-400' },
    { header: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800', dot: 'bg-blue-500' },
    { header: 'bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800', dot: 'bg-violet-500' },
    { header: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800', dot: 'bg-amber-500' },
    { header: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', dot: 'bg-orange-500' },
    { header: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800', dot: 'bg-cyan-500' },
];

/** Форматирование суммы */
function formatAmount(amount: number, currency = 'RUB'): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(amount);
}

// ─── New Deal Form ────────────────────────────────────────────────────────────

interface NewDealFormProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void;
    managers: { username: string; id: string }[];
    clients: ClientCompany[];
    funnels: Funnel[];
    stages: FunnelStage[];
    defaultFunnelId?: string;
}

/**
 * Модальная форма создания новой сделки.
 */
function NewDealForm({
    open, onClose, onCreated,
    managers, clients, funnels, stages, defaultFunnelId
}: NewDealFormProps): ReactElement | null {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [selectedFunnelId, setSelectedFunnelId] = useState(defaultFunnelId || '');
    const [stageId, setStageId] = useState('');
    const [responsible, setResponsible] = useState('');
    const [deadline, setDeadline] = useState('');
    const [clientId, setClientId] = useState('');
    const [contactId, setContactId] = useState('');
    const [clientContacts, setClientContacts] = useState<ContactPerson[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    // Derived: stages for selected funnel
    const funnelStages = stages
        .filter(s => s.funnelId === selectedFunnelId)
        .sort((a, b) => a.orderIdx - b.orderIdx);

    // Auto-select first open stage when funnel changes
    useEffect(() => {
        const firstOpen = funnelStages.find(s => s.statusType === 'open');
        setStageId(firstOpen?.id || funnelStages[0]?.id || '');
    }, [selectedFunnelId, stages]);

    // Load contacts when client changes
    useEffect(() => {
        setContactId('');
        if (!clientId) {
            setClientContacts([]);
            return;
        }
        contactsApi.getByClientCompany(clientId)
            .then(setClientContacts)
            .catch(err => console.error('Failed to load contacts for client', err));
    }, [clientId]);

    useEffect(() => {
        if (open && defaultFunnelId) setSelectedFunnelId(defaultFunnelId);
    }, [open, defaultFunnelId]);

    useEffect(() => {
        if (open) setTimeout(() => firstInputRef.current?.focus(), 50);
    }, [open]);

    if (!open) return null;

    function handleClose() {
        setName(''); setAmount(''); setStageId(''); setResponsible('');
        setDeadline(''); setClientId(''); setContactId(''); setClientContacts([]); setErrors({});
        onClose();
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = t('deals.form.errors.nameRequired');
        if (!amount || isNaN(Number(amount))) e.amount = t('deals.form.errors.amountRequired');
        if (!stageId) e.stage = t('deals.form.errors.stageRequired');
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function handleSubmit(ev: React.FormEvent): Promise<void> {
        ev.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            await dealsApi.createDeal({
                name: name.trim(),
                amount: Number(amount),
                stage: stageId,
                responsible: responsible || 'Не назначен',
                deadline: deadline || undefined,
                clientCompanyId: clientId || undefined,
                contactPersonId: contactId || undefined,
            });
            onCreated();
            handleClose();
        } catch (err) {
            console.error('Failed to create deal:', err);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary/10">
                    <h2 className="text-lg font-bold text-foreground">{t('deals.form.title')}</h2>
                    <button onClick={handleClose} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={e => void handleSubmit(e)} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.name')} <span className="text-destructive">*</span>
                        </label>
                        <input
                            ref={firstInputRef}
                            id="deal-name"
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder={t('deals.form.namePlaceholder')}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                        {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.amount')} <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₽</span>
                            <input
                                id="deal-amount"
                                type="number"
                                min="0"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder={t('deals.form.amountPlaceholder')}
                                className="w-full pl-7 pr-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
                    </div>

                    {/* Funnel */}
                    {funnels.length > 1 && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Воронка</label>
                            <select
                                id="deal-funnel"
                                value={selectedFunnelId}
                                onChange={e => setSelectedFunnelId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                            >
                                {funnels.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Stage */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.stage')} <span className="text-destructive">*</span>
                        </label>
                        <select
                            id="deal-stage"
                            value={stageId}
                            onChange={e => setStageId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                            {funnelStages.length === 0
                                ? <option value="">— Нет этапов —</option>
                                : funnelStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                            }
                        </select>
                        {errors.stage && <p className="text-xs text-destructive mt-1">{errors.stage}</p>}
                    </div>

                    {/* Responsible */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.responsible')}
                        </label>
                        <select
                            id="deal-responsible"
                            value={responsible}
                            onChange={e => setResponsible(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">{t('deals.form.responsiblePlaceholder')}</option>
                            {managers.map(m => <option key={m.id} value={m.username}>{m.username}</option>)}
                        </select>
                    </div>

                    {/* Client */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.client')}
                        </label>
                        <select
                            id="deal-client"
                            value={clientId}
                            onChange={e => setClientId(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                        >
                            <option value="">{t('deals.form.clientPlaceholder')}</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Contact Person */}
                    {clientId && clientContacts.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Контактное лицо
                            </label>
                            <select
                                id="deal-contact"
                                value={contactId}
                                onChange={e => setContactId(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                            >
                                <option value="">Не выбрано</option>
                                {clientContacts.map(c => (
                                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Deadline */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('deals.form.deadline')}
                        </label>
                        <input
                            id="deal-deadline"
                            type="date"
                            value={deadline}
                            onChange={e => setDeadline(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-accent transition-colors"
                        >
                            {t('deals.form.cancel')}
                        </button>
                        <button
                            type="submit"
                            id="deal-form-submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {submitting ? t('deals.form.submitting') : t('deals.form.submit')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Won/Lost Confirmation Modal ──────────────────────────────────────────────

interface CloseDealModalProps {
    deal: Deal;
    targetStage: FunnelStage;
    onConfirm: (closeDate: string) => void;
    onCancel: () => void;
}

/**
 * Диалог подтверждения закрытия сделки (won/lost).
 */
function CloseDealModal({ deal, targetStage, onConfirm, onCancel }: CloseDealModalProps): ReactElement {
    const today = new Date().toISOString().split('T')[0];
    const [closeDate, setCloseDate] = useState(today);
    const isWon = targetStage.statusType === 'won';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                <div className={cn(
                    'flex items-center justify-between px-6 py-4 border-b border-border',
                    isWon ? 'bg-emerald-500/10' : 'bg-red-500/10'
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center',
                            isWon ? 'bg-emerald-500/20' : 'bg-red-500/20'
                        )}>
                            {isWon ? <Trophy className="w-5 h-5 text-emerald-600" /> : <X className="w-5 h-5 text-red-600" />}
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm">
                                {isWon ? '🎉 Сделка выиграна!' : 'Сделка проиграна'}
                            </h3>
                            <p className="text-xs text-muted-foreground">{deal.name}</p>
                        </div>
                    </div>
                    <button onClick={onCancel} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Сделка будет перемещена в этап <strong className="text-foreground">«{targetStage.name}»</strong>.
                        Укажите дату закрытия:
                    </p>
                    <input
                        type="date"
                        value={closeDate}
                        onChange={e => setCloseDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-border text-foreground font-semibold hover:bg-accent transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => onConfirm(closeDate)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold transition-colors',
                                isWon ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                            )}
                        >
                            <Check className="w-4 h-4" />
                            Подтвердить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────

interface DealCardProps {
    deal: Deal;
    onDragStart: (e: React.DragEvent, deal: Deal) => void;
    onClick: () => void;
}

/**
 * Карточка сделки для Kanban доски.
 */
function DealCard({ deal, onDragStart, onClick }: DealCardProps): ReactElement {
    return (
        <div
            draggable
            onDragStart={e => onDragStart(e, deal)}
            onClick={onClick}
            className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all group"
        >
            <p className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {deal.name}
            </p>
            <div className="flex items-center gap-1.5 mb-2">
                <Banknote className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-bold text-emerald-600">{formatAmount(deal.amount)}</span>
            </div>
            <div className="space-y-1.5">
                {deal.responsible && deal.responsible !== 'Не назначен' && (
                    <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground truncate">{deal.responsible}</span>
                    </div>
                )}
                {deal.deadline && (
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                            {new Date(deal.deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

interface KanbanBoardProps {
    stages: FunnelStage[];
    deals: Deal[];
    onDropToStage: (deal: Deal, newStage: FunnelStage) => void;
    onDealClick: (deal: Deal) => void;
}

/**
 * Канбан-доска с колонками по этапам воронки.
 */
function KanbanBoard({ stages, deals, onDropToStage, onDealClick }: KanbanBoardProps): ReactElement {
    const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);
    const dragDealRef = useRef<Deal | null>(null);

    // Count open stages for palette assignment
    let openIdx = 0;

    function handleDragStart(e: React.DragEvent, deal: Deal) {
        dragDealRef.current = deal;
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragOver(e: React.DragEvent, stageId: string) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverStageId(stageId);
    }

    function handleDrop(e: React.DragEvent, stage: FunnelStage) {
        e.preventDefault();
        setDragOverStageId(null);
        if (dragDealRef.current) {
            onDropToStage(dragDealRef.current, stage);
            dragDealRef.current = null;
        }
    }

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {stages.map(stage => {
                let colors: { header: string; dot: string };
                if (stage.statusType !== 'open') {
                    colors = getStageColors(stage.statusType);
                } else {
                    colors = OPEN_STAGE_PALETTE[openIdx % OPEN_STAGE_PALETTE.length];
                    openIdx++;
                }

                const stageDeals = deals.filter(d => d.stage === stage.id);
                const stageAmount = stageDeals.reduce((sum, d) => sum + d.amount, 0);
                const isDragOver = dragOverStageId === stage.id;

                return (
                    <div
                        key={stage.id}
                        data-stage-id={stage.id}
                        onDragOver={e => handleDragOver(e, stage.id)}
                        onDragLeave={() => setDragOverStageId(null)}
                        onDrop={e => handleDrop(e, stage)}
                        className={cn(
                            'flex flex-col min-w-[280px] w-72 rounded-2xl border-2 transition-all',
                            isDragOver ? 'border-primary/50 bg-primary/5 scale-[1.01]' : 'border-transparent bg-muted/40'
                        )}
                    >
                        {/* Column header */}
                        <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-t-xl border-b border-border', colors.header)}>
                            <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', colors.dot)} />
                            <span className="text-sm font-semibold text-foreground flex-1 truncate">{stage.name}</span>
                            <span className="text-xs font-bold text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                                {stageDeals.length}
                            </span>
                        </div>
                        {/* Amount summary */}
                        {stageAmount > 0 && (
                            <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/50">
                                {formatAmount(stageAmount)}
                            </div>
                        )}
                        {/* Cards */}
                        <div className="flex-1 p-3 space-y-2.5 min-h-[200px]">
                            {stageDeals.map(deal => (
                                <DealCard
                                    key={deal.id}
                                    deal={deal}
                                    onDragStart={handleDragStart}
                                    onClick={() => onDealClick(deal)}
                                />
                            ))}
                            {stageDeals.length === 0 && (
                                <div className={cn(
                                    'h-16 rounded-xl border-2 border-dashed flex items-center justify-center',
                                    isDragOver ? 'border-primary text-primary' : 'border-border text-muted-foreground'
                                )}>
                                    <p className="text-xs">{isDragOver ? 'Отпустите здесь' : 'Нет сделок'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

/**
 * Страница сделок с поддержкой Kanban и Список видов.
 * Загружает воронки из БД, позволяет переключать активную воронку.
 */
export function DealsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────
    const [view, setView] = useState<KanbanView>('kanban');
    const [deals, setDeals] = useState<Deal[]>([]);
    const [clients, setClients] = useState<ClientCompany[]>([]);
    const [managers, setManagers] = useState<{ username: string; id: string }[]>([]);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [allStages, setAllStages] = useState<FunnelStage[]>([]);
    const [activeFunnelId, setActiveFunnelId] = useState<string>('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showNewDeal, setShowNewDeal] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');

    // Confirmation modal state
    const [pendingMove, setPendingMove] = useState<{ deal: Deal; stage: FunnelStage } | null>(null);

    // ── Derived ────────────────────────────────────────────────────────────
    /** Stages for active funnel, sorted by orderIdx */
    const activeStages = allStages
        .filter(s => s.funnelId === activeFunnelId)
        .sort((a, b) => a.orderIdx - b.orderIdx);

    /** Filtered deals for current search query */
    const filteredDeals = deals.filter(d => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            d.name.toLowerCase().includes(q) ||
            (d.clientCompanyName || '').toLowerCase().includes(q) ||
            (d.responsible || '').toLowerCase().includes(q)
        );
    });

    // ── Data loading ──────────────────────────────────────────────────────

    /**
     * Загрузить все данные: воронки, этапы, сделки, клиенты, менеджеры.
     */
    const loadAll = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            // Get current user org
            const username = localStorage.getItem('gravisales_username') || sessionStorage.getItem('gravisales_current_user') || '';
            let orgCode = '';
            if (username) {
                const userResult = await getAppUser(username);
                if (userResult.success && userResult.user) {
                    orgCode = userResult.user.orgCode || '';
                    setCurrentUserId(userResult.user.id);
                }
            }

            // Load funnels, deals, clients in parallel
            const [allFunnels, allDeals, allClients] = await Promise.all([
                funnelsApi.getAll(),
                dealsApi.getDeals(),
                clientsApi.getAll(),
            ]);

            setDeals(allDeals);
            setClients(allClients);

            // Load stages for all funnels
            const stagesByFunnel = await Promise.all(
                allFunnels.map(f => funnelsApi.getStages(f.id))
            );
            const stages = stagesByFunnel.flat();
            setAllStages(stages);

            const activeFunnels = allFunnels.filter(f => f.isActive);
            setFunnels(activeFunnels);

            // Set default active funnel
            if (activeFunnels.length > 0) {
                setActiveFunnelId(prev => {
                    if (prev && activeFunnels.find(f => f.id === prev)) return prev;
                    return activeFunnels[0].id;
                });
            } else {
                setActiveFunnelId('');
            }

            // Load managers
            if (orgCode) {
                const orgManagers = await dealsApi.getOrgUsers(orgCode);
                setManagers(orgManagers);
            }
        } catch (err) {
            console.error('Failed to load deals data:', err);
            setError(t('deals.noDeals') || 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { void loadAll(); }, [loadAll]);

    // ── Drag-and-Drop Handler ─────────────────────────────────────────────

    /**
     * Обработать dropped сделку: если этап won/lost — показать modal.
     * Иначе — сразу обновить этап и записать историю.
     */
    function handleDropToStage(deal: Deal, newStage: FunnelStage) {
        if (deal.stage === newStage.id) return; // Same stage, no action
        if (newStage.statusType === 'won' || newStage.statusType === 'lost') {
            setPendingMove({ deal, stage: newStage });
        } else {
            void moveToStage(deal, newStage, undefined);
        }
    }

    /**
     * Выполнить перемещение сделки: обновить этап + записать историю.
     */
    async function moveToStage(deal: Deal, newStage: FunnelStage, closeDate: string | undefined): Promise<void> {
        const prevStageId = deal.stage;
        // Optimistic update
        setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: newStage.id } : d));

        try {
            const updatePayload: Parameters<typeof dealsApi.updateDeal>[1] = {
                stage: newStage.id,
                ...(closeDate ? { deadline: closeDate } : {}),
            };
            await dealsApi.updateDeal(deal.id, updatePayload);

            // Record stage history
            void dealsApi.recordStageHistory(deal.id, prevStageId, newStage.id, currentUserId || 'unknown').catch(err => {
                console.warn('Stage history record failed (non-blocking):', err);
            });
        } catch (err) {
            console.error('Failed to move deal:', err);
            // Rollback on error
            setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage: prevStageId } : d));
        }
    }

    function handleConfirmClose(closeDate: string) {
        if (!pendingMove) return;
        void moveToStage(pendingMove.deal, pendingMove.stage, closeDate);
        setPendingMove(null);
    }

    // ── Render ─────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Загрузка сделок...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                    <p className="text-muted-foreground">{error}</p>
                    <button
                        onClick={() => void loadAll()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Попробовать снова
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-5">
                {/* ── Page Header ──────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('deals.title')}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">{t('deals.subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Refresh */}
                        <button
                            onClick={() => void loadAll()}
                            title="Обновить"
                            className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        {/* View toggle */}
                        <div className="flex items-center bg-muted rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setView('kanban')}
                                className={cn(
                                    'p-2 rounded-lg transition-all',
                                    view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setView('list')}
                                className={cn(
                                    'p-2 rounded-lg transition-all',
                                    view === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                        {/* New deal */}
                        <button
                            id="new-deal-btn"
                            onClick={() => setShowNewDeal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            {t('deals.add')}
                        </button>
                    </div>
                </div>

                {/* ── Funnel Tab Switcher ───────────────────────────────────── */}
                {funnels.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {funnels.map(funnel => (
                            <button
                                key={funnel.id}
                                onClick={() => setActiveFunnelId(funnel.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border',
                                    activeFunnelId === funnel.id
                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                        : 'bg-background text-muted-foreground border-border hover:text-foreground hover:bg-accent'
                                )}
                            >
                                {funnel.name}
                                <span className={cn(
                                    'text-xs px-1.5 py-0.5 rounded-full',
                                    activeFunnelId === funnel.id ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                                )}>
                                    {deals.filter(d => {
                                        const funnelStageIds = allStages.filter(s => s.funnelId === funnel.id).map(s => s.id);
                                        return funnelStageIds.includes(d.stage);
                                    }).length}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Search ───────────────────────────────────────────────── */}
                <div className="max-w-sm">
                    <div className="relative">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('deals.search')}
                            className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                    </div>
                </div>

                {/* ── No funnels state ─────────────────────────────────────── */}
                {funnels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-base font-medium text-foreground">Нет воронок</p>
                        <p className="text-sm text-muted-foreground">Создайте воронку в разделе «Настройки»</p>
                    </div>
                )}

                {/* ── Kanban Board ─────────────────────────────────────────── */}
                {view === 'kanban' && funnels.length > 0 && (
                    <KanbanBoard
                        stages={activeStages}
                        deals={filteredDeals}
                        onDropToStage={handleDropToStage}
                        onDealClick={deal => void navigate(`/deals/${deal.id}`)}
                    />
                )}

                {/* ── List View ────────────────────────────────────────────── */}
                {view === 'list' && funnels.length > 0 && (
                    <div className="rounded-2xl border border-border overflow-hidden bg-card">
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[1fr_140px_160px_140px_120px_40px] gap-4 px-5 py-3 bg-muted/40 border-b border-border">
                            {[t('deals.table.name'), t('deals.table.amount'), t('deals.table.stage'), t('deals.table.owner'), t('deals.table.deadline')].map(h => (
                                <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</span>
                            ))}
                            <span />
                        </div>

                        <div className="divide-y divide-border">
                            {filteredDeals.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <p className="text-sm text-muted-foreground">{t('deals.noDeals')}</p>
                                </div>
                            ) : filteredDeals.map(deal => {
                                const stageInfo = activeStages.find(s => s.id === deal.stage);
                                return (
                                    <div
                                        key={deal.id}
                                        onClick={() => void navigate(`/deals/${deal.id}`)}
                                        className="grid grid-cols-1 md:grid-cols-[1fr_140px_160px_140px_120px_40px] gap-2 md:gap-4 px-5 py-4 hover:bg-accent/40 cursor-pointer group transition-colors"
                                    >
                                        <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{deal.name}</p>
                                        <p className="text-sm font-bold text-emerald-600">{formatAmount(deal.amount)}</p>
                                        <div>
                                            {stageInfo ? (
                                                <span className={cn(
                                                    'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                                                    stageInfo.statusType === 'won' ? 'bg-emerald-500/10 text-emerald-600' :
                                                        stageInfo.statusType === 'lost' ? 'bg-red-500/10 text-red-600' :
                                                            'bg-blue-500/10 text-blue-600'
                                                )}>
                                                    {stageInfo.name}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">{deal.stage}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground truncate">{deal.responsible || '—'}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {deal.deadline
                                                ? new Date(deal.deadline).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                                                : '—'
                                            }
                                        </p>
                                        <div className="hidden md:flex items-center justify-end">
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-3 bg-muted/20 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Сделок: <span className="font-semibold text-foreground">{filteredDeals.length}</span>
                                {' • '}Сумма: <span className="font-semibold text-emerald-600">
                                    {formatAmount(filteredDeals.reduce((sum, d) => sum + d.amount, 0))}
                                </span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── New Deal Modal ──────────────────────────────────────────── */}
            <NewDealForm
                open={showNewDeal}
                onClose={() => setShowNewDeal(false)}
                onCreated={() => void loadAll()}
                managers={managers}
                clients={clients}
                funnels={funnels}
                stages={allStages}
                defaultFunnelId={activeFunnelId}
            />

            {/* ── Close Deal Confirmation Modal ───────────────────────────── */}
            {pendingMove && (
                <CloseDealModal
                    deal={pendingMove.deal}
                    targetStage={pendingMove.stage}
                    onConfirm={handleConfirmClose}
                    onCancel={() => setPendingMove(null)}
                />
            )}
        </DashboardLayout>
    );
}
