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
    id: string; firstName?: string; lastName?: string; positionTitle?: string;
    phoneWork?: string; phoneMobile?: string; phonePersonal?: string;
    emailAddr?: string; commentaryText?: string; clientCompany?: { id: string };
}
interface RawInteraction {
    id: string; interactionType: string;
    clientCompany?: { id: string }; deal?: { id: string }; contactPerson?: { id: string };
    interactionDate?: string; descriptionText?: string; authorUserId?: string;
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
            params: { 
                filter: `type=="${type}"`,
                limit: 1000
            }
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
        const resp = await apiClient.get<RawDirectory[] | { data: RawDirectory[] }>('/application/api/Directory', {
            params: { limit: 1000 }
        });
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

    /**
     * Обновить элемент справочника
     */
    async update(id: string, value: string): Promise<void> {
        await apiClient.put('/application/api/Directory', { id, value });
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
        const resp = await apiClient.get<RawClient[] | { data: RawClient[] }>('/application/api/ClientCompany', {
            params: { limit: 1000 }
        });
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
        await apiClient.put('/application/api/ClientCompany', { ...data, id });
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
            params: { 
                filter: `clientCompany.id=="${clientCompanyId}"`,
                limit: 1000
            }
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
        const resp = await apiClient.get<RawContact[] | { data: RawContact[] }>('/application/api/ContactPerson', {
            params: { limit: 1000 }
        });
        return unwrap(resp.data).map(c => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyC = c as any;
            return {
                id: c.id,
                firstName: c.firstName,
                lastName: c.lastName,
                position: c.positionTitle || anyC.position || anyC.position_title,
                phoneWork: c.phoneWork || anyC.phone_work,
                phoneMobile: c.phoneMobile || anyC.phone_mobile,
                phonePersonal: c.phonePersonal || anyC.phone_personal,
                email: c.emailAddr || anyC.email || anyC.email_addr,
                comment: c.commentaryText || anyC.comment || anyC.commentary_text,
                clientCompanyId: c.clientCompany?.id || anyC.clientCompanyId || anyC.client_company_id || (typeof c.clientCompany === 'string' ? c.clientCompany : null),
            };
        });
    },

    /**
     * Получить контакт по ID
     */
    async getById(id: string): Promise<ContactPerson> {
        const resp = await apiClient.get<RawContact>(`/application/api/ContactPerson/${id}`);
        const c = resp.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyC = c as any;
        return {
            id: c.id, firstName: c.firstName, lastName: c.lastName,
            position: c.positionTitle || anyC.position || anyC.position_title, phoneWork: c.phoneWork || anyC.phone_work, phoneMobile: c.phoneMobile || anyC.phone_mobile,
            phonePersonal: c.phonePersonal || anyC.phone_personal, email: c.emailAddr || anyC.email || anyC.email_addr, comment: c.commentaryText || anyC.comment || anyC.commentary_text,
            clientCompanyId: c.clientCompany?.id || anyC.clientCompanyId || anyC.client_company_id || (typeof c.clientCompany === 'string' ? c.clientCompany : null),
        };
    },

    /**
     * Получить контакты, привязанные к компании клиента
     */
    async getByClientCompany(clientCompanyId: string): Promise<ContactPerson[]> {
        // Gets links, then fetches each contact
        const linksResp = await apiClient.get('/application/api/ContactCompanyLink', {
            params: { 
                filter: `clientCompany.id=="${clientCompanyId}"`,
                limit: 1000
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const links = unwrap(linksResp.data as any[]) as Array<{ contactPerson: { id: string } }>;
        if (!links.length) return [];

        const contacts = await Promise.all(
            links.map(l => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyL = l as any;
                const contactId = anyL.contactPerson?.id || anyL.contactPersonId || anyL.contactPerson_id || (typeof anyL.contactPerson === 'string' ? anyL.contactPerson : null) || anyL.contact_person_id;
                if (!contactId) return Promise.resolve(null);
                return this.getById(contactId).catch(() => null);
            })
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
            positionTitle: data.position || null,
            phoneWork: data.phoneWork || null,
            phoneMobile: data.phoneMobile || null,
            phonePersonal: data.phonePersonal || null,
            emailAddr: data.email || null,
            commentaryText: data.comment || null,
            company: data.clientCompanyId ? { id: data.clientCompanyId } : null,
        });
        const c = resp.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyC = c as any;
        return {
            id: c.id, firstName: c.firstName, lastName: c.lastName,
            position: c.positionTitle || anyC.position || anyC.position_title, phoneWork: c.phoneWork || anyC.phone_work, phoneMobile: c.phoneMobile || anyC.phone_mobile,
            phonePersonal: c.phonePersonal || anyC.phone_personal, email: c.emailAddr || anyC.email || anyC.email_addr, comment: c.commentaryText || anyC.comment || anyC.commentary_text
        };
    },

    /**
     * Обновить контакт
     */
    async update(id: string, data: Partial<Omit<ContactPerson, 'id'>>): Promise<void> {
        await apiClient.put('/application/api/ContactPerson', { ...data, id });
    },

    /**
     * Привязать контакт к компании
     */
    async linkToCompany(contactPersonId: string, clientCompanyId: string, isPrimaryJob = false): Promise<void> {
        await apiClient.post('/application/api/ContactCompanyLink', { 
            contactPerson: { id: contactPersonId }, 
            clientCompany: { id: clientCompanyId }, 
            isPrimaryJob 
        });
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
        if (params.clientCompanyId) filters.push(`clientCompany.id=="${params.clientCompanyId}"`);
        if (params.dealId) filters.push(`deal.id=="${params.dealId}"`);
        if (params.contactId) filters.push(`contactPerson.id=="${params.contactId}"`);

        const resp = await apiClient.get<RawInteraction[] | { data: RawInteraction[] }>('/application/api/Interaction', {
            params: { 
                ...(filters.length ? { filter: filters.join(' and ') } : {}),
                limit: 1000
            }
        });

        return unwrap(resp.data).map(i => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const anyI = i as any;
            return {
                id: i.id,
                type: (i.interactionType as Interaction['type']) || anyI.type || anyI.interaction_type || 'note',
                clientCompanyId: i.clientCompany?.id || anyI.clientCompanyId || anyI.clientCompany_id || (typeof i.clientCompany === 'string' ? i.clientCompany : null),
                dealId: i.deal?.id || anyI.dealId || anyI.deal_id || (typeof i.deal === 'string' ? i.deal : null),
                contactId: i.contactPerson?.id || anyI.contactPersonId || anyI.contactPerson_id || (typeof i.contactPerson === 'string' ? i.contactPerson : null),
                interactionDate: i.interactionDate || new Date().toISOString(),
                description: i.descriptionText || anyI.description || anyI.description_text || '',
                authorUserId: i.authorUserId,
            };
        });
    },

    /**
     * Создать запись взаимодействия
     */
    async create(data: Omit<Interaction, 'id'>): Promise<Interaction> {
        const resp = await apiClient.post<RawInteraction>('/application/api/Interaction', {
            interactionType: data.type,
            clientCompany: data.clientCompanyId ? { id: data.clientCompanyId } : null,
            deal: data.dealId ? { id: data.dealId } : null,
            contactPerson: data.contactId ? { id: data.contactId } : null,
            interactionDate: data.interactionDate,
            descriptionText: data.description,
        });
        const i = resp.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyI = i as any;
        return {
            id: i.id,
            type: (i.interactionType as Interaction['type']) || anyI.type || anyI.interaction_type || 'note',
            clientCompanyId: i.clientCompany?.id || anyI.clientCompanyId || anyI.clientCompany_id || (typeof i.clientCompany === 'string' ? i.clientCompany : null),
            dealId: i.deal?.id || anyI.dealId || anyI.deal_id || (typeof i.deal === 'string' ? i.deal : null),
            contactId: i.contactPerson?.id || anyI.contactPersonId || anyI.contactPerson_id || (typeof i.contactPerson === 'string' ? i.contactPerson : null),
            interactionDate: i.interactionDate || data.interactionDate,
            description: i.descriptionText || anyI.description || anyI.description_text || '',
        };
    },
};
