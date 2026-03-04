/**
 * ClientCardPage — карточка компании-клиента с 4 вкладками:
 * «Основное», «Контакты», «Сделки», «История».
 *
 * @example
 * Доступна по роуту /clients/:id
 */
import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, Globe, Phone, Mail, MapPin,
    Edit3, Save, X, Plus, Loader2, AlertCircle,
    MessageSquare, Users, Briefcase, History,
    Phone as PhoneIcon, Video, FileText, StickyNote,
    ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
    clientsApi, contactsApi, interactionsApi, directoriesApi,
    type ClientCompany, type ContactPerson, type Interaction, type Directory,
} from '../../api/clients';

type Tab = 'main' | 'contacts' | 'deals' | 'history';

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

// ─── Add Contact Form ─────────────────────────────────────────

interface AddContactFormProps {
    clientCompanyId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Форма добавления/привязки контактного лица к клиенту
 */
function AddContactForm({ clientCompanyId, onSuccess, onCancel }: AddContactFormProps): ReactElement {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        firstName: '', lastName: '', position: '',
        phoneWork: '', email: '', comment: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!form.firstName.trim() && !form.lastName.trim()) {
            setError(t('clients.contacts.errors.nameRequired', 'Введите имя или фамилию'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const contact = await contactsApi.create({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                position: form.position.trim() || undefined,
                phoneWork: form.phoneWork.trim() || undefined,
                email: form.email.trim() || undefined,
                comment: form.comment.trim() || undefined,
            });
            await contactsApi.linkToCompany(contact.id, clientCompanyId, true);
            onSuccess();
        } catch (err) {
            console.error('Failed to create contact:', err);
            setError(t('clients.contacts.errors.createFailed', 'Ошибка при добавлении контакта'));
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
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                        {t('clients.contacts.form.firstName', 'Имя')}
                    </label>
                    <input
                        type="text" value={form.firstName}
                        onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        placeholder={t('clients.contacts.form.firstNamePlaceholder', 'Иван')}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                        {t('clients.contacts.form.lastName', 'Фамилия')}
                    </label>
                    <input
                        type="text" value={form.lastName}
                        onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        placeholder={t('clients.contacts.form.lastNamePlaceholder', 'Иванов')}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                    {t('clients.contacts.form.position', 'Должность')}
                </label>
                <input
                    type="text" value={form.position}
                    onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    placeholder={t('clients.contacts.form.positionPlaceholder', 'Директор по продажам')}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                        {t('clients.contacts.form.phone', 'Телефон')}
                    </label>
                    <input
                        type="tel" value={form.phoneWork}
                        onChange={e => setForm(p => ({ ...p, phoneWork: e.target.value }))}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                        {t('clients.contacts.form.email', 'Email')}
                    </label>
                    <input
                        type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="ivan@company.com"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>
            <div className="flex gap-3 pt-1">
                <button
                    type="button" onClick={onCancel}
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                    {t('clients.form.cancel', 'Отмена')}
                </button>
                <button
                    type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('clients.form.saving', 'Сохранение...') : t('clients.contacts.form.submit', 'Добавить контакт')}
                </button>
            </div>
        </form>
    );
}

// ─── Add Interaction Form ─────────────────────────────────────

interface AddInteractionFormProps {
    clientCompanyId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

/** Форма добавления взаимодействия */
function AddInteractionForm({ clientCompanyId, onSuccess, onCancel }: AddInteractionFormProps): ReactElement {
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
            setError(t('clients.history.errors.descriptionRequired', 'Введите описание'));
            return;
        }
        setSaving(true);
        try {
            await interactionsApi.create({
                type: form.type,
                clientCompanyId,
                interactionDate: new Date(form.interactionDate).toISOString(),
                description: form.description.trim(),
            });
            onSuccess();
        } catch (err) {
            console.error('Failed to create interaction:', err);
            setError(t('clients.history.errors.createFailed', 'Ошибка при сохранении'));
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
            <div className="flex gap-2">
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
                    {t('clients.form.cancel', 'Отмена')}
                </button>
                <button
                    type="submit" disabled={saving}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('clients.form.saving', 'Сохранение...') : t('clients.history.form.submit', 'Добавить')}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────

/** Карточка клиента с 4 вкладками */
export function ClientCardPage(): ReactElement {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [client, setClient] = useState<ClientCompany | null>(null);
    const [contacts, setContacts] = useState<ContactPerson[]>([]);
    const [deals, setDeals] = useState<{ id: string; name: string; amount: number; stage: string }[]>([]);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [directories, setDirectories] = useState<Directory[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('main');

    // Edit mode
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<ClientCompany>>({});
    const [saving, setSaving] = useState(false);

    // Add contact / interaction modal
    const [showAddContact, setShowAddContact] = useState(false);
    const [showAddInteraction, setShowAddInteraction] = useState(false);

    /**
     * Загружает данные карточки клиента
     */
    const loadClient = useCallback(async (): Promise<void> => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const [clientData, dirs, contactsData, dealsData, interactionsData] = await Promise.all([
                clientsApi.getById(id),
                directoriesApi.getAll(),
                contactsApi.getByClientCompany(id),
                clientsApi.getDeals(id),
                interactionsApi.get({ clientCompanyId: id }),
            ]);
            setClient(clientData);
            setEditForm(clientData);
            setDirectories(dirs);
            setContacts(contactsData);
            setDeals(dealsData);
            setInteractions(interactionsData.sort(
                (a, b) => new Date(b.interactionDate).getTime() - new Date(a.interactionDate).getTime()
            ));
        } catch (err) {
            console.error('Failed to load client card:', err);
            setError(t('clients.card.errors.loadFailed', 'Не удалось загрузить карточку клиента'));
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => { loadClient(); }, [loadClient]);

    /**
     * Сохранить изменения в режиме редактирования
     */
    async function handleSave(): Promise<void> {
        if (!id || !client) return;
        setSaving(true);
        try {
            await clientsApi.update(id, editForm);
            setClient({ ...client, ...editForm });
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to update client:', err);
        } finally {
            setSaving(false);
        }
    }

    function dirValue(type: string, id?: string): string {
        return directories.find(d => d.type === type && d.id === id)?.value || '—';
    }

    const tabs: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
        { key: 'main', label: t('clients.card.tabs.main', 'Основное'), icon: Building2 },
        { key: 'contacts', label: t('clients.card.tabs.contacts', 'Контакты'), icon: Users, count: contacts.length },
        { key: 'deals', label: t('clients.card.tabs.deals', 'Сделки'), icon: Briefcase, count: deals.length },
        { key: 'history', label: t('clients.card.tabs.history', 'История'), icon: History, count: interactions.length },
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

    if (error || !client) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <AlertCircle className="w-12 h-12 text-destructive" />
                    <p className="text-sm text-destructive">{error || t('clients.card.errors.notFound', 'Клиент не найден')}</p>
                    <button
                        onClick={() => navigate('/clients')}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        {t('clients.card.backToList', 'Вернуться к списку')}
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl">
                {/* ── Back + Header ── */}
                <div>
                    <button
                        onClick={() => navigate('/clients')}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('clients.card.backToList', 'Клиенты')}
                    </button>

                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-bold text-foreground truncate">{client.name}</h1>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                                {client.inn && (
                                    <span className="text-sm text-muted-foreground font-mono">ИНН: {client.inn}</span>
                                )}
                                {client.website && (
                                    <a
                                        href={client.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                    >
                                        <Globe className="w-3.5 h-3.5" />
                                        {client.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={() => { setIsEditing(false); setEditForm(client); }}
                                        className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm hover:bg-accent transition-colors flex items-center gap-1.5"
                                    >
                                        <X className="w-4 h-4" />
                                        {t('clients.form.cancel', 'Отмена')}
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {t('clients.card.save', 'Сохранить')}
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm hover:bg-accent transition-colors flex items-center gap-1.5"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    {t('clients.card.edit', 'Редактировать')}
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

                {/* ── Tab Content ── */}

                {/* Основное */}
                {activeTab === 'main' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {t('clients.card.basicInfo', 'Основная информация')}
                                </h3>

                                {/* Название */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('clients.form.name', 'Название')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.name || ''}
                                            onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground">{client.name}</p>
                                    )}
                                </div>

                                {/* ИНН */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('clients.form.inn', 'ИНН')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.inn || ''}
                                            onChange={e => setEditForm(p => ({ ...p, inn: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground font-mono">{client.inn || '—'}</p>
                                    )}
                                </div>

                                {/* ОПФ */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('clients.form.legalForm', 'ОПФ')}
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editForm.legalFormId || ''}
                                            onChange={e => setEditForm(p => ({ ...p, legalFormId: e.target.value || undefined }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                                            {directories.filter(d => d.type === 'legal_form').map(d => (
                                                <option key={d.id} value={d.id}>{d.value}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-foreground">{dirValue('legal_form', client.legalFormId)}</p>
                                    )}
                                </div>

                                {/* Тип отношений */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('clients.form.relationType', 'Тип отношений')}
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editForm.relationTypeId || ''}
                                            onChange={e => setEditForm(p => ({ ...p, relationTypeId: e.target.value || undefined }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                                            {directories.filter(d => d.type === 'client_relation').map(d => (
                                                <option key={d.id} value={d.id}>{d.value}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-foreground">{dirValue('client_relation', client.relationTypeId)}</p>
                                    )}
                                </div>

                                {/* Источник лида */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        {t('clients.form.source', 'Источник')}
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editForm.sourceId || ''}
                                            onChange={e => setEditForm(p => ({ ...p, sourceId: e.target.value || undefined }))}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">{t('clients.form.notSelected', 'Не выбрано')}</option>
                                            {directories.filter(d => d.type === 'lead_source').map(d => (
                                                <option key={d.id} value={d.id}>{d.value}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="text-sm text-foreground">{dirValue('lead_source', client.sourceId)}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 rounded-xl border border-border bg-card space-y-4">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {t('clients.card.contactInfo', 'Контактная информация')}
                                </h3>

                                {/* Адрес */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        <MapPin className="w-3 h-3 inline mr-1" />
                                        {t('clients.form.address', 'Адрес')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.address || ''}
                                            onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))}
                                            placeholder={t('clients.form.addressPlaceholder', 'г. Москва...')}
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ) : (
                                        <p className="text-sm text-foreground">{client.address || '—'}</p>
                                    )}
                                </div>

                                {/* Сайт */}
                                <div>
                                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                                        <Globe className="w-3 h-3 inline mr-1" />
                                        {t('clients.form.website', 'Сайт')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text" value={editForm.website || ''}
                                            onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))}
                                            placeholder="https://example.com"
                                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    ) : client.website ? (
                                        <a href={client.website} target="_blank" rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline">
                                            {client.website}
                                        </a>
                                    ) : (
                                        <p className="text-sm text-foreground">—</p>
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-4 rounded-xl border border-border bg-card text-center">
                                    <p className="text-2xl font-bold text-foreground">{contacts.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('clients.card.stats.contacts', 'Контактов')}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-card text-center">
                                    <p className="text-2xl font-bold text-foreground">{deals.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('clients.card.stats.deals', 'Сделок')}</p>
                                </div>
                                <div className="p-4 rounded-xl border border-border bg-card text-center">
                                    <p className="text-2xl font-bold text-foreground">{interactions.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{t('clients.card.stats.interactions', 'Событий')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Контакты */}
                {activeTab === 'contacts' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('clients.card.tabs.contacts', 'Контактные лица')}
                            </h3>
                            <button
                                onClick={() => setShowAddContact(v => !v)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('clients.contacts.add', '+ Добавить контакт')}
                            </button>
                        </div>

                        {showAddContact && (
                            <div className="p-5 rounded-xl border border-border bg-card">
                                <AddContactForm
                                    clientCompanyId={client.id}
                                    onSuccess={() => { setShowAddContact(false); loadClient(); }}
                                    onCancel={() => setShowAddContact(false)}
                                />
                            </div>
                        )}

                        {contacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <Phone className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">{t('clients.contacts.empty', 'Контактных лиц пока нет')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                                {contacts.map(contact => (
                                    <div key={contact.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors">
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary">
                                                {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground">
                                                {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || '—'}
                                            </p>
                                            {contact.position && (
                                                <p className="text-xs text-muted-foreground">{contact.position}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {contact.phoneWork && (
                                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phoneWork}</span>
                                            )}
                                            {contact.email && (
                                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Сделки */}
                {activeTab === 'deals' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('clients.card.tabs.deals', 'Сделки клиента')}
                            </h3>
                            <button
                                onClick={() => navigate(`/deals?clientId=${client.id}`)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                {t('clients.deals.create', '+ Создать сделку')}
                            </button>
                        </div>

                        {deals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <Briefcase className="w-10 h-10 text-muted-foreground/40" />
                                <p className="text-sm text-muted-foreground">{t('clients.deals.empty', 'Сделок пока нет')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                                {deals.map(deal => (
                                    <div
                                        key={deal.id}
                                        onClick={() => navigate(`/deals/${deal.id}`)}
                                        className="flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {deal.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{deal.stage}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-foreground shrink-0">
                                            {deal.amount.toLocaleString()} ₽
                                        </p>
                                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* История */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('clients.card.tabs.history', 'История взаимодействий')}
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
                                    clientCompanyId={client.id}
                                    onSuccess={() => { setShowAddInteraction(false); loadClient(); }}
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
                                    const Icon = INTERACTION_ICONS[inter.type] || FileText;
                                    const colorClass = INTERACTION_COLORS[inter.type] || 'text-gray-500 bg-gray-500/10';
                                    const date = new Date(inter.interactionDate);

                                    return (
                                        <div key={inter.id} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                                            <div className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${colorClass}`}>
                                                <Icon className="w-4.5 h-4.5" />
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
