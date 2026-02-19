/**
 * Auth layout with split-screen design: form on the left, hero on the right.
 * Responsive layout that stacks on mobile.
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
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm
                    transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                {icon}
            </div>
            <div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-indigo-100 text-xs mt-0.5 leading-relaxed">{description}</p>
            </div>
        </div>
    );
}

export function AuthLayout({ children }: AuthLayoutProps): ReactElement {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left Panel — Form */}
            <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 sm:px-8">
                    <div className="flex items-center gap-2">
                        {/* Logo */}
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-[var(--color-text-primary)]">
                            {t('app.name')}
                        </span>
                    </div>
                    <LanguageSwitcher />
                </header>

                {/* Form Content */}
                <main className="flex-1 flex items-center justify-center px-6 py-8 sm:px-8">
                    <div className="w-full max-w-md animate-fade-in">
                        {children}
                    </div>
                </main>

                {/* Footer */}
                <footer className="px-6 py-4 sm:px-8 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                        © {new Date().getFullYear()} GraviSales. Powered by GraviBase.
                    </p>
                </footer>
            </div>

            {/* Right Panel — Hero */}
            <div
                className="hidden lg:flex flex-col justify-center p-12 xl:p-16
                    w-full lg:w-[480px] xl:w-[560px]"
                style={{ background: 'var(--color-bg-hero)' }}
            >
                <div className="animate-slide-in-right">
                    {/* Tagline */}
                    <h2
                        className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4"
                        dangerouslySetInnerHTML={{ __html: t('hero.title') }}
                    />
                    <p className="text-indigo-100 text-base mb-10 leading-relaxed">
                        {t('hero.subtitle')}
                    </p>

                    {/* Feature Cards */}
                    <div className="space-y-3">
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

                    {/* Decorative dots */}
                    <div className="mt-10 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                        <div className="w-2 h-2 rounded-full bg-white/25" />
                        <div className="w-2 h-2 rounded-full bg-white/15" />
                    </div>
                </div>
            </div>
        </div>
    );
}
