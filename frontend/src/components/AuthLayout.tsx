/**
 * AuthLayout — split-screen layout для страниц аутентификации.
 * Форма слева, hero-блок справа.
 *
 * @example
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 */
import type { ReactNode, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, TrendingUp, Sparkles } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthLayoutProps {
    /** Содержимое формы слева */
    children: ReactNode;
}

/**
 * Карточка фичи в hero-блоке
 */
function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: ReactNode;
    title: string;
    description: string;
}): ReactElement {
    return (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/12 hover:scale-[1.01]">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-white/70 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

export function AuthLayout({ children }: AuthLayoutProps): ReactElement {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-secondary/40">
            {/* ── Left Panel — Form ── */}
            <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-background">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-5 md:px-12 lg:px-14">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19cbfe] to-[#0090cc] flex items-center justify-center shadow-lg shadow-cyan-100">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-[#19cbfe]">
                            {t('app.name', 'GraviSales')}
                        </span>
                    </div>
                    <LanguageSwitcher />
                </header>

                {/* Form — vertically centred */}
                <main className="flex-1 flex items-center justify-center px-8 py-12 md:px-12 lg:px-14 overflow-y-auto">
                    <div className="w-full max-w-[520px] animate-fade-in">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="px-8 py-4 md:px-12 lg:px-14">
                    <p className="text-xs text-muted-foreground">
                        © {new Date().getFullYear()} GraviSales · Powered by GraviBase
                    </p>
                </footer>
            </div>

            {/* ── Right Panel — Hero ── */}
            <div
                className="hidden lg:flex lg:w-[48%] xl:w-1/2 flex-col justify-center items-center px-14 xl:px-20 py-16 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0d9fd4 0%, #19cbfe 50%, #38d6fe 100%)' }}
            >
                {/* Декоративные пятна */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

                <div className="relative w-full max-w-[500px] animate-slide-in-right">
                    <h2
                        className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-5"
                        dangerouslySetInnerHTML={{ __html: t('hero.title') }}
                    />
                    <p className="text-white/85 text-base mb-10 leading-relaxed max-w-[440px]">
                        {t('hero.subtitle')}
                    </p>

                    <div className="flex flex-col gap-6">
                        <FeatureCard
                            icon={<BarChart3 className="w-5 h-5 text-white" />}
                            title={t('hero.feature1.title')}
                            description={t('hero.feature1.description')}
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-5 h-5 text-white" />}
                            title={t('hero.feature2.title')}
                            description={t('hero.feature2.description')}
                        />
                        <FeatureCard
                            icon={<Users className="w-5 h-5 text-white" />}
                            title={t('hero.feature3.title')}
                            description={t('hero.feature3.description')}
                        />
                    </div>

                    <div className="mt-10 flex gap-2">
                        <div className="w-8 h-1.5 rounded-full bg-white/60" />
                        <div className="w-2 h-1.5 rounded-full bg-white/30" />
                        <div className="w-2 h-1.5 rounded-full bg-white/20" />
                    </div>
                </div>
            </div>
        </div>
    );
}
