import apiClient from './client';

export interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: string;
    responsible: string;
    deadline?: string;
    clientCompanyId?: string;
    clientCompanyName?: string;
}

interface DealBackendModel {
    id: string;
    name: string;
    amountValue: number;
    stage: string;
    responsible: string;
    deadlineDate?: string | null;
    clientCompany?: { id: string; name?: string } | null;
}

export const dealsApi = {
    async getDeals(): Promise<Deal[]> {
        const response = await apiClient.get<DealBackendModel[] | { data: DealBackendModel[] }>('/application/api/Deal');
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);

        return data.map(d => ({
            id: d.id,
            name: d.name || 'Без названия',
            amount: d.amountValue || 0,
            stage: d.stage || 'prospecting',
            responsible: d.responsible || 'Не назначен',
            deadline: d.deadlineDate ? String(d.deadlineDate).split('T')[0] : undefined,
            clientCompanyId: d.clientCompany?.id,
            clientCompanyName: d.clientCompany?.name
        }));
    },

    async getDealById(id: string): Promise<Deal> {
        const response = await apiClient.get<DealBackendModel>(`/application/api/Deal/${id}`);
        const d = response.data;
        return {
            id: d.id,
            name: d.name || 'Без названия',
            amount: d.amountValue || 0,
            stage: d.stage || 'prospecting',
            responsible: d.responsible || 'Не назначен',
            deadline: d.deadlineDate ? String(d.deadlineDate).split('T')[0] : undefined,
            clientCompanyId: d.clientCompany?.id,
            clientCompanyName: d.clientCompany?.name
        };
    },

    async createDeal(deal: Omit<Deal, 'id' | 'clientCompanyName'>): Promise<Deal> {
        const payload = {
            name: deal.name,
            amountValue: deal.amount,
            stage: deal.stage,
            responsible: deal.responsible,
            deadlineDate: deal.deadline ? new Date(deal.deadline).toISOString() : null,
            clientCompany: deal.clientCompanyId ? { id: deal.clientCompanyId } : null,
        };
        const response = await apiClient.post<DealBackendModel>('/application/api/Deal', payload);
        const d = response.data;
        return {
            id: d.id,
            name: d.name || 'Без названия',
            amount: d.amountValue || 0,
            stage: d.stage || 'prospecting',
            responsible: d.responsible || 'Не назначен',
            deadline: d.deadlineDate ? String(d.deadlineDate).split('T')[0] : undefined,
            clientCompanyId: d.clientCompany?.id,
            clientCompanyName: d.clientCompany?.name
        };
    },

    async updateDeal(id: string, updates: Partial<Deal>): Promise<void> {
        const payload: Record<string, any> = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.amount !== undefined) payload.amountValue = updates.amount;
        if (updates.stage !== undefined) payload.stage = updates.stage;
        if (updates.responsible !== undefined) payload.responsible = updates.responsible;
        if (updates.deadline !== undefined) payload.deadlineDate = updates.deadline ? new Date(updates.deadline).toISOString() : null;
        if (updates.clientCompanyId !== undefined) payload.clientCompany = updates.clientCompanyId ? { id: updates.clientCompanyId } : null;

        await apiClient.put(`/application/api/Deal/${id}`, payload);
    },

    async getOrgUsers(orgCode: string): Promise<{ username: string; id: string; email?: string }[]> {
        interface AppUser { id: string; username: string; orgCode?: string; email?: string; }
        const response = await apiClient.get<AppUser[] | { data: AppUser[] }>('/application/api/Users', {
            params: {
                filter: `orgCode=="${orgCode}"`
            }
        });
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        return data.map(u => ({ username: u.username, id: u.id, email: u.email }));
    }
};
