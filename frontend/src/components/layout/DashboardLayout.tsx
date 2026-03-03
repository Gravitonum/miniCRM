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
import { NavLink, useNavigate } from 'react-router-dom';
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
import { cn } from '../../lib/utils';

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
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const username = localStorage.getItem('gravisales_username') || 'User';

    /** Получить инициалы из имени */
    function getInitials(name: string): string {
        return name.slice(0, 2).toUpperCase();
    }

    const navigation = [
        { name: t('navigation.dashboard', 'Dashboard'), href: '/', icon: LayoutDashboard },
        { name: t('navigation.deals', 'Сделки'), href: '/deals', icon: Briefcase },
    ];

    return (
        <div className="min-h-screen bg-secondary/30">
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
                    'fixed top-0 left-0 z-50 h-screen w-72 flex flex-col',
                    'bg-[var(--sidebar)] text-[var(--sidebar-foreground)]',
                    'transition-transform duration-300 ease-in-out shadow-2xl',
                    'lg:translate-x-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                {/* Logo */}
                <div className="flex h-20 items-center px-6 border-b border-white/5">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white leading-none">{t('app.name', 'GraviSales')}</p>
                            <p className="text-[10px] text-white/40 mt-0.5">CRM Platform</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                    <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-3 mb-3">
                        {t('navigation.main', 'Навигация')}
                    </p>
                    {navigation.map((item) => (
                        <NavLink
                            key={item.href}
                            to={item.href}
                            end={item.href === '/'}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-indigo-500/20 text-white border border-indigo-500/30 shadow-sm'
                                        : 'text-white/50 hover:bg-white/5 hover:text-white/90'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon className={cn('w-4.5 h-4.5 shrink-0', isActive ? 'text-indigo-400' : 'text-white/40')} />
                                    {item.name}
                                    {isActive && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User section at bottom */}
                <div className="px-3 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <Avatar className="w-8 h-8 border border-white/10">
                            <AvatarImage src={undefined} />
                            <AvatarFallback className="text-[10px] bg-indigo-500/30 text-indigo-300">
                                {getInitials(username)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-white/80 truncate">{username}</p>
                            <p className="text-[10px] text-white/30">Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="lg:ml-72 flex flex-col min-h-screen transition-all duration-300">

                {/* Topbar */}
                <header className="sticky top-0 z-30 h-16 bg-background/80 border-b border-border backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-1 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:block">
                            <h2 className="text-sm font-semibold text-foreground">{t('dashboard.title', 'Dashboard')}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
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
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-semibold text-foreground">{username}</p>
                                        <p className="text-xs text-muted-foreground">user@example.com</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    <User className="w-4 h-4" />
                                    {t('navigation.profile', 'Профиль')}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="w-4 h-4" />
                                    {t('navigation.settings', 'Настройки')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                    onClick={logout}
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t('auth.logout', 'Выйти')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
