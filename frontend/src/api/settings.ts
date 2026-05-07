/**
 * API-модуль для страницы Настроек:
 * Управление пользователями, воронками продаж, правилами переходов и компанией.
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

/** Режим переходов воронки: any — свободный, restricted — только по правилам */
export type TransitionMode = 'any' | 'restricted';

export interface Funnel {
    id: string;
    name: string;
    isActive: boolean;
    companyId?: string;
    /** Режим переходов между этапами (по умолчанию 'any') */
    transitionMode?: TransitionMode;
}

export interface FunnelStage {
    id: string;
    name: string;
    statusType: 'open' | 'won' | 'lost';
    funnelId: string;
    orderIdx: number;
    color?: string;
}

/**
 * Правило перехода между этапами воронки.
 * Если fromStageId = null — переход разрешён из любого этапа.
 * Если allowedRoles = [] — переход разрешён всем ролям.
 *
 * @example
 * // Из любого этапа в "Выиграно" для всех:
 * { funnelId: '...', fromStageId: null, toStageId: 'won-stage-id', allowedRoles: [] }
 */
export interface StageTransitionRule {
    id: string;
    funnelId: string;
    /** null означает "из любого этапа" */
    fromStageId: string | null;
    toStageId: string;
    /** Список ролей, которым разрешён переход. Пустой массив = все роли */
    allowedRoles: string[];
    isDefault: boolean;
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
    /** Получить все воронки компании */
    async getAll(): Promise<Funnel[]> {
        const resp = await apiClient.get('/application/api/CrmFunnel');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return unwrap(resp.data as any[]).map((f: any) => ({
            id: f.id,
            name: f.name || '—',
            isActive: f.isActive !== false,
            companyId: f.company?.id || f.companyId,
            transitionMode: (f.transitionMode as TransitionMode) || 'any',
        }));
    },

    /** Получить этапы конкретной воронки */
    async getStages(funnelId: string): Promise<FunnelStage[]> {
        const resp = await apiClient.get('/application/api/FunnelStage', {
            params: { filter: `funnel.id=="${funnelId}"` }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const stages = unwrap(resp.data as any[]).map((s: any) => ({
            id: s.id,
            name: s.name || '',
            statusType: s.statusType || 'open',
            funnelId: s.funnel?.id || s.funnelId || funnelId,
            orderIdx: s.orderIdx || 0,
            color: s.color || (s.statusType === 'won' ? '#10b981' : s.statusType === 'lost' ? '#ef4444' : '#3b82f6')
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
        const currentResp = await apiClient.get<any>(`/application/api/CrmFunnel/${id}`);
        const payload = { ...currentResp.data };

        if (data.name !== undefined) payload.name = data.name;
        if (data.isActive !== undefined) payload.isActive = data.isActive;
        if (data.companyId !== undefined) payload.company = data.companyId ? { id: data.companyId } : null;
        if (data.transitionMode !== undefined) payload.transitionMode = data.transitionMode;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdOn, updatedOn, createdBy, updatedBy, version, ...finalPayload } = payload;

        await apiClient.put(`/application/api/CrmFunnel`, finalPayload);
    },

    async deleteFunnel(id: string): Promise<void> {
        await apiClient.delete(`/application/api/CrmFunnel/${id}`);
    },

    async createStage(data: Omit<FunnelStage, 'id'>): Promise<FunnelStage> {
        const resp = await apiClient.post('/application/api/FunnelStage', {
            name: data.name,
            statusType: data.statusType,
            funnelId: data.funnelId,
            orderIdx: data.orderIdx,
            color: data.color || (data.statusType === 'won' ? '#10b981' : data.statusType === 'lost' ? '#ef4444' : '#3b82f6'),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s = resp.data as any;
        return {
            id: s.id, name: s.name, statusType: s.statusType,
            funnelId: s.funnelId, orderIdx: s.orderIdx, color: s.color
        };
    },

    async updateStage(id: string, data: Partial<Omit<FunnelStage, 'id'>>): Promise<void> {
        const currentResp = await apiClient.get<any>(`/application/api/FunnelStage/${id}`);
        const payload = { ...currentResp.data };

        if (data.name !== undefined) payload.name = data.name;
        if (data.statusType !== undefined) payload.statusType = data.statusType;
        if (data.funnelId !== undefined) payload.funnel = data.funnelId ? { id: data.funnelId } : null;
        if (data.orderIdx !== undefined) payload.orderIdx = data.orderIdx;
        if (data.color !== undefined) payload.color = data.color;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdOn, updatedOn, createdBy, updatedBy, version, ...finalPayload } = payload;

        await apiClient.put(`/application/api/FunnelStage`, finalPayload);
    },

    async deleteStage(id: string): Promise<void> {
        await apiClient.delete(`/application/api/FunnelStage/${id}`);
    }
};

/**
 * API для управления правилами переходов между этапами воронки.
 *
 * @example
 * // Получить все правила воронки:
 * const rules = await transitionRulesApi.getByFunnel(funnelId);
 */
export const transitionRulesApi = {
    /**
     * Получить все правила переходов для конкретной воронки.
     * @param funnelId — ID воронки
     */
    async getByFunnel(funnelId: string): Promise<StageTransitionRule[]> {
        const resp = await apiClient.get('/application/api/StageTransitionRule', {
            params: { filter: `funnel.id=="${funnelId}"` }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return unwrap(resp.data as any[]).map((r: any): StageTransitionRule => ({
            id: r.id,
            funnelId: r.funnel?.id || funnelId,
            fromStageId: r.fromStage?.id ?? null,
            toStageId: r.toStage?.id || '',
            allowedRoles: r.allowedRoles ? JSON.parse(r.allowedRoles) : [],
            isDefault: r.isDefault || false,
        }));
    },

    /**
     * Создать новое правило перехода.
     * @param funnelId — ID воронки
     * @param fromStageId — ID исходного этапа (null = из любого)
     * @param toStageId — ID целевого этапа
     * @param allowedRoles — массив ролей (пустой = все роли)
     * @param isDefault — флаг дефолтного правила
     */
    async create(
        funnelId: string,
        fromStageId: string | null,
        toStageId: string,
        allowedRoles: string[] = [],
        isDefault = false
    ): Promise<StageTransitionRule> {
        const body: Record<string, unknown> = {
            funnel: { id: funnelId },
            toStage: { id: toStageId },
            allowedRoles: JSON.stringify(allowedRoles),
            isDefault,
        };
        if (fromStageId) body.fromStage = { id: fromStageId };

        const resp = await apiClient.post('/application/api/StageTransitionRule', body);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = resp.data as any;
        return {
            id: r.id,
            funnelId: r.funnel?.id || funnelId,
            fromStageId: r.fromStage?.id ?? null,
            toStageId: r.toStage?.id || toStageId,
            allowedRoles: r.allowedRoles ? JSON.parse(r.allowedRoles) : [],
            isDefault: r.isDefault || false,
        };
    },

    /**
     * Удалить правило перехода.
     * @param id — ID правила
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/application/api/StageTransitionRule/${id}`);
    },

    /**
     * Создать набор линейных правил для воронки (дефолтная схема).
     * Правила: вперёд/назад между соседними этапами, из любого в won/lost.
     * @param funnelId — ID воронки
     * @param stages — отсортированные этапы воронки
     */
    async seedDefaultRules(funnelId: string, stages: FunnelStage[]): Promise<void> {
        const openStages = stages.filter(s => s.statusType === 'open');
        const wonLostStages = stages.filter(s => s.statusType === 'won' || s.statusType === 'lost');

        const createPromises: Promise<StageTransitionRule>[] = [];

        // Линейные переходы вперёд и назад между соседними open-этапами
        for (let i = 0; i < openStages.length; i++) {
            const curr = openStages[i];
            if (i + 1 < openStages.length) {
                // вперёд
                createPromises.push(transitionRulesApi.create(funnelId, curr.id, openStages[i + 1].id));
            }
            if (i - 1 >= 0) {
                // назад
                createPromises.push(transitionRulesApi.create(funnelId, curr.id, openStages[i - 1].id));
            }
        }

        // Из любого open-этапа в won/lost
        for (const terminal of wonLostStages) {
            createPromises.push(transitionRulesApi.create(funnelId, null, terminal.id));
        }

        await Promise.allSettled(createPromises);
    },
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
        // Fetch current company data to ensure we have all required fields (like orgCode)
        const currentResp = await apiClient.get<Company>(`/application/api/Company/${id}`);
        const current = currentResp.data;

        // Merge current data with updates
        const fullPayload = {
            ...current,
            ...data,
            id // Ensure ID is present in body
        };

        // Strip system-only/read-only fields that might cause 400 Bad Request
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdOn, updatedOn, createdBy, updatedBy, version, ...payload } = fullPayload as any;

        // Use PUT on the base URL for the update (typical GraviBase pattern for some entities)
        await apiClient.put(`/application/api/Company`, payload);
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

