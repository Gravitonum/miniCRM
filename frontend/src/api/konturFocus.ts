import axios from 'axios';

const API_KEY = import.meta.env.VITE_KONTUR_FOCUS_API_KEY;
const API_URL = `${import.meta.env.VITE_KONTUR_FOCUS_API_URL || '/api3/'}req`;

export interface KonturCompany {
    inn: string;
    kpp?: string;
    ogrn?: string;
    name: string;
    address?: string;
    status?: string;
    headName?: string;
    headPosition?: string;
}

export const konturFocusApi = {
    /**
     * Получить данные компании по ИНН из сервиса Контур.Фокус
     */
    async fetchCompanyByInn(inn: string): Promise<KonturCompany | null> {
        if (!API_KEY) {
            console.warn('VITE_KONTUR_FOCUS_API_KEY is not set');
            return null;
        }

        try {
            console.log('Fetching from Kontur.Focus:', API_URL, { inn });
            const response = await axios.get(API_URL, {
                params: {
                    key: API_KEY,
                    inn: inn,
                    annotate: true,
                },
            });

            console.log('Kontur.Focus response data:', response.data);
            const data = response.data;
            if (!data || !Array.isArray(data) || data.length === 0) {
                console.warn('No data returned from Kontur.Focus for INN:', inn);
                return null;
            }

            // Фокус возвращает массив результатов, берем первый
            const companyData = data[0];
            
            // Если это ЮЛ
            if (companyData.UL) {
                const ul = companyData.UL;
                const head = ul.heads?.[0];
                const addr = ul.legalAddress?.parsedAddressRF;

                return {
                    inn: companyData.inn,
                    kpp: companyData.kpp || ul.kpp,
                    ogrn: companyData.ogrn,
                    name: ul.legalName?.short || ul.legalName?.full || '',
                    address: addr?.oneLineFormatOfAddress 
                        || (addr ? formatAddress(addr) : (ul.legalAddress?.manual?.topoValue || '')),
                    status: typeof ul.status?.statusString === 'string' 
                        ? ul.status.statusString 
                        : (ul.status?.statusString?.topName || ''),
                    headName: head?.fio || '',
                    headPosition: head?.position || '',
                };
            }
            
            // Если это ИП
            if (companyData.IP) {
                const ip = companyData.IP;
                return {
                    inn: companyData.inn,
                    ogrn: companyData.ogrn,
                    name: ip.fio ? `ИП ${ip.fio}` : '',
                    address: '', 
                    status: typeof ip.status?.statusString === 'string'
                        ? ip.status.statusString
                        : (ip.status?.statusString?.topName || ''),
                };
            }
            
            console.warn('Neither UL nor IP found in company data:', companyData);
            return null;
        } catch (error) {
            console.error('Error fetching data from Kontur.Focus:', error);
            throw error;
        }
    }
};

/**
 * Хелпер для форматирования адреса из parsedAddressRF
 */
function formatAddress(parsed: any): string {
    const parts = [];
    if (parsed.zipCode) parts.push(parsed.zipCode);
    if (parsed.regionName?.topoValue) parts.push(`${parsed.regionName.topoValue} ${parsed.regionName.topoShortName || ''}`.trim());
    if (parsed.city?.topoValue) parts.push(`${parsed.city.topoShortName || ''} ${parsed.city.topoValue}`.trim());
    if (parsed.street?.topoValue) parts.push(`${parsed.street.topoShortName || ''} ${parsed.street.topoValue}`.trim());
    if (parsed.house?.topoValue) parts.push(`${parsed.house.topoShortName || ''} ${parsed.house.topoValue}`.trim());
    if (parsed.bulk?.topoValue) parts.push(`${parsed.bulk.topoShortName || ''} ${parsed.bulk.topoValue}`.trim());
    if (parsed.flat?.topoValue) parts.push(`${parsed.flat.topoShortName || ''} ${parsed.flat.topoValue}`.trim());
    
    return parts.join(', ');
}
