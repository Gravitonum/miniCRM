import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Bell,
    Sun,
    Moon,
    HelpCircle,
    LogOut,
    User,
    Settings,
    Menu,
    X,
    Briefcase
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Dropdown, DropdownItem } from '../ui/Dropdown';
import { cn } from '../../lib/utils';

// Placeholder auth hook if not exists
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
    const [isDarkMode, setIsDarkMode] = useState(false); // Placeholder since theme logic isn't fully implemented yet

    // Get user info from storage
    const username = localStorage.getItem('gravisales_username') || 'User';
    // Simple check for avatar - in real app would verify if it's a valid URL
    const avatarUrl = null;

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: t('navigation.deals', 'Сделки'), href: '/deals', icon: Briefcase },
    ];


    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 left-0 z-50 h-screen w-72 bg-[#1e1e2d] text-white transition-transform duration-300 lg:translate-x-0 ease-in-out shadow-2xl",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Logo Area */}
                <div className="flex h-20 items-center px-8 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#6366f1] flex items-center justify-center text-xl font-bold">
                            N
                        </div>
                        <span className="text-xl font-bold tracking-tight">Nexus</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="ml-auto lg:hidden text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 mt-6">
                    {navigation.map((item) => {
                        return (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                                    isActive
                                        ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20"
                                        : "text-gray-400 hover:bg-[#2b2b40] hover:text-white"
                                )}
                            >
                                <item.icon className={cn("w-5 h-5 transition-colors")} />
                                {item.name}
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-72 flex flex-col min-h-screen transition-all duration-300">

                {/* Navbar */}
                <header className="sticky top-0 z-30 h-20 bg-white border-b border-gray-100 px-4 sm:px-8 flex items-center justify-between shadow-sm/50 backdrop-blur-xl bg-white/80">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 -ml-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">
                            {t('dashboard.title', 'Dashboard')}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        {/* Notifications */}
                        <button className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        {/* Help */}
                        <button className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all hidden sm:block">
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        {/* Theme Toggle */}
                        <button
                            className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            onClick={() => setIsDarkMode(!isDarkMode)}
                        >
                            {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                        </button>

                        <div className="h-8 w-px bg-gray-200 mx-2 hidden sm:block"></div>

                        {/* User Profile */}
                        <Dropdown
                            align="right"
                            trigger={
                                <button className="flex items-center gap-3 p-1.5 rounded-full hover:bg-gray-50 transition-all pr-4 border border-transparent hover:border-gray-200 cursor-pointer">
                                    <Avatar
                                        src={avatarUrl}
                                        fallback={username}
                                        className="h-9 w-9 border-2 border-white shadow-sm"
                                    />
                                    <div className="text-left hidden md:block">
                                        <p className="text-sm font-semibold text-gray-700 leading-none">{username}</p>
                                        <p className="text-xs text-gray-400 mt-1">Admin</p>
                                    </div>
                                </button>
                            }
                        >
                            <div className="px-4 py-3 border-b border-gray-100 mb-1">
                                <p className="text-sm font-semibold text-gray-900">{username}</p>
                                <p className="text-xs text-gray-500 truncate">user@example.com</p>
                            </div>
                            <DropdownItem icon={<User className="w-4 h-4" />}>
                                Profile
                            </DropdownItem>
                            <DropdownItem icon={<Settings className="w-4 h-4" />}>
                                Settings
                            </DropdownItem>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <DropdownItem
                                icon={<LogOut className="w-4 h-4" />}
                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={logout}
                            >
                                Log out
                            </DropdownItem>
                        </Dropdown>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
