/**
 * ContactsPage — таблица всех контактных лиц организации с поиском.
 *
 * @example
 * Доступна по роуту /contacts
 */
import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Search, User, Mail, Phone, Building2,
    ChevronRight, AlertCircle, Loader2, RefreshCw, X,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { contactsApi, clientsApi, type ContactPerson, type ClientCompany } from '../../api/clients';

// ─── Add Contact Modal ────────────────────────────────────────

interface AddContactFormProps {
    companies: ClientCompany[];
    onSuccess: () => void;
    onCancel: () => void;
}

/**
 * Форма создания контактного лица с привязкой к компании
 */
function AddContactForm({ companies, onSuccess, onCancel }: AddContactFormProps): ReactElement {
    const { t } = useTranslation();
    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        position: '',
        phoneWork: '',
        phoneMobile: '',
        email: '',
        linkedCompanyId: '',
        comment: '',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!form.firstName.trim() && !form.lastName.trim()) {
            setError(t('contacts.form.errors.nameRequired', 'Введите имя или фамилию'));
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const contact = await contactsApi.create({
                firstName: form.firstName.trim() || undefined,
                lastName: form.lastName.trim() || undefined,
                position: form.position.trim() || undefined,
                phoneWork: form.phoneWork.trim() || undefined,
                phoneMobile: form.phoneMobile.trim() || undefined,
                email: form.email.trim() || undefined,
                comment: form.comment.trim() || undefined,
            });
            if (form.linkedCompanyId) {
                await contactsApi.linkToCompany(contact.id, form.linkedCompanyId, true);
            }
            onSuccess();
        } catch (err) {
            console.error('Failed to create contact:', err);
            setError(t('contacts.form.errors.createFailed', 'Ошибка при создании контакта'));
        } finally {
            setSaving(false);
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

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('contacts.form.firstName', 'Имя')}
                    </label>
                    <input
                        id="contact-first-name"
                        type="text"
                        value={form.firstName}
                        onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                        placeholder={t('contacts.form.firstNamePlaceholder', 'Иван')}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('contacts.form.lastName', 'Фамилия')} <span className="text-destructive">*</span>
                    </label>
                    <input
                        id="contact-last-name"
                        type="text"
                        value={form.lastName}
                        onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
                        placeholder={t('contacts.form.lastNamePlaceholder', 'Иванов')}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('contacts.form.position', 'Должность')}
                </label>
                <input
                    id="contact-position"
                    type="text"
                    value={form.position}
                    onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
                    placeholder={t('contacts.form.positionPlaceholder', 'Директор по продажам')}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('contacts.form.phoneWork', 'Рабочий тел.')}
                    </label>
                    <input
                        id="contact-phone-work"
                        type="tel"
                        value={form.phoneWork}
                        onChange={e => setForm(p => ({ ...p, phoneWork: e.target.value }))}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        {t('contacts.form.phoneMobile', 'Мобильный')}
                    </label>
                    <input
                        id="contact-phone-mobile"
                        type="tel"
                        value={form.phoneMobile}
                        onChange={e => setForm(p => ({ ...p, phoneMobile: e.target.value }))}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('contacts.form.email', 'Email')}
                </label>
                <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="ivan@company.com"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('contacts.form.company', 'Компания')}
                </label>
                <select
                    id="contact-company"
                    value={form.linkedCompanyId}
                    onChange={e => setForm(p => ({ ...p, linkedCompanyId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                >
                    <option value="">{t('contacts.form.noCompany', 'Без компании')}</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    {t('contacts.form.comment', 'Комментарий')}
                </label>
                <textarea
                    id="contact-comment"
                    value={form.comment}
                    onChange={e => setForm(p => ({ ...p, comment: e.target.value }))}
                    placeholder={t('contacts.form.commentPlaceholder', 'Дополнительная информация...')}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
                />
            </div>

            <div className="flex gap-3 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                    {t('contacts.form.cancel', 'Отмена')}
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    id="contact-form-submit"
                    className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saving ? t('contacts.form.saving', 'Сохранение...') : t('contacts.form.submit', 'Создать контакт')}
                </button>
            </div>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────

/** Страница списка контактных лиц */
export function ContactsPage(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [contacts, setContacts] = useState<ContactPerson[]>([]);
    const [companies, setCompanies] = useState<ClientCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    /**
     * Загрузить контакты и компании для привязки
     */
    const loadData = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const [allContacts, allCompanies] = await Promise.all([
                contactsApi.getAll(),
                clientsApi.getAll(),
            ]);
            setContacts(allContacts);
            setCompanies(allCompanies);
        } catch (err) {
            console.error('Failed to load contacts:', err);
            setError(t('contacts.errors.loadFailed', 'Не удалось загрузить контакты'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { loadData(); }, [loadData]);

    /**
     * Фильтрация по поисковому запросу
     */
    const filtered = contacts.filter(c => {
        const q = search.toLowerCase();
        if (!q) return true;
        const fullName = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
        return fullName.includes(q)
            || (c.email || '').toLowerCase().includes(q)
            || (c.position || '').toLowerCase().includes(q)
            || (c.phoneWork || '').includes(q)
            || (c.phoneMobile || '').includes(q);
    });

    /**
     * Получить аббревиатуру для аватара контакта
     */
    function getInitials(contact: ContactPerson): string {
        return ((contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')).toUpperCase() || '?';
    }

    /**
     * Получить название компании по ID из списка
     */
    function getCompanyName(contact: ContactPerson): string | null {
        if (!contact.clientCompanyId) return null;
        return companies.find(c => c.id === contact.clientCompanyId)?.name ?? null;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            {t('contacts.title', 'Контакты')}
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {t('contacts.subtitle', 'База контактных лиц')}
                        </p>
                    </div>
                    <button
                        id="add-contact-btn"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4" />
                        {t('contacts.add', '+ Добавить контакт')}
                    </button>
                </div>

                {/* ── Search ── */}
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            id="contacts-search"
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={t('contacts.search', 'Поиск по имени, email, должности...')}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                        />
                    </div>
                    <button
                        onClick={loadData}
                        title={t('contacts.refresh', 'Обновить')}
                        className="p-2.5 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">{t('contacts.loading', 'Загрузка...')}</p>
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
                            {t('contacts.retry', 'Попробовать снова')}
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-base font-medium text-foreground">
                            {search
                                ? t('contacts.noResults', 'Ничего не найдено')
                                : t('contacts.empty', 'Контактов пока нет')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {search
                                ? t('contacts.noResultsHint', 'Попробуйте изменить запрос')
                                : t('contacts.emptyHint', 'Нажмите «+ Добавить контакт», чтобы начать')}
                        </p>
                    </div>
                ) : (
                    /* Таблица контактов */
                    <div className="rounded-xl border border-border overflow-hidden bg-card">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-[auto_1fr_180px_180px_140px_40px] gap-4 px-6 py-3 bg-muted/40 border-b border-border">
                            <span className="w-10" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('contacts.table.name', 'Контакт')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('contacts.table.company', 'Компания')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('contacts.table.email', 'Email')}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t('contacts.table.phone', 'Телефон')}
                            </span>
                            <span />
                        </div>

                        {/* Rows */}
                        <div className="divide-y divide-border">
                            {filtered.map(contact => {
                                const initials = getInitials(contact);
                                const companyName = getCompanyName(contact);

                                return (
                                    <div
                                        key={contact.id}
                                        onClick={() => navigate(`/contacts/${contact.id}`)}
                                        className="grid grid-cols-1 md:grid-cols-[auto_1fr_180px_180px_140px_40px] gap-2 md:gap-4 px-6 py-4 hover:bg-accent/40 transition-colors cursor-pointer group"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">{initials}</span>
                                        </div>

                                        {/* Name + Position */}
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                                {[contact.firstName, contact.lastName].filter(Boolean).join(' ') || '—'}
                                            </p>
                                            {contact.position && (
                                                <p className="text-xs text-muted-foreground truncate">{contact.position}</p>
                                            )}
                                        </div>

                                        {/* Company */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {companyName ? (
                                                <>
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span className="text-sm text-foreground truncate">{companyName}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            {contact.email ? (
                                                <>
                                                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span className="text-sm text-foreground truncate">{contact.email}</span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        {/* Phone */}
                                        <div className="flex items-center gap-1.5">
                                            {(contact.phoneWork || contact.phoneMobile) ? (
                                                <>
                                                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span className="text-sm text-foreground">
                                                        {contact.phoneWork || contact.phoneMobile}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">—</span>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <div className="hidden md:flex items-center justify-end">
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-muted/20 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                {t('contacts.total', 'Показано')}: <span className="font-semibold text-foreground">{filtered.length}</span>
                                {filtered.length !== contacts.length && (
                                    <span className="ml-1">{t('contacts.outOf', 'из')} {contacts.length}</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Contact Modal ── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground">
                                {t('contacts.form.title', 'Новый контакт')}
                            </h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">
                            <AddContactForm
                                companies={companies}
                                onSuccess={() => { setShowAddModal(false); loadData(); }}
                                onCancel={() => setShowAddModal(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
