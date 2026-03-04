/**
 * DashboardLayout — основной layout с тёмным сайдбаром и шапкой.
 * Использует shadcn/ui компоненты: Avatar, DropdownMenu, Separator, Tooltip.
 *
 * @example
 * <DashboardLayout>
 *   <YourPageContent />
 * </DashboardLayout>
 */
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Bell,
    LogOut,
    User,
    Settings,
    Menu,
    X,
    Briefcase,
    ChevronDown,
    Sparkles,
    PanelLeftClose,
    PanelLeftOpen,
    Building2,
    Users,
    BarChart2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeSwitcher } from '../ThemeSwitcher';

/** Хук выхода из системы */
function useLogout() {
    const navigate = useNavigate();
    return () => {
        localStorage.clear();
        navigate('/login');
    };
}

export function DashboardLayout({ children }: { children: React.ReactNode }): ReactElement {
    const { t } = useTranslation();
    const logout = useLogout();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const username = localStorage.getItem('gravisales_username') || 'User';

    /** Получить инициалы из имени */
    function getInitials(name: string): string {
        return name.slice(0, 2).toUpperCase();
    }

    const navigation = [
        { name: t('nav.dashboard', 'Dashboard'), href: '/', icon: LayoutDashboard },
        { name: t('nav.deals', 'Сделки'), href: '/deals', icon: Briefcase },
        { name: t('nav.clients', 'Клиенты'), href: '/clients', icon: Building2 },
        { name: t('nav.contacts', 'Контакты'), href: '/contacts', icon: Users },
        { name: t('nav.reports', 'Отчёты'), href: '/reports', icon: BarChart2 },
        { name: t('nav.settings', 'Настройки'), href: '/settings', icon: Settings },
    ];

    return (
        <TooltipProvider>
            <div className="flex min-h-screen bg-secondary/30 w-full relative">
                {/* Mobile Backdrop */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* ── Sidebar ── */}
                <aside
                    className={cn(
                        'fixed top-0 left-0 z-50 h-screen flex flex-col',
                        'bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-border',
                        'transition-all duration-300 ease-in-out shadow-2xl',
                        isCollapsed ? 'w-20' : 'w-64',
                        'lg:translate-x-0',
                        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    )}
                >
                    {/* Logo & Toggle */}
                    <div className={cn(
                        "flex h-16 items-center border-b border-border transition-all duration-300",
                        isCollapsed ? "justify-center px-0" : "px-6"
                    )}>
                        <div className={cn("flex items-center gap-3 min-w-0 transition-opacity duration-300", isCollapsed ? "justify-center" : "flex-1")}>
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            {!isCollapsed && (
                                <div className="truncate flex-1">
                                    <p className="text-sm font-bold text-[var(--sidebar-foreground)] leading-none truncate">{t('app.name', 'GraviSales')}</p>
                                    <p className="text-[10px] text-[var(--sidebar-foreground)]/40 mt-1 whitespace-nowrap truncate">CRM Platform</p>
                                </div>
                            )}
                        </div>

                        {!isCollapsed && (
                            <button
                                onClick={() => setIsCollapsed(true)}
                                className="hidden lg:flex p-2 rounded-lg text-[var(--sidebar-foreground)]/40 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] transition-colors ml-2"
                            >
                                <PanelLeftClose className="w-5 h-5" />
                            </button>
                        )}

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-lg text-[var(--sidebar-foreground)]/40 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {isCollapsed && (
                        <div className="hidden lg:flex justify-center py-4 border-b border-border">
                            <button
                                onClick={() => setIsCollapsed(false)}
                                className="p-2 rounded-lg text-[var(--sidebar-foreground)]/40 hover:text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-hover)] transition-colors"
                            >
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className={cn(
                        "flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden transition-all duration-300",
                        isCollapsed ? "px-2" : "px-3"
                    )}>
                        {navigation.map((item) => {
                            const isActive = item.href === '/'
                                ? location.pathname === '/'
                                : location.pathname.startsWith(item.href);

                            return (
                                <Tooltip key={item.href} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <NavLink
                                            to={item.href}
                                            end={item.href === '/'}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                                'group relative flex items-center gap-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex-nowrap whitespace-nowrap w-full',
                                                isActive
                                                    ? 'bg-[var(--sidebar-active)]/10 text-[var(--sidebar-active)] shadow-sm'
                                                    : 'text-[var(--sidebar-foreground)]/50 hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]/90',
                                                isCollapsed ? "justify-center px-0 flex-col" : "px-3"
                                            )}
                                        >
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--sidebar-active)] rounded-r-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            )}
                                            <item.icon className={cn(
                                                'w-5 h-5 shrink-0 transition-all duration-200 group-hover:scale-110',
                                                isActive ? 'text-[var(--sidebar-active)]' : 'text-[var(--sidebar-foreground)]/40 group-hover:text-[var(--sidebar-foreground)]/90'
                                            )} />
                                            {!isCollapsed && (
                                                <span className="truncate flex-1">{item.name}</span>
                                            )}
                                        </NavLink>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right" sideOffset={20} className="bg-[var(--sidebar)] border-border text-[var(--sidebar-foreground)] shadow-xl">
                                            {item.name}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            );
                        })}
                    </nav>

                    {/* User section at bottom */}
                    <div className="px-3 py-4 border-t border-border">
                        <div className={cn(
                            "flex items-center rounded-xl hover:bg-[var(--sidebar-hover)] transition-colors cursor-pointer flex-nowrap whitespace-nowrap py-2.5 min-h-[44px]",
                            isCollapsed ? "justify-center px-0 flex-col" : "px-3 gap-3"
                        )}>
                            <Avatar className="w-8 h-8 shrink-0 border border-border mx-auto">
                                <AvatarImage src={undefined} />
                                <AvatarFallback className="text-[10px] bg-[var(--sidebar-active)]/30 text-[var(--sidebar-active)]">
                                    {getInitials(username)}
                                </AvatarFallback>
                            </Avatar>
                            {!isCollapsed && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-[var(--sidebar-foreground)]/80 truncate">{username}</p>
                                    <p className="text-[10px] text-[var(--sidebar-foreground)]/30 truncate">Admin</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <div className={cn(
                    "flex flex-col flex-1 min-h-screen min-w-0 transition-all duration-300",
                    isCollapsed ? "dashboard-offset-collapsed" : "dashboard-offset"
                )}>

                    {/* Topbar */}
                    <header className="sticky top-0 z-30 h-16 bg-background/80 border-b border-border backdrop-blur-xl topbar-padding flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 -ml-1 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Theme switcher */}
                            <ThemeSwitcher />

                            {/* Language switcher */}
                            <LanguageSwitcher />

                            <div className="w-px h-6 bg-border mx-1" />

                            {/* Notifications */}
                            <button className="relative p-2.5 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
                                <Bell className="w-4.5 h-4.5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                            </button>

                            <div className="w-px h-6 bg-border mx-1" />

                            {/* User Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-accent transition-all cursor-pointer border border-transparent hover:border-border">
                                        <Avatar className="w-8 h-8">
                                            <AvatarImage src={undefined} />
                                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                                                {getInitials(username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-foreground hidden md:block">
                                            {username}
                                        </span>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)] overflow-hidden !p-2">
                                    <DropdownMenuLabel className="font-normal w-full overflow-hidden !px-4">
                                        <div className="flex flex-col gap-1 min-w-0 w-full">
                                            <p className="text-sm font-semibold text-foreground truncate block w-full">{username}</p>
                                            <p className="text-xs text-muted-foreground truncate block w-full" title="user@example.com">user@example.com</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="!px-4 cursor-pointer">
                                        <User className="w-4 h-4" />
                                        {t('nav.profile', 'Профиль')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="!px-4 cursor-pointer">
                                        <Settings className="w-4 h-4" />
                                        {t('nav.settings', 'Настройки')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:bg-destructive/10 focus:text-destructive !px-4 cursor-pointer"
                                        onClick={logout}
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {t('nav.logout', 'Выйти')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 main-padding overflow-y-auto">
                        <div className="w-full">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </TooltipProvider>
    );
}
