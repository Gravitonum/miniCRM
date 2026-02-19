/**
 * GraviBase API client for authentication and data operations.
 * Handles login, registration, and company lookup by org code.
 *
 * @example
 * // Login
 * const token = await api.login('admin', '12345678');
 *
 * // Lookup company by org code
 * const company = await api.lookupCompanyByOrgCode('TEST-01');
 *
 * // Register new user
 * const result = await api.register('john', 'john@example.com', 'Password123!', 'TEST-01');
 */

const PROJECT_CODE = 'minicrm';
const BASE_URL = '';

/** Token response from GraviBase auth API */
interface TokenResponse {
    access_token: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    refresh_expires_in?: number;
    id_token?: string;
    scope?: string;
}

/** Error response from GraviBase */
interface ApiError {
    error: string;
    details?: string;
}

/** Company entity from GraviBase data API */
interface CompanyData {
    id: string;
    name: string;
    orgCode: string;
    defaultLanguage?: string;
    isBlocked?: boolean;
}

/** Result of company lookup by org code */
export interface CompanyLookupResult {
    found: boolean;
    company?: {
        id: string;
        name: string;
        orgCode: string;
    };
    error?: string;
}

/** Result of login operation */
export interface LoginResult {
    success: boolean;
    token?: TokenResponse;
    error?: string;
}

/** Result of registration operation */
export interface RegisterResult {
    success: boolean;
    token?: TokenResponse;
    error?: string;
    errorCode?: string;
}

/**
 * Authenticates a user with GraviBase auth API.
 *
 * @param username - User's login name
 * @param password - User's password
 * @returns Login result with token or error
 *
 * @example
 * const result = await login('admin', '12345678');
 * if (result.success) {
 *   localStorage.setItem('token', result.token.access_token);
 * }
 */
export async function login(username: string, password: string): Promise<LoginResult> {
    try {
        const response = await fetch(`${BASE_URL}/auth/projects/${PROJECT_CODE}/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                login: username,
                password: password,
            }),
        });

        if (response.ok) {
            const token: TokenResponse = await response.json();
            return { success: true, token };
        }

        // Handle specific error codes
        if (response.status === 401) {
            return { success: false, error: 'invalidCredentials' };
        }

        const errorData: ApiError = await response.json().catch(() => ({ error: 'server_error' }));
        return { success: false, error: errorData.error || 'serverError' };
    } catch {
        return { success: false, error: 'networkError' };
    }
}

/**
 * Looks up a company by its organization code.
 * Uses the GraviBase data API to search for companies.
 *
 * @param orgCode - The organization code (e.g., 'TEST-01')
 * @returns Lookup result with company info or error
 *
 * @example
 * const result = await lookupCompanyByOrgCode('TEST-01');
 * if (result.found) {
 *   console.log(result.company.name); // "Test Company"
 * }
 */
export async function lookupCompanyByOrgCode(orgCode: string): Promise<CompanyLookupResult> {
    try {
        // First we need to authenticate as a system user to query company data
        // For public company lookup, we use a search endpoint
        // GraviBase data API: GET /api/projects/{project}/entities/{entity}/data?filter=...
        const response = await fetch(
            `${BASE_URL}/api/projects/${PROJECT_CODE}/entities/Company/data?filter=${encodeURIComponent(`orgCode=="${orgCode}"`)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            // If 401, the endpoint requires auth — try without auth header for now
            // This may need a public lookup endpoint or special config
            return { found: false, error: 'lookupFailed' };
        }

        const data = await response.json();
        const companies: CompanyData[] = data.data || [];

        if (companies.length === 0) {
            return { found: false };
        }

        const company = companies[0];
        if (company.isBlocked) {
            return { found: false, error: 'orgBlocked' };
        }

        return {
            found: true,
            company: {
                id: company.id,
                name: company.name,
                orgCode: company.orgCode,
            },
        };
    } catch {
        return { found: false, error: 'networkError' };
    }
}

/**
 * Registers a new user in GraviBase.
 * Stores the organization code as a profile attribute.
 *
 * @param username - Desired username (letters, numbers, hyphens)
 * @param email - User's email address
 * @param password - Password (min 8 characters)
 * @param orgCode - Organization code the user is joining
 * @returns Registration result with token or error
 *
 * @example
 * const result = await register('john-doe', 'john@acme.com', 'SecureP@ss1', 'ACME-01');
 * if (result.success) {
 *   // User is registered and authenticated
 * }
 */
export async function register(
    username: string,
    email: string,
    password: string,
    orgCode: string
): Promise<RegisterResult> {
    try {
        const response = await fetch(`${BASE_URL}/auth/projects/${PROJECT_CODE}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                flow: 'password',
                value: password,
                profile: [
                    { attribute: 'email', value: email },
                    { attribute: 'orgCode', value: orgCode },
                ],
            }),
        });

        if (response.ok) {
            const token: TokenResponse = await response.json();
            return { success: true, token };
        }

        // Handle specific error scenarios
        if (response.status === 406) {
            // Password policy violation
            return { success: false, error: 'passwordTooShort', errorCode: 'password_policy' };
        }

        if (response.status === 409) {
            return { success: false, error: 'usernameExists', errorCode: 'conflict' };
        }

        const errorData = await response.json().catch(() => ({ error: 'server_error' }));

        if (errorData.error === 'conflict') {
            return { success: false, error: 'usernameExists', errorCode: 'conflict' };
        }

        return { success: false, error: 'registrationFailed', errorCode: errorData.error };
    } catch {
        return { success: false, error: 'networkError' };
    }
}
