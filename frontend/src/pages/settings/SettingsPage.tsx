/**
 * SettingsPage — главная страница настроек с вкладками:
 * Пользователи, Компания, Справочники, Воронки.
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Building2, Book, Filter } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { UsersSettings } from './UsersSettings';
import { CompanySettings } from './CompanySettings';
import { DirectoriesSettings } from './DirectoriesSettings';
import { FunnelsSettings } from './FunnelsSettings';

type Tab = 'users' | 'company' | 'directories' | 'funnels';

export function SettingsPage(): ReactElement {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('users');

    const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
        { key: 'users', label: t('settings.tabs.users', 'Пользователи'), icon: Users },
        { key: 'company', label: t('settings.tabs.company', 'Профиль компании'), icon: Building2 },
        { key: 'directories', label: t('settings.tabs.directories', 'Справочники'), icon: Book },
        { key: 'funnels', label: t('settings.tabs.funnels', 'Воронки и этапы'), icon: Filter },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-5xl">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        {t('settings.title', 'Настройки')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {t('settings.subtitle', 'Управление параметрами приложения и доступом')}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Боковое меню вкладок */}
                    <div className="w-full md:w-64 shrink-0">
                        <nav className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                            {tabs.map(tab => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.key;
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Контент активной вкладки */}
                    <div className="flex-1 min-w-0">
                        {activeTab === 'users' && <UsersSettings />}
                        {activeTab === 'company' && <CompanySettings />}
                        {activeTab === 'directories' && <DirectoriesSettings />}
                        {activeTab === 'funnels' && <FunnelsSettings />}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
