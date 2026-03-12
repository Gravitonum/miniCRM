import apiClient from './client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlatformAdmin {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    isActive: boolean;
}

export interface TenantCompany {
    id: string;
    name: string;
    orgCode: string;
    currency?: string;
    timezone?: string;
    defaultLanguage?: string;
    isBlocked: boolean;
    blockedReason?: string;
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Нормализует ответ GraviBase: массив или { data: [...] } */
function unwrap<T>(raw: T[] | { data: T[] } | T): T[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw) {
        const d = (raw as { data: T[] }).data;
        return Array.isArray(d) ? d : [];
    }
    return [];
}

// ─── Platform Admin API ──────────────────────────────────────────────────────

export const platformAdminApi = {
    /**
     * Попытка входа: сравниваем email+password с записями в PlatformAdmin.
     * Возвращает объект администратора или null.
     *
     * @param email - email администратора
     * @param password - пароль в plaintext (сравнивается с passwordHash)
     * @example platformAdminApi.login('admin@example.com', 'secret')
     */
    async login(email: string, password: string): Promise<PlatformAdmin | null> {
        interface RawAdmin { id: string; email: string; name: string; passwordHash: string; isActive: boolean; }
        const resp = await apiClient.get<RawAdmin[] | { data: RawAdmin[] }>('/application/api/PlatformAdmin', {
            params: { filter: `email=="${email}"` }
        });
        const list = unwrap(resp.data);
        const admin = list.find(a => a.email === email && a.passwordHash === password && a.isActive !== false);
        if (!admin) return null;
        return {
            id: admin.id,
            email: admin.email,
            name: admin.name || admin.email,
            passwordHash: admin.passwordHash,
            isActive: admin.isActive !== false,
        };
    },

    /**
     * Получить список всех тенантов (Company).
     * @example platformAdminApi.getCompanies()
     */
    async getCompanies(): Promise<TenantCompany[]> {
        interface RawCompany { id: string; name: string; orgCode: string; currency?: string; timezone?: string; defaultLanguage?: string; isBlocked?: boolean; blockedReason?: string; }
        const resp = await apiClient.get<RawCompany[] | { data: RawCompany[] }>('/application/api/Company');
        return unwrap(resp.data).map(c => ({
            id: c.id,
            name: c.name || c.orgCode,
            orgCode: c.orgCode,
            currency: c.currency,
            timezone: c.timezone,
            defaultLanguage: c.defaultLanguage,
            isBlocked: c.isBlocked === true,
            blockedReason: c.blockedReason,
        }));
    },

    /**
     * Заблокировать тенанта.
     * @param id - ID тенанта (Company)
     * @param reason - причина блокировки
     */
    async blockCompany(id: string, reason: string): Promise<void> {
        await apiClient.put(`/application/api/Company/${id}`, {
            isBlocked: true,
            blockedReason: reason,
        });
    },

    /**
     * Разблокировать тенанта.
     * @param id - ID тенанта (Company)
     */
    async unblockCompany(id: string): Promise<void> {
        await apiClient.put(`/application/api/Company/${id}`, {
            isBlocked: false,
            blockedReason: null,
        });
    },
};

// ─── Session helpers ─────────────────────────────────────────────────────────

const SESSION_KEY = 'platform_admin_session';

/**
 * Сохранить сессию платформенного администратора.
 */
export function savePlatformAdminSession(admin: PlatformAdmin): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: admin.id, email: admin.email, name: admin.name }));
}

/**
 * Получить текущую сессию администратора или null.
 */
export function getPlatformAdminSession(): { id: string; email: string; name: string } | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { id: string; email: string; name: string };
    } catch {
        return null;
    }
}

/**
 * Сбросить сессию платформенного администратора.
 */
export function clearPlatformAdminSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
}
