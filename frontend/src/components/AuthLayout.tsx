/**
 * Auth layout with split-screen design: form on the left, hero on the right.
 * Premium responsive layout — form fills left half, hero fills right half.
 *
 * @example
 * <AuthLayout>
 *   <LoginForm />
 * </AuthLayout>
 */
import type { ReactNode, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, TrendingUp } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

interface AuthLayoutProps {
    /** The form content to render on the left side */
    children: ReactNode;
}

/**
 * Feature card displayed in the hero section.
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
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/10 backdrop-blur-sm
                    border border-white/10
                    transition-all duration-300 hover:bg-white/15 hover:scale-[1.01]">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-white text-base">{title}</h3>
                <p className="text-white/80 text-sm mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

export function AuthLayout({ children }: AuthLayoutProps): ReactElement {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[var(--color-bg-secondary)]">
            {/* Left Panel — Form */}
            <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 bg-white">
                {/* Header */}
                <header className="flex items-center justify-between px-8 py-5 md:px-12 lg:px-16">
                    <div className="flex items-center gap-3">
                        {/* Logo - Cyan #19cbfe */}
                        <div className="w-10 h-10 rounded-xl bg-[#19cbfe] flex items-center justify-center shadow-lg shadow-cyan-100">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-[#19cbfe]">
                            {t('app.name')}
                        </span>
                    </div>
                    <LanguageSwitcher />
                </header>

                {/* Form Content — centered vertically but left-aligned content */}
                <main className="flex-1 flex items-center justify-center px-8 py-12 md:px-12 lg:px-16 overflow-y-auto">
                    <div className="w-full max-w-[560px] animate-fade-in my-auto">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="px-8 py-5 md:px-12 lg:px-16 text-center lg:text-left">
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                        © {new Date().getFullYear()} GraviSales · Powered by GraviBase
                    </p>
                </footer>
            </div>

            {/* Right Panel — Hero (50% width on desktop) - Cyan background #19cbfe */}
            <div
                className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center items-center px-16 xl:px-20 py-16"
                style={{
                    background: '#19cbfe',
                }}
            >
                <div className="w-full max-w-[540px] animate-slide-in-right">
                    {/* Tagline */}
                    <h2
                        className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] mb-6"
                        dangerouslySetInnerHTML={{ __html: t('hero.title') }}
                    />
                    <p className="text-white/90 text-lg mb-12 leading-relaxed max-w-[480px]">
                        {t('hero.subtitle')}
                    </p>

                    {/* Feature Cards */}
                    <div className="space-y-12">
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-white" />}
                            title={t('hero.feature1.title')}
                            description={t('hero.feature1.description')}
                        />
                        <FeatureCard
                            icon={<TrendingUp className="w-6 h-6 text-white" />}
                            title={t('hero.feature2.title')}
                            description={t('hero.feature2.description')}
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-white" />}
                            title={t('hero.feature3.title')}
                            description={t('hero.feature3.description')}
                        />
                    </div>

                    {/* Decorative dots */}
                    <div className="mt-12 flex gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-white/50" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
                    </div>
                </div>
            </div>
        </div>
    );
}
