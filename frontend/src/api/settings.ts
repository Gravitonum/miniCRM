/**
 * API-модуль для страницы Настроек:
 * Управление пользователями, воронками продаж и компанией.
 */
import apiClient from './client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface User {
    id: string;
    username: string;
    email?: string;
    orgCode?: string;
    isActive: boolean;
}

export interface Company {
    id: string;
    name: string;
    orgCode: string;
    timezone?: string;
    currency?: string;
    defaultLanguage?: string;
    konturApiKey?: string;
}

export interface Funnel {
    id: string;
    name: string;
    isActive: boolean;
    companyId?: string;
}

export interface FunnelStage {
    id: string;
    name: string;
    statusType: 'open' | 'won' | 'lost';
    funnelId: string;
    orderIdx: number;
}

// ─────────────────────────────────────────
// Helper
// ─────────────────────────────────────────

function unwrap<T>(raw: T[] | { data: T[] } | T): T[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw) {
        const d = (raw as { data: T[] }).data;
        return Array.isArray(d) ? d : [];
    }
    return [];
}

// ─────────────────────────────────────────
// API Objects
// ─────────────────────────────────────────

export const usersApi = {
    /** Получить всех пользователей (например, по orgCode, хотя обычно платформа фильтрует сама или надо фильтровать) */
    async getAll(orgCode: string): Promise<User[]> {
        const resp = await apiClient.get('/application/api/Users', {
            params: { filter: `orgCode=="${orgCode}"` }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return unwrap(resp.data as any[]).map((u: any) => ({
            id: u.id,
            username: u.username || '',
            email: u.email,
            orgCode: u.orgCode,
            isActive: u.isActive !== false,
        }));
    },

    /** Деактивировать / активировать пользователя */
    async toggleActive(id: string, isActive: boolean): Promise<void> {
        await apiClient.put(`/application/api/Users/${id}`, { isActive });
    }
};

export const funnelsApi = {
    /** Получить все воронки компании (могут фильтроваться по companyId если нужно, но пока просто все) */
    async getAll(): Promise<Funnel[]> {
        const resp = await apiClient.get('/application/api/CrmFunnel');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return unwrap(resp.data as any[]).map((f: any) => ({
            id: f.id,
            name: f.name || '—',
            isActive: f.isActive !== false,
            companyId: f.companyId,
        }));
    },

    /** Получить этапы конкретной воронки */
    async getStages(funnelId: string): Promise<FunnelStage[]> {
        const resp = await apiClient.get('/application/api/FunnelStage', {
            params: { filter: `funnelId=="${funnelId}"` }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stages = unwrap(resp.data as any[]).map((s: any) => ({
            id: s.id,
            name: s.name || '',
            statusType: s.statusType || 'open',
            funnelId: s.funnelId,
            orderIdx: s.orderIdx || 0,
        }));
        return stages.sort((a, b) => a.orderIdx - b.orderIdx);
    },

    async createFunnel(name: string, companyId?: string): Promise<Funnel> {
        const resp = await apiClient.post('/application/api/CrmFunnel', {
            name, isActive: true, companyId
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const f = resp.data as any;
        return { id: f.id, name: f.name, isActive: f.isActive !== false, companyId: f.companyId };
    },

    async updateFunnel(id: string, data: Partial<Omit<Funnel, 'id'>>): Promise<void> {
        await apiClient.put(`/application/api/CrmFunnel/${id}`, data);
    },

    async createStage(data: Omit<FunnelStage, 'id'>): Promise<FunnelStage> {
        const resp = await apiClient.post('/application/api/FunnelStage', {
            name: data.name,
            statusType: data.statusType,
            funnelId: data.funnelId,
            orderIdx: data.orderIdx,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = resp.data as any;
        return {
            id: s.id, name: s.name, statusType: s.statusType,
            funnelId: s.funnelId, orderIdx: s.orderIdx
        };
    },

    async updateStage(id: string, data: Partial<Omit<FunnelStage, 'id'>>): Promise<void> {
        await apiClient.put(`/application/api/FunnelStage/${id}`, data);
    },

    async deleteStage(id: string): Promise<void> {
        await apiClient.delete(`/application/api/FunnelStage/${id}`);
    }
};

export const companyApi = {
    /** Получить данные компании по orgCode */
    async getByOrgCode(orgCode: string): Promise<Company | null> {
        const resp = await apiClient.get('/application/api/Company', {
            params: { filter: `orgCode=="${orgCode}"` }
        });
        const companies = unwrap(resp.data);
        if (!companies.length) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c = companies[0] as any;
        return {
            id: c.id,
            name: c.name || '',
            orgCode: c.orgCode,
            timezone: c.timezone,
            currency: c.currency,
            defaultLanguage: c.defaultLanguage,
            konturApiKey: c.konturApiKey,
        };
    },

    /** Обновить данные компании */
    async update(id: string, data: Partial<Omit<Company, 'id' | 'orgCode'>>): Promise<void> {
        await apiClient.put(`/application/api/Company/${id}`, data);
    }
};

// ─────────────────────────────────────────
// Invite API
// ─────────────────────────────────────────

export interface CompanyInvite {
    id: string;
    email: string;
    role: string;
    companyId: string;
    token: string;
    isAccepted: boolean;
    expiresAt?: string;
}

export const inviteApi = {
    /**
     * Создать приглашение по email + роль
     * @example inviteApi.create(companyId, 'user@example.com', 'manager')
     */
    async create(companyId: string, email: string, role: string): Promise<CompanyInvite> {
        const resp = await apiClient.post('/application/api/CompanyInvite', {
            companyId,
            email,
            role,
            isAccepted: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d = resp.data as any;
        return {
            id: d.id,
            email: d.email,
            role: d.role,
            companyId: d.companyId,
            token: d.token || '',
            isAccepted: d.isAccepted || false,
            expiresAt: d.expiresAt,
        };
    },

    /**
     * Получить все приглашения компании
     */
    async getAll(companyId: string): Promise<CompanyInvite[]> {
        const resp = await apiClient.get('/application/api/CompanyInvite', {
            params: { filter: `companyId=="${companyId}"` },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return unwrap(resp.data as any[]).map((d: any) => ({
            id: d.id,
            email: d.email,
            role: d.role,
            companyId: d.companyId,
            token: d.token || '',
            isAccepted: d.isAccepted || false,
            expiresAt: d.expiresAt,
        }));
    },

    /**
     * Отозвать приглашение
     */
    async revoke(id: string): Promise<void> {
        await apiClient.delete(`/application/api/CompanyInvite/${id}`);
    },
};

