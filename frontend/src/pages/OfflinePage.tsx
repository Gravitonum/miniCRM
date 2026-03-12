/**
 * OfflinePage — offline fallback страница для PWA.
 * Отображается когда пользователь потерял интернет.
 *
 * @example
 * Автоматически показывается Service Worker'ом при отсутствии сети.
 */
import type { ReactElement } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/** Страница-заглушка для оффлайн режима */
export function OfflinePage(): ReactElement {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-40" />
                    <div className="relative w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                        <WifiOff className="w-10 h-10 text-primary" />
                    </div>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Нет подключения</h1>
                    <p className="text-muted-foreground text-sm">
                        Вы находитесь в оффлайн-режиме. Проверьте подключение к интернету и попробуйте снова.
                    </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 text-left space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Возможные причины</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Отсутствует Wi-Fi или мобильный интернет</li>
                        <li>• Настройки сети проксируют запросы</li>
                        <li>• Временные проблемы на сервере</li>
                    </ul>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Повторить попытку
                </button>
            </div>
        </div>
    );
}
