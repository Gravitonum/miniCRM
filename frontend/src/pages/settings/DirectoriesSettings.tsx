/**
 * DirectoriesSettings — управление справочниками (sources, legal_forms, relations).
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Plus, Trash2, Tag, Briefcase, Info, Pencil, Check, X } from 'lucide-react';
import { directoriesApi, type Directory } from '../../api/clients';

export function DirectoriesSettings(): ReactElement {
    const { t } = useTranslation();
    const [directories, setDirectories] = useState<Directory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    // Новое значение по типам
    const [newVal, setNewVal] = useState<Record<string, string>>({});

    const types = [
        { id: 'lead_source', icon: Info, label: t('settings.dir.leadSource', 'Источники лидов'), desc: t('settings.dir.leadSourceDesc', 'Откуда пришел клиент') },
        { id: 'legal_form', icon: Briefcase, label: t('settings.dir.legalForm', 'Организационно-правовые формы'), desc: t('settings.dir.legalFormDesc', 'ООО, ИП, АО и т.д.') },
        { id: 'client_relation', icon: Tag, label: t('settings.dir.relation', 'Типы отношений'), desc: t('settings.dir.relationDesc', 'Степень теплоты или тип связи') },
    ];

    useEffect(() => {
        async function load() {
            try {
                const data = await directoriesApi.getAll();
                setDirectories(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    async function handleAdd(type: string) {
        const val = newVal[type]?.trim();
        if (!val) return;
        try {
            const added = await directoriesApi.create(type, val);
            setDirectories(prev => [...prev, added]);
            setNewVal(prev => ({ ...prev, [type]: '' }));
        } catch (err) {
            console.error('Failed to add directory item', err);
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm(t('common.deleteConfirm', 'Вы уверены, что хотите удалить этот элемент?'))) return;
        try {
            await directoriesApi.delete(id);
            setDirectories(prev => prev.filter(d => d.id !== id));
        } catch (err) {
            console.error('Failed to delete directory item', err);
        }
    }

    async function handleUpdate(id: string) {
        const val = editValue.trim();
        if (!val) return;
        try {
            await directoriesApi.update(id, val);
            setDirectories(prev => prev.map(d => d.id === id ? { ...d, value: val } : d));
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update directory item', err);
        }
    }

    function startEditing(item: Directory) {
        setEditingId(item.id);
        setEditValue(item.value);
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-foreground">
                    {t('settings.dir.title', 'Справочники')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t('settings.dir.subtitle', 'Настройка выпадающих списков для карточек клиентов')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map(group => {
                    const items = directories.filter(d => d.type === group.id);
                    const Icon = group.icon;

                    return (
                        <div key={group.id} className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
                            <div className="px-5 py-4 border-b border-border bg-muted/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                                </div>
                                <p className="text-xs text-muted-foreground">{group.desc}</p>
                            </div>

                            <div className="flex-1 p-5 overflow-y-auto max-h-[300px]">
                                {items.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t('settings.dir.empty', 'Список пуст')}</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {items.map(item => (
                                            <li key={item.id} className="flex justify-between items-center group text-sm bg-background border border-border rounded-md px-3 py-2 min-h-[40px]">
                                                {editingId === item.id ? (
                                                    <div className="flex items-center gap-2 w-full">
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={editValue}
                                                            onChange={e => setEditValue(e.target.value)}
                                                            className="flex-1 min-w-0 px-2 py-1 bg-muted/30 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleUpdate(item.id);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => handleUpdate(item.id)}
                                                                className="p-1 text-primary hover:bg-primary/10 rounded transition-all"
                                                                title={t('common.save', 'Сохранить')}
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingId(null)}
                                                                className="p-1 text-muted-foreground hover:bg-muted rounded transition-all"
                                                                title={t('common.cancel', 'Отмена')}
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="truncate text-foreground pr-2" title={item.value}>{item.value}</span>
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                                            <button
                                                                onClick={() => startEditing(item)}
                                                                className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all"
                                                                title={t('common.edit', 'Редактировать')}
                                                            >
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                                                                title={t('common.delete', 'Удалить')}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="p-4 border-t border-border bg-background">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleAdd(group.id); }}
                                    className="flex gap-2"
                                >
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            placeholder={t('settings.dir.addPlaceholder', 'Новое значение')}
                                            value={newVal[group.id] || ''}
                                            onChange={e => setNewVal(p => ({ ...p, [group.id]: e.target.value }))}
                                            className="w-full px-3 py-1.5 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 ring-offset-background bg-background text-foreground transition-all"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newVal[group.id]?.trim()}
                                        className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
