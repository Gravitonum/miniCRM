/**
 * PlatformAdminLoginPage — страница входа для суперадминистраторов платформы.
 * Отдельная аутентификация через PlatformAdmin entity.
 *
 * @example
 * Доступна по роуту /platform-admin/login
 */
import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { platformAdminApi, savePlatformAdminSession } from '../../api/platformAdmin';

/** Страница логина суперадминистратора */
export function PlatformAdminLoginPage(): ReactElement {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Обработать вход в панель администратора.
     */
    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Введите email и пароль');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const admin = await platformAdminApi.login(email.trim(), password);
            if (!admin) {
                setError('Неверные данные или аккаунт деактивирован');
                return;
            }
            savePlatformAdminSession(admin);
            navigate('/platform-admin/dashboard', { replace: true });
        } catch (err) {
            console.error('Platform admin login error:', err);
            setError('Ошибка сети. Проверьте подключение.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background gradient */}
            <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/30 via-background to-violet-950/20 pointer-events-none" />

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-border bg-gradient-to-r from-primary/5 to-violet-500/5 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-xl font-bold text-foreground">Панель SuperAdmin</h1>
                        <p className="text-sm text-muted-foreground mt-1">Только для администраторов платформы</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={e => void handleSubmit(e)} className="p-8 space-y-5">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground">Email</label>
                            <input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@platform.ru"
                                autoFocus
                                disabled={loading}
                                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-foreground">Пароль</label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            id="admin-login-btn"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>

                    <div className="px-8 pb-6 text-center">
                        <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                            ← Вернуться в приложение
                        </a>
                    </div>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4 opacity-50">
                    Платформа GraviSales · Панель управления · Только служебный доступ
                </p>
            </div>
        </div>
    );
}
