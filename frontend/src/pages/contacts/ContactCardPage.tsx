/**
 * ContactCardPage — карточка контактного лица с 3 вкладками:
 * «Основное», «Компании», «История».
 *
 * @example
 * Доступна по роуту /contacts/:id
 */
import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Mail, Phone, Briefcase,
    Edit3, Save, X, Plus, Loader2, AlertCircle,
    Building2, History, MessageSquare,
    Phone as PhoneIcon, Video, StickyNote,
    ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
    contactsApi, clientsApi, interactionsApi,
    type ContactPerson, type ClientCompany, type Interaction,
} from '../../api/clients';

type Tab = 'main' | 'companies' | 'history';

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

// ─── Add Interaction Form ─────────────────────────────────────

interface AddInteractionFormProps {
    contactPersonId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Форма добавления взаимодействия к контакту
 */
function AddInteractionForm({ contactPersonId, onSuccess, onCancel }: AddInteractionFormProps): ReactElement {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        type: 'note' as Interaction['type'],
        description: '',
        interactionDate: new Date().toISOString().slice(0, 16),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!form.description.trim()) {
            setError(t('contacts.history.errors.descriptionRequired', 'Введите описание'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await interactionsApi.create({
                type: form.type,
                contactId: contactPersonId,
                interactionDate: new Date(form.interactionDate).toISOString(),
                description: form.description.trim(),
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to create interaction:', err);
            setError(t('contacts.history.errors.createFailed', 'Ошибка при сохранении'));
        } finally {
            setSaving(false);
        }
    }

    const typeLabels: Record<Interaction['type'], string> = {
        call: t('clients.history.types.call', 'Звонок'),
        meeting: t('clients.history.types.meeting', 'Встреча'),
        email: t('clients.history.types.email', 'Email'),
        note: t('clients.history.types.note', 'Заметка'),
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
            <div className="flex flex-wrap gap-2">
                {(Object.keys(typeLabels) as Interaction['type'][]).map(type => {
                    const Icon = INTERACTION_ICONS[type];
                    return (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setForm(p => ({ ...p, type }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${form.type === type
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {typeLabels[type]}
                        </button>
                    );
                })}
            </div>
            <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                    {t('clients.history.form.date', 'Дата и время')}
                </label>
                <input
                    type="datetime-local"
                    value={form.interactionDate}
                    onChange={e => setForm(p => ({ ...p, interactionDate: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                    {t('clients.history.form.description', 'Описание')}
                </label>
                <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder={t('clients.history.form.descriptionPlaceholder', 'Что произошло...')}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    autoFocus
                />
            </div>
            <div className="flex gap-3">
                <button
                    type="button" onClick={onCancel}
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                    {t('contacts.form.cancel', 'Отмена')}
                </button>
                <button
                    type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('contacts.form.saving', 'Сохранение...') : t('clients.history.form.submit', 'Добавить')}
                </button>
            </div>
        </form>
    );
}

// ─── Link Company Form ────────────────────────────────────────

interface LinkCompanyFormProps {
    contactId: string;
    linkedIds: string[];
    allCompanies: ClientCompany[];
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Форма привязки компании к контакту
 */
function LinkCompanyForm({ contactId, linkedIds, allCompanies, onSuccess, onCancel }: LinkCompanyFormProps): ReactElement {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState('');
    const [isPrimary, setIsPrimary] = useState(linkedIds.length === 0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const available = allCompanies.filter(c => !linkedIds.includes(c.id));

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!selectedId) {
            setError(t('contacts.companies.errors.selectRequired', 'Выберите компанию'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await contactsApi.linkToCompany(contactId, selectedId, isPrimary);
            onSuccess();
        } catch (err) {
            console.error('Failed to link company:', err);
            setError(t('contacts.companies.errors.linkFailed', 'Ошибка при привязке'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}
            {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('contacts.companies.noAvailable', 'Нет доступных компаний для привязки')}</p>
            ) : (
                <>
                    <div>
                        <label className="block text-xs font-medium text-foreground mb-1">
                            {t('contacts.companies.select', 'Выберите компанию')}
                        </label>
                        <select
                            value={selectedId}
                            onChange={e => setSelectedId(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                        >
                            <option value="">{t('contacts.form.noCompany', 'Не выбрано')}</option>
                            {available.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isPrimary}
                            onChange={e => setIsPrimary(e.target.checked)}
                            className="rounded border-input"
                        />
                        <span className="text-sm text-foreground">
                            {t('contacts.companies.isPrimary', 'Основная компания')}
                        </span>
                    </label>
                    <div className="flex gap-3">
                        <button
                            type="button" onClick={onCancel}
                            className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                        >
                            {t('contacts.form.cancel', 'Отмена')}
                        </button>
                        <button
                            type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {t('contacts.companies.link', 'Привязать')}
                        </button>
                    </div>
                </>
            )}
            {available.length === 0 && (
                <button
                    type="button" onClick={onCancel}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                    {t('contacts.form.cancel', 'Закрыть')}
                </button>
            )}
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────

/** Карточка контакта */
export function ContactCardPage(): ReactElement {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [contact, setContact] = useState<ContactPerson | null>(null);
    const [linkedCompanies, setLinkedCompanies] = useState<ClientCompany[]>([]);
    const [allCompanies, setAllCompanies] = useState<ClientCompany[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('main');

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ContactPerson>>({});
    const [saving, setSaving] = useState(false);

    // Add panels
    const [showAddInteraction, setShowAddInteraction] = useState(false);
    const [showLinkCompany, setShowLinkCompany] = useState(false);

    /**
     * Загружает карточку контакта, привязанные компании и историю
     */
    const loadData = useCallback(async (): Promise<void> => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [contactData, interData, allComp] = await Promise.all([
                contactsApi.getById(id),
                interactionsApi.get({ contactId: id }),
                clientsApi.getAll(),
            ]);
            setContact(contactData);
            setEditForm(contactData);
            setInteractions(interData.sort(
                (a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
            ));
            setAllCompanies(allComp);
            // Determine linked companies via clientCompanyId field
            const linked = contactData.clientCompanyId
                ? allComp.filter(c => c.id === contactData.clientCompanyId)
                : [];
            setLinkedCompanies(linked);
        } catch (err) {
            console.error('Failed to load contact:', err);
            setError(t('contacts.card.errors.loadFailed', 'Не удалось загрузить карточку контакта'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => { loadData(); }, [loadData]);

    async function handleSave(): Promise<void> {
        if (!id || !contact) return;
        setSaving(true);
        try {
            await contactsApi.update(id, editForm);
            setContact({ ...contact, ...editForm });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update contact:', err);
        } finally {
            setSaving(false);
        }
    }

    function getInitials(): string {
        if (!contact) return '?';
        return ((contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')).toUpperCase() || '?';
    }

    const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'main', label: t('contacts.card.tabs.main', 'Основное'), icon: User },
        { key: 'companies', label: t('contacts.card.tabs.companies', 'Компании'), icon: Building2, count: linkedCompanies.length },
        { key: 'history', label: t('contacts.card.tabs.history', 'История'), icon: History, count: interactions.length },
    ];

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !contact) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <p className="text-sm text-destructive">{error || t('contacts.card.errors.notFound', 'Контакт не найден')}</p>
                    <button
                        onClick={() => navigate('/contacts')}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        {t('contacts.card.backToList', 'Вернуться к списку')}
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || '—';

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl">
                {/* ── Back + Header ── */}
                <div>
                    <button
                        onClick={() => navigate('/contacts')}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('contacts.card.backToList', 'Контакты')}
                    </button>

                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xl font-bold text-primary">{getInitials()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                                {contact.position && (
                                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {contact.position}
                                    </span>
                                )}
                                {contact.email && (
                                    <a href={`mailto:${contact.email}`}
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                                        <Mail className="w-3.5 h-3.5" />
                                        {contact.email}
                                    </a>
                                )}
                                {contact.phoneWork && (
                                    <a href={`tel:${contact.phoneWork}`}
                                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                                        <Phone className="w-3.5 h-3.5" />
                                        {contact.phoneWork}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditForm(contact); }}
                                        className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm hover:bg-accent transition-colors flex items-center gap-1.5"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('contacts.form.cancel', 'Отмена')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {t('contacts.card.save', 'Сохранить')}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm hover:bg-accent transition-colors flex items-center gap-1.5"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    {t('contacts.card.edit', 'Редактировать')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="border-b border-border flex gap-0">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                {tab.count !== undefined && tab.count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ── Tab: Основное ── */}
                {activeTab === 'main' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('contacts.card.personalInfo', 'Личные данные')}
                            </h3>

                            {/* Имя */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('contacts.form.firstName', 'Имя')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.firstName || ''}
                                            onChange={e => setEditForm(p => ({ ...p, firstName: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground">{contact.firstName || '—'}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('contacts.form.lastName', 'Фамилия')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.lastName || ''}
                                            onChange={e => setEditForm(p => ({ ...p, lastName: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground">{contact.lastName || '—'}</p>
                                    )}
                                </div>
                            </div>

                            {/* Должность */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('contacts.form.position', 'Должность')}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text" value={editForm.position || ''}
                                        onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))}
                                        placeholder={t('contacts.form.positionPlaceholder', 'Директор...')}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground">{contact.position || '—'}</p>
                                )}
                            </div>

                            {/* Комментарий */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    {t('contacts.form.comment', 'Комментарий')}
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={editForm.comment || ''}
                                        onChange={e => setEditForm(p => ({ ...p, comment: e.target.value }))}
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                    />
                                ) : (
                                    <p className="text-sm text-foreground">{contact.comment || '—'}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('contacts.card.contactInfo', 'Контактная информация')}
                            </h3>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    <Mail className="w-3 h-3 inline mr-1" /> Email
                                </label>
                                {isEditing ? (
                                    <input
                                        type="email" value={editForm.email || ''}
                                        onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                                        placeholder="ivan@company.com"
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : contact.email ? (
                                    <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">{contact.email}</a>
                                ) : (
                                    <p className="text-sm text-foreground">—</p>
                                )}
                            </div>

                            {/* Рабочий телефон */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    <Phone className="w-3 h-3 inline mr-1" />
                                    {t('contacts.form.phoneWork', 'Рабочий тел.')}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel" value={editForm.phoneWork || ''}
                                        onChange={e => setEditForm(p => ({ ...p, phoneWork: e.target.value }))}
                                        placeholder="+7 (999) 000-00-00"
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : contact.phoneWork ? (
                                    <a href={`tel:${contact.phoneWork}`} className="text-sm text-foreground hover:text-primary">{contact.phoneWork}</a>
                                ) : (
                                    <p className="text-sm text-foreground">—</p>
                                )}
                            </div>

                            {/* Мобильный */}
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                    <Phone className="w-3 h-3 inline mr-1" />
                                    {t('contacts.form.phoneMobile', 'Мобильный')}
                                </label>
                                {isEditing ? (
                                    <input
                                        type="tel" value={editForm.phoneMobile || ''}
                                        onChange={e => setEditForm(p => ({ ...p, phoneMobile: e.target.value }))}
                                        placeholder="+7 (999) 000-00-00"
                                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                    />
                                ) : contact.phoneMobile ? (
                                    <a href={`tel:${contact.phoneMobile}`} className="text-sm text-foreground hover:text-primary">{contact.phoneMobile}</a>
                                ) : (
                                    <p className="text-sm text-foreground">—</p>
                                )}
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div className="p-3 rounded-xl border border-border text-center">
                                    <p className="text-xl font-bold text-foreground">{linkedCompanies.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('contacts.card.stats.companies', 'Компаний')}</p>
                                </div>
                                <div className="p-3 rounded-xl border border-border text-center">
                                    <p className="text-xl font-bold text-foreground">{interactions.length}</p>
                                    <p className="text-xs text-muted-foreground">{t('contacts.card.stats.interactions', 'Событий')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Tab: Компании ── */}
                {activeTab === 'companies' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('contacts.card.tabs.companies', 'Компании')}
                            </h3>
                            <button
                                onClick={() => setShowLinkCompany(v => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('contacts.companies.link', 'Привязать компанию')}
                            </button>
                        </div>

                        {showLinkCompany && (
                            <div className="p-5 rounded-xl border border-border bg-card">
                                <LinkCompanyForm
                                    contactId={contact.id}
                                    linkedIds={linkedCompanies.map(c => c.id)}
                                    allCompanies={allCompanies}
                                    onSuccess={() => { setShowLinkCompany(false); loadData(); }}
                                    onCancel={() => setShowLinkCompany(false)}
                                />
                            </div>
                        )}

                        {linkedCompanies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <Building2 className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">{t('contacts.companies.empty', 'Компании не привязаны')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                                {linkedCompanies.map(company => (
                                    <div
                                        key={company.id}
                                        onClick={() => navigate(`/clients/${company.id}`)}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="w-10 h-10 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {company.name}
                                            </p>
                                            {company.inn && (
                                                <p className="text-xs text-muted-foreground font-mono">ИНН: {company.inn}</p>
                                            )}
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Tab: История ── */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('contacts.card.tabs.history', 'История взаимодействий')}
                            </h3>
                            <button
                                onClick={() => setShowAddInteraction(v => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('clients.history.add', '+ Добавить')}
                            </button>
                        </div>

                        {showAddInteraction && (
                            <div className="p-5 rounded-xl border border-border bg-card">
                                <AddInteractionForm
                                    contactPersonId={contact.id}
                                    onSuccess={() => { setShowAddInteraction(false); loadData(); }}
                                    onCancel={() => setShowAddInteraction(false)}
                                />
                            </div>
                        )}

                        {interactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">{t('clients.history.empty', 'Взаимодействий пока нет')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {interactions.map(inter => {
                                    const Icon = INTERACTION_ICONS[inter.type] || MessageSquare;
                                    const colorClass = INTERACTION_COLORS[inter.type] || 'text-gray-500 bg-gray-500/10';
                                    const date = new Date(inter.interactionDate);

                                    return (
                                        <div key={inter.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                                            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${colorClass}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-xs font-semibold text-foreground capitalize">
                                                        {t(`clients.history.types.${inter.type}`, inter.type)}
                                                    </span>
                                                    <time className="text-xs text-muted-foreground shrink-0">
                                                        {date.toLocaleDateString('ru-RU')} {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                    </time>
                                                </div>
                                                <p className="text-sm text-foreground">{inter.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
