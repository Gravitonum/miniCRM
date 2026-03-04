import apiClient from './client';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface Directory {
    id: string;
    type: string;
    value: string;
    isActive?: boolean;
}

export interface ClientCompany {
    id: string;
    name: string;
    inn?: string;
    legalFormId?: string;
    legalForm?: string;
    relationTypeId?: string;
    relationType?: string;
    sourceId?: string;
    source?: string;
    address?: string;
    website?: string;
}

export interface ContactPerson {
    id: string;
    firstName?: string;
    lastName?: string;
    position?: string;
    phoneWork?: string;
    phoneMobile?: string;
    phonePersonal?: string;
    email?: string;
    comment?: string;
    clientCompanyId?: string;
    companies?: { id: string; name: string }[];
}

export interface ContactCompanyLink {
    id: string;
    contactId: string;
    clientCompanyId: string;
    isPrimary: boolean;
}

export interface Interaction {
    id: string;
    type: 'call' | 'meeting' | 'email' | 'note';
    clientCompanyId?: string;
    dealId?: string;
    contactId?: string;
    contactPersonId?: string;
    interactionDate: string;
    description: string;
    authorUserId?: string;
}

// Raw backend shapes
interface RawDirectory { id: string; type: string; value: string; isActiveFlag?: boolean; }
interface RawClient {
    id: string; name: string; inn?: string;
    legalFormId?: string; relationTypeId?: string; sourceId?: string;
    address?: string; website?: string;
}
interface RawContact {
    id: string; firstName?: string; lastName?: string; position?: string;
    phoneWork?: string; phoneMobile?: string; phonePersonal?: string;
    email?: string; comment?: string; clientCompanyId?: string;
}
interface RawInteraction {
    id: string; type: string;
    clientCompanyId?: string; dealId?: string; contactId?: string; contactPersonId?: string;
    interactionDate?: string; description?: string; authorUserId?: string;
}

// ─────────────────────────────────────────
// Helper
// ─────────────────────────────────────────

/**
 * Нормализует ответ GraviBase: массив или { data: [...] }
 * @param raw - сырой ответ от axios
 */
function unwrap<T>(raw: T[] | { data: T[] } | T): T[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object' && 'data' in raw) {
        const d = (raw as { data: T[] }).data;
        return Array.isArray(d) ? d : [];
    }
    return [];
}

// ─────────────────────────────────────────
// Directories API
// ─────────────────────────────────────────

export const directoriesApi = {
    /**
     * Получить элементы справочника по типу
     * @param type - тип: 'lead_source' | 'legal_form' | 'client_relation' | 'product_category'
     * @example directoriesApi.getByType('legal_form')
     */
    async getByType(type: string): Promise<Directory[]> {
        const resp = await apiClient.get<RawDirectory[] | { data: RawDirectory[] }>('/application/api/Directory', {
            params: { filter: `type=="${type}"` }
        });
        return unwrap(resp.data).map(d => ({
            id: d.id,
            type: d.type,
            value: d.value,
            isActive: d.isActiveFlag !== false,
        }));
    },

    /**
     * Получить все справочники сразу (group by type)
     */
    async getAll(): Promise<Directory[]> {
        const resp = await apiClient.get<RawDirectory[] | { data: RawDirectory[] }>('/application/api/Directory');
        return unwrap(resp.data).map(d => ({
            id: d.id,
            type: d.type,
            value: d.value,
            isActive: d.isActiveFlag !== false,
        }));
    },

    /**
     * Создать элемент справочника
     */
    async create(type: string, value: string): Promise<Directory> {
        const resp = await apiClient.post<RawDirectory>('/application/api/Directory', { type, value, isActiveFlag: true });
        const d = resp.data;
        return { id: d.id, type: d.type, value: d.value, isActive: true };
    },

    /**
     * Удалить элемент справочника
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/application/api/Directory/${id}`);
    },
};

// ─────────────────────────────────────────
// Client Companies API
// ─────────────────────────────────────────

export const clientsApi = {
    /**
     * Получить список компаний-клиентов
     * @example clientsApi.getAll()
     */
    async getAll(): Promise<ClientCompany[]> {
        const resp = await apiClient.get<RawClient[] | { data: RawClient[] }>('/application/api/ClientCompany');
        return unwrap(resp.data).map(c => ({
            id: c.id,
            name: c.name || '—',
            inn: c.inn,
            legalFormId: c.legalFormId,
            relationTypeId: c.relationTypeId,
            sourceId: c.sourceId,
            address: c.address,
            website: c.website,
        }));
    },

    /**
     * Получить одного клиента по ID
     * @param id - UUID клиента
     */
    async getById(id: string): Promise<ClientCompany> {
        const resp = await apiClient.get<RawClient>(`/application/api/ClientCompany/${id}`);
        const c = resp.data;
        return {
            id: c.id,
            name: c.name || '—',
            inn: c.inn,
            legalFormId: c.legalFormId,
            relationTypeId: c.relationTypeId,
            sourceId: c.sourceId,
            address: c.address,
            website: c.website,
        };
    },

    /**
     * Создать компанию-клиента
     * @param data - поля клиента (без id)
     */
    async create(data: Omit<ClientCompany, 'id'>): Promise<ClientCompany> {
        const resp = await apiClient.post<RawClient>('/application/api/ClientCompany', {
            name: data.name,
            inn: data.inn || null,
            legalFormId: data.legalFormId || null,
            relationTypeId: data.relationTypeId || null,
            sourceId: data.sourceId || null,
            address: data.address || null,
            website: data.website || null,
        });
        const c = resp.data;
        return {
            id: c.id, name: c.name || '—', inn: c.inn, legalFormId: c.legalFormId,
            relationTypeId: c.relationTypeId, sourceId: c.sourceId, address: c.address, website: c.website
        };
    },

    /**
     * Обновить данные клиента
     * @param id - UUID клиента
     * @param data - изменяемые поля
     */
    async update(id: string, data: Partial<Omit<ClientCompany, 'id'>>): Promise<void> {
        await apiClient.put(`/application/api/ClientCompany/${id}`, data);
    },

    /**
     * Удалить клиента
     * @param id - UUID клиента
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/application/api/ClientCompany/${id}`);
    },

    /**
     * Получить сделки клиента (через фильтр по client_company_id)
     * @param clientCompanyId - UUID клиента
     */
    async getDeals(clientCompanyId: string): Promise<{ id: string; name: string; amount: number; stage: string }[]> {
        const resp = await apiClient.get('/application/api/Deal', {
            params: { filter: `clientCompanyId=="${clientCompanyId}"` }
        });
        const data = unwrap(resp.data as unknown[]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((d: any) => ({
            id: d.id,
            name: d.name || '—',
            amount: d.amountValue || 0,
            stage: d.stage || '',
        }));
    },
};

// ─────────────────────────────────────────
// Contacts API
// ─────────────────────────────────────────

export const contactsApi = {
    /**
     * Получить все контактные лица
     */
    async getAll(): Promise<ContactPerson[]> {
        const resp = await apiClient.get<RawContact[] | { data: RawContact[] }>('/application/api/ContactPerson');
        return unwrap(resp.data).map(c => ({
            id: c.id,
            firstName: c.firstName,
            lastName: c.lastName,
            position: c.position,
            phoneWork: c.phoneWork,
            phoneMobile: c.phoneMobile,
            phonePersonal: c.phonePersonal,
            email: c.email,
            comment: c.comment,
            clientCompanyId: c.clientCompanyId,
        }));
    },

    /**
     * Получить контакт по ID
     */
    async getById(id: string): Promise<ContactPerson> {
        const resp = await apiClient.get<RawContact>(`/application/api/ContactPerson/${id}`);
        const c = resp.data;
        return {
            id: c.id, firstName: c.firstName, lastName: c.lastName,
            position: c.position, phoneWork: c.phoneWork, phoneMobile: c.phoneMobile,
            phonePersonal: c.phonePersonal, email: c.email, comment: c.comment,
            clientCompanyId: c.clientCompanyId,
        };
    },

    /**
     * Получить контакты, привязанные к компании клиента
     */
    async getByClientCompany(clientCompanyId: string): Promise<ContactPerson[]> {
        // Gets links, then fetches each contact
        const linksResp = await apiClient.get('/application/api/ContactCompanyLink', {
            params: { filter: `clientCompanyId=="${clientCompanyId}"` }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const links = unwrap(linksResp.data as any[]) as Array<{ contactId: string }>;
        if (!links.length) return [];

        const contacts = await Promise.all(
            links.map(l => this.getById(l.contactId).catch(() => null))
        );
        return contacts.filter(Boolean) as ContactPerson[];
    },

    /**
     * Создать контактное лицо
     */
    async create(data: Omit<ContactPerson, 'id'>): Promise<ContactPerson> {
        const resp = await apiClient.post<RawContact>('/application/api/ContactPerson', {
            firstName: data.firstName,
            lastName: data.lastName,
            position: data.position || null,
            phoneWork: data.phoneWork || null,
            phoneMobile: data.phoneMobile || null,
            phonePersonal: data.phonePersonal || null,
            email: data.email || null,
            comment: data.comment || null,
        });
        const c = resp.data;
        return {
            id: c.id, firstName: c.firstName, lastName: c.lastName,
            position: c.position, phoneWork: c.phoneWork, phoneMobile: c.phoneMobile,
            phonePersonal: c.phonePersonal, email: c.email, comment: c.comment
        };
    },

    /**
     * Обновить контакт
     */
    async update(id: string, data: Partial<Omit<ContactPerson, 'id'>>): Promise<void> {
        await apiClient.put(`/application/api/ContactPerson/${id}`, data);
    },

    /**
     * Привязать контакт к компании
     */
    async linkToCompany(contactId: string, clientCompanyId: string, isPrimary = false): Promise<void> {
        await apiClient.post('/application/api/ContactCompanyLink', { contactId, clientCompanyId, isPrimary });
    },

    /**
     * Удалить контакт
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/application/api/ContactPerson/${id}`);
    },
};

// ─────────────────────────────────────────
// Interactions API
// ─────────────────────────────────────────

export const interactionsApi = {
    /**
     * Получить историю взаимодействий для клиента или сделки
     * @param params - объект с clientCompanyId или dealId
     */
    async get(params: { clientCompanyId?: string; dealId?: string; contactId?: string }): Promise<Interaction[]> {
        const filters: string[] = [];
        if (params.clientCompanyId) filters.push(`clientCompanyId=="${params.clientCompanyId}"`);
        if (params.dealId) filters.push(`dealId=="${params.dealId}"`);
        if (params.contactId) filters.push(`contactId=="${params.contactId}"`);

        const resp = await apiClient.get<RawInteraction[] | { data: RawInteraction[] }>('/application/api/Interaction', {
            params: filters.length ? { filter: filters.join(' and ') } : {}
        });

        return unwrap(resp.data).map(i => ({
            id: i.id,
            type: (i.type as Interaction['type']) || 'note',
            clientCompanyId: i.clientCompanyId,
            dealId: i.dealId,
            contactId: i.contactId,
            contactPersonId: i.contactPersonId,
            interactionDate: i.interactionDate || new Date().toISOString(),
            description: i.description || '',
            authorUserId: i.authorUserId,
        }));
    },

    /**
     * Создать запись взаимодействия
     */
    async create(data: Omit<Interaction, 'id'>): Promise<Interaction> {
        const resp = await apiClient.post<RawInteraction>('/application/api/Interaction', {
            type: data.type,
            clientCompanyId: data.clientCompanyId || null,
            dealId: data.dealId || null,
            contactId: data.contactId || null,
            contactPersonId: data.contactPersonId || null,
            interactionDate: data.interactionDate,
            description: data.description,
        });
        const i = resp.data;
        return {
            id: i.id,
            type: (i.type as Interaction['type']) || 'note',
            clientCompanyId: i.clientCompanyId,
            dealId: i.dealId,
            contactId: i.contactId,
            interactionDate: i.interactionDate || data.interactionDate,
            description: i.description || '',
        };
    },
};
