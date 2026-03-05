/**
 * CompanySettings — настройки тенанта.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Save, Globe, DollarSign, Fingerprint, Sparkles } from 'lucide-react';
import { getAppUser, type AppUser } from '../../lib/api';
import { companyApi, type Company } from '../../api/settings';

export function CompanySettings(): ReactElement {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [company, setCompany] = useState<Company | null>(null);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        timezone: '',
        currency: '',
        defaultLanguage: '',
        konturApiKey: '',
    });

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
        if (!currentUser?.orgCode) {
            setLoading(false);
            return;
        }

        async function load() {
            try {
                const c = await companyApi.getByOrgCode(currentUser!.orgCode!);
                setCompany(c);
                if (c) {
                    setForm({
                        name: c.name || '',
                        timezone: c.timezone || 'Europe/Moscow',
                        currency: c.currency || 'RUB',
                        defaultLanguage: c.defaultLanguage || 'ru',
                        konturApiKey: c.konturApiKey || '',
                    });
                }
            } catch (err) {
                console.error('Failed to load company details:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [currentUser?.orgCode]);

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;
        setSaving(true);
        try {
            await companyApi.update(company.id, form);
            setCompany({ ...company, ...form });
        } catch (err) {
            console.error('Failed to save company settings:', err);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
    }

    if (!currentUser?.orgCode || !company) {
        return (
            <div className="p-6 bg-card border border-border rounded-xl">
                <p className="text-sm text-foreground">{t('settings.company.notFound', 'Профиль компании недоступен.')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-bold text-foreground">
                    {t('settings.company.title', 'Профиль компании')}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {t('settings.company.subtitle', 'Основные настройки и реквизиты вашего рабочего пространства')}
                </p>
            </div>

            <form onSubmit={handleSave} className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">

                {/* ID и системная инфо */}
                <div className="px-6 py-5 flex items-start gap-4 bg-muted/20">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">{t('settings.company.orgCodeLabel', 'Код организации')}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t('settings.company.orgCodeHint', 'Сообщите этот код вашим сотрудникам для присоединения к компании')}</p>
                        <div className="mt-2 text-sm font-mono bg-background border border-border px-3 py-1.5 rounded-md inline-block">
                            {company.orgCode}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('settings.company.name', 'Название компании')}
                        </label>
                        <input
                            required
                            type="text"
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                {t('settings.company.timezone', 'Часовой пояс')}
                            </label>
                            <select
                                value={form.timezone}
                                onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="Europe/Moscow">Москва (UTC+3)</option>
                                <option value="Europe/Kaliningrad">Калининград (UTC+2)</option>
                                <option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option>
                                <option value="Asia/Novosibirsk">Новосибирск (UTC+7)</option>
                                <option value="Asia/Vladivostok">Владивосток (UTC+10)</option>
                                <option value="Asia/Almaty">Алматы (UTC+6)</option>
                                <option value="Asia/Tashkent">Ташкент (UTC+5)</option>
                                <option value="UTC">UTC</option>
                                <option value="Europe/London">Лондон (UTC+0)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                {t('settings.company.currency', 'Валюта по умолчанию')}
                            </label>
                            <select
                                value={form.currency}
                                onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="RUB">RUB ₽</option>
                                <option value="USD">USD $</option>
                                <option value="EUR">EUR €</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {t('settings.company.defaultLanguage', 'Язык по умолчанию')}
                        </label>
                        <select
                            value={form.defaultLanguage}
                            onChange={e => setForm(p => ({ ...p, defaultLanguage: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                            <option value="kk">Қазақша</option>
                            <option value="uz">O'zbek</option>
                        </select>
                    </div>

                    <div className="pt-2 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3">{t('settings.company.integrations', 'Интеграции')}</h4>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                {t('settings.company.konturKey', 'API ключ Контур.Фокус')}
                            </label>
                            <input
                                type="password"
                                value={form.konturApiKey}
                                onChange={e => setForm(p => ({ ...p, konturApiKey: e.target.value }))}
                                placeholder="****************"
                                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono"
                            />
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {t('settings.company.konturHint', 'Необходим для автоматического заполнения реквизитов клиентов по ИНН')}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-muted/20 flex items-center justify-between">
                    <div>
                        <button
                            type="button"
                            onClick={() => navigate('/onboarding')}
                            className="px-5 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-center gap-2"
                            title={t('settings.company.launchWizardHint', 'Пройти первоначальную настройку заново')}
                        >
                            <Sparkles className="w-4 h-4 text-primary" />
                            {t('settings.company.launchWizard', 'Запустить мастер настройки')}
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {t('settings.save', 'Сохранить изменения')}
                    </button>
                </div>
            </form>
        </div>
    );
}
