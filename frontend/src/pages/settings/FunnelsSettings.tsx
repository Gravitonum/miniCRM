/**
 * FunnelsSettings — управление воронками и их этапами.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, MoveUp, MoveDown } from 'lucide-react';
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
                if (fs.length > 0) {
                    setSelectedFunnel(fs[0]);
                }
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
        // Простой prompt временно, или можно сделать инлайн
        const name = prompt(t('settings.funnels.newFunnelPrompt', 'Название новой воронки'));
        if (!name?.trim() || !currentUser?.orgCode) return;
        // companyId должен быть UUID, тут мы передаем orgCode, но по факту нужно companyId тенанта.
        // Пока создадим без companyId - гравиюайz сделает его null если нет связки или если платформа позволяет
        // Для упрощения:
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
                {/* Список воронок */}
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

                {/* Этапы воронки */}
                <div className="flex-1 bg-card border border-border rounded-xl flex flex-col">
                    {selectedFunnel ? (
                        <>
                            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        {t('settings.funnels.stagesFor', 'Этапы воронки:')} {selectedFunnel.name}
                                    </h3>
                                </div>
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
                                    <div className="space-y-3">
                                        {stages.map((stage, i) => (
                                            <div key={stage.id} className="flex items-center gap-4 bg-background border border-border rounded-lg p-3 group">
                                                <div className="flex flex-col gap-1 text-muted-foreground/50 shrink-0 cursor-ns-resize">
                                                    <MoveUp className="w-3.5 h-3.5" />
                                                    <MoveDown className="w-3.5 h-3.5" />
                                                </div>

                                                <div className="w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-xs bg-muted text-muted-foreground">
                                                    {i + 1}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-foreground truncate block">{stage.name}</span>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-2">
                                                    <select
                                                        value={stage.statusType}
                                                        onChange={(e) => handleChangeStageType(stage.id, e.target.value as 'open' | 'won' | 'lost')}
                                                        className={`text-xs px-2 py-1 rounded border appearance-none ${stage.statusType === 'open' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                                            stage.statusType === 'won' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                                'bg-red-500/10 text-red-600 border-red-500/20'
                                                            }`}
                                                    >
                                                        <option value="open">{t('settings.funnels.typeOpen', 'В работе')}</option>
                                                        <option value="won">{t('settings.funnels.typeWon', 'Закрыто успешно')}</option>
                                                        <option value="lost">{t('settings.funnels.typeLost', 'Закрыто неуспешно')}</option>
                                                    </select>
                                                </div>

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
