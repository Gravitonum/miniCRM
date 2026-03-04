import apiClient from './client';

export interface Deal {
    id: string;
    name: string;
    amount: number;
    stage: string;
    responsible: string;
    deadline?: string;
}

interface DealBackendModel {
    id: string;
    name: string;
    amountValue: number;
    stage: string;
    responsible: string;
    deadlineDate?: string | null;
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
            deadline: d.deadlineDate ? String(d.deadlineDate).split('T')[0] : undefined
        }));
    },

    async createDeal(deal: Omit<Deal, 'id'>): Promise<Deal> {
        const payload = {
            name: deal.name,
            amountValue: deal.amount,
            stage: deal.stage,
            responsible: deal.responsible,
            deadlineDate: deal.deadline ? new Date(deal.deadline).toISOString() : null,
        };
        const response = await apiClient.post<DealBackendModel>('/application/api/Deal', payload);
        const d = response.data;
        return {
            id: d.id,
            name: d.name || 'Без названия',
            amount: d.amountValue || 0,
            stage: d.stage || 'prospecting',
            responsible: d.responsible || 'Не назначен',
            deadline: d.deadlineDate ? String(d.deadlineDate).split('T')[0] : undefined
        };
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
