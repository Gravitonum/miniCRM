/**
 * FunnelsSettings — управление воронками и их этапами.
 * Поддерживает создание воронок, добавление/удаление/переименование
 * этапов, изменение типа (open/won/lost) и переупорядочивание через API.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Loader2, Plus, Trash2, ChevronUp, ChevronDown,
    Pencil, Check, X
} from 'lucide-react';
import { funnelsApi, type Funnel, type FunnelStage } from '../../api/settings';
import { getAppUser, type AppUser } from '../../lib/api';

export function FunnelsSettings(): ReactElement {
    const { t } = useTranslation();
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [selectedFunnel, setSelectedFunnel] = useState<Funnel | null>(null);
    const [stages, setStages] = useState<FunnelStage[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [stagesLoading, setStagesLoading] = useState(false);

    // Inline edit state
    const [editingStageId, setEditingStageId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        async function init() {
            const username = localStorage.getItem('gravisales_username');
            if (username) {
                const res = await getAppUser(username);
                if (res.success && res.user) {
                    setCurrentUser(res.user);
                }
            }
        }
        init();
    }, []);

    useEffect(() => {
        async function load() {
            try {
                const fs = await funnelsApi.getAll();
                setFunnels(fs);
                if (fs.length > 0) setSelectedFunnel(fs[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    useEffect(() => {
        if (!selectedFunnel) return;
        async function loadStages() {
            setStagesLoading(true);
            try {
                const st = await funnelsApi.getStages(selectedFunnel!.id);
                setStages(st);
            } catch (err) {
                console.error(err);
            } finally {
                setStagesLoading(false);
            }
        }
        loadStages();
    }, [selectedFunnel]);

    async function handleAddFunnel() {
        const name = prompt(t('settings.funnels.newFunnelPrompt', 'Название новой воронки'));
        if (!name?.trim() || !currentUser?.orgCode) return;
        try {
            const added = await funnelsApi.createFunnel(name.trim());
            setFunnels([...funnels, added]);
            setSelectedFunnel(added);
        } catch (err) {
            console.error('Failed to create funnel', err);
        }
    }

    async function handleAddStage() {
        if (!selectedFunnel) return;
        const name = prompt(t('settings.funnels.newStagePrompt', 'Название этапа'));
        if (!name?.trim()) return;
        try {
            const newOrder = stages.length > 0 ? Math.max(...stages.map(s => s.orderIdx)) + 1 : 1;
            const added = await funnelsApi.createStage({
                name: name.trim(),
                funnelId: selectedFunnel.id,
                statusType: 'open',
                orderIdx: newOrder
            });
            setStages([...stages, added]);
        } catch (err) {
            console.error('Failed to create stage', err);
        }
    }

    async function handleDeleteStage(id: string) {
        if (!confirm(t('common.confirmDelete', 'Удалить?'))) return;
        try {
            await funnelsApi.deleteStage(id);
            setStages(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            console.error('delete stage failed', err);
        }
    }

    async function handleChangeStageType(id: string, newType: 'open' | 'won' | 'lost') {
        try {
            await funnelsApi.updateStage(id, { statusType: newType });
            setStages(prev => prev.map(s => s.id === id ? { ...s, statusType: newType } : s));
        } catch (err) {
            console.error('update stage type failed', err);
        }
    }

    /**
     * Переместить этап вверх/вниз — меняет orderIdx местами с соседним.
     * @param index — текущий индекс этапа в отсортированном массиве
     * @param direction — -1 вверх, +1 вниз
     */
    async function handleMoveStage(index: number, direction: -1 | 1) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= stages.length) return;

        const updated = [...stages];
        const a = { ...updated[index] };
        const b = { ...updated[newIndex] };

        // Swap orderIdx
        const tmpOrder = a.orderIdx;
        a.orderIdx = b.orderIdx;
        b.orderIdx = tmpOrder;

        updated[index] = a;
        updated[newIndex] = b;

        // Sort by orderIdx
        updated.sort((x, y) => x.orderIdx - y.orderIdx);
        setStages(updated);

        try {
            await Promise.all([
                funnelsApi.updateStage(a.id, { orderIdx: a.orderIdx }),
                funnelsApi.updateStage(b.id, { orderIdx: b.orderIdx }),
            ]);
        } catch (err) {
            console.error('Failed to reorder stages', err);
        }
    }

    /** Завершить inline-редактирование имени этапа */
    async function handleSaveName(id: string) {
        const trimmed = editingName.trim();
        if (!trimmed) { setEditingStageId(null); return; }
        try {
            await funnelsApi.updateStage(id, { name: trimmed });
            setStages(prev => prev.map(s => s.id === id ? { ...s, name: trimmed } : s));
        } catch (err) {
            console.error('Failed to rename stage', err);
        }
        setEditingStageId(null);
    }

    if (loading) return <div className="p-8"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>;

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1.5">
                    <h2 className="text-lg font-bold text-foreground">
                        {t('settings.funnels.title', 'Воронки и этапы')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {t('settings.funnels.subtitle', 'Настройка различных процессов продаж')}
                    </p>
                </div>
                <button
                    onClick={handleAddFunnel}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    {t('settings.funnels.createFunnel', 'Создать воронку')}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Funnel list */}
                <div className="w-full lg:w-64 shrink-0 bg-card border border-border rounded-xl flex flex-col overflow-hidden max-h-[500px]">
                    <div className="px-5 py-3 border-b border-border bg-muted/20">
                        <h3 className="text-sm font-semibold text-foreground">{t('settings.funnels.listTitle', 'Список воронок')}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-border">
                        {funnels.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setSelectedFunnel(f)}
                                className={`w-full text-left px-5 py-3 text-sm transition-colors ${selectedFunnel?.id === f.id
                                    ? 'bg-primary/5 border-l-2 border-l-primary text-primary font-medium'
                                    : 'hover:bg-accent text-foreground'
                                    }`}
                            >
                                {f.name}
                            </button>
                        ))}
                        {funnels.length === 0 && (
                            <div className="p-5 text-sm text-muted-foreground text-center">
                                {t('settings.funnels.emptyFunnels', 'Нет воронок')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stages panel */}
                <div className="flex-1 bg-card border border-border rounded-xl flex flex-col">
                    {selectedFunnel ? (
                        <>
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {t('settings.funnels.stagesFor', 'Этапы воронки:')} {selectedFunnel.name}
                                </h3>
                                <button
                                    onClick={handleAddStage}
                                    className="px-3 py-1.5 bg-background border border-border rounded-md text-xs font-medium hover:bg-accent transition-colors flex items-center gap-1.5"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {t('settings.funnels.addStage', 'Добавить этап')}
                                </button>
                            </div>

                            <div className="p-6">
                                {stagesLoading ? (
                                    <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <div className="space-y-2">
                                        {stages.map((stage, i) => (
                                            <div key={stage.id} className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5 group">
                                                {/* Move buttons */}
                                                <div className="flex flex-col gap-0.5 shrink-0">
                                                    <button
                                                        onClick={() => handleMoveStage(i, -1)}
                                                        disabled={i === 0}
                                                        className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronUp className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMoveStage(i, 1)}
                                                        disabled={i === stages.length - 1}
                                                        className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground disabled:opacity-20 transition-colors"
                                                    >
                                                        <ChevronDown className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>

                                                {/* Order badge */}
                                                <div className="w-7 h-7 rounded flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground shrink-0">
                                                    {i + 1}
                                                </div>

                                                {/* Stage name (inline edit) */}
                                                <div className="flex-1 min-w-0">
                                                    {editingStageId === stage.id ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <input
                                                                autoFocus
                                                                value={editingName}
                                                                onChange={e => setEditingName(e.target.value)}
                                                                onKeyDown={e => {
                                                                    if (e.key === 'Enter') handleSaveName(stage.id);
                                                                    if (e.key === 'Escape') setEditingStageId(null);
                                                                }}
                                                                className="flex-1 text-sm px-2 py-0.5 rounded border border-ring bg-background focus:outline-none"
                                                            />
                                                            <button onClick={() => handleSaveName(stage.id)} className="p-1 text-green-600 hover:bg-green-600/10 rounded">
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => setEditingStageId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-medium text-foreground truncate">{stage.name}</span>
                                                            <button
                                                                onClick={() => { setEditingStageId(stage.id); setEditingName(stage.name); }}
                                                                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground rounded transition-all"
                                                            >
                                                                <Pencil className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status type selector */}
                                                <div className="shrink-0">
                                                    <select
                                                        value={stage.statusType}
                                                        onChange={(e) => handleChangeStageType(stage.id, e.target.value as 'open' | 'won' | 'lost')}
                                                        className={`text-xs px-2 py-1 rounded border appearance-none cursor-pointer ${stage.statusType === 'open'
                                                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                            : stage.statusType === 'won'
                                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                                : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                            }`}
                                                    >
                                                        <option value="open">{t('settings.funnels.typeOpen', 'В работе')}</option>
                                                        <option value="won">{t('settings.funnels.typeWon', 'Выиграно')}</option>
                                                        <option value="lost">{t('settings.funnels.typeLost', 'Проиграно')}</option>
                                                    </select>
                                                </div>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDeleteStage(stage.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        {stages.length === 0 && (
                                            <div className="text-center py-12 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                                                {t('settings.funnels.emptyStages', 'В этой воронке пока нет этапов')}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                            {t('settings.funnels.selectHint', 'Выберите воронку слева')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
