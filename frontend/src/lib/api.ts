/**
 * GraviBase API client for authentication and data operations.
 * Handles login, registration, and company lookup by org code.
 */
import apiClient from '../api/client';
import { AxiosError } from 'axios';

const PROJECT_CODE = 'minicrm';

/** Token response from GraviBase auth API */
export interface TokenResponse {
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
    username?: string;
}

/**
 * Authenticates a user with GraviBase auth API.
 * Uses /auth/projects/{project}/token endpoint.
 */
export async function login(username: string, password: string): Promise<LoginResult> {
    try {
        const response = await apiClient.post<TokenResponse>(
            `/auth/projects/${PROJECT_CODE}/token`,
            new URLSearchParams({
                login: username,
                password: password,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return { success: true, token: response.data };
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response?.status === 401) {
                return { success: false, error: 'invalidCredentials' };
            }
            const errorData = error.response?.data as ApiError;
            return { success: false, error: errorData?.error || 'serverError' };
        }
        return { success: false, error: 'networkError' };
    }
}

/**
 * Looks up a company by its organization code.
 * Uses the GraviBase data API.
 */
export async function lookupCompanyByOrgCode(orgCode: string): Promise<CompanyLookupResult> {
    try {
        // GraviBase data API: GET /application/api/Company?filter=...
        const response = await apiClient.get<any>(
            `/application/api/Company`,
            {
                params: {
                    filter: `orgCode=="${orgCode}"`,
                },
            }
        );

        // Handle both { data: [] } and direct [] responses
        const companies = Array.isArray(response.data) ? response.data : (response.data?.data || []);

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
    } catch (error) {
        console.error('Company lookup failed:', error);
        return { found: false, error: 'lookupFailed' };
    }
}

/**
 * Registers a new user in GraviBase.
 * Uses /auth/projects/{project}/users endpoint.
 * Registrations only require username, email, and password. 
 * Organization is joined post-login.
 */
export async function register(
    username: string,
    email: string,
    password: string
): Promise<RegisterResult> {
    try {
        const response = await apiClient.post<TokenResponse>(
            `/auth/projects/${PROJECT_CODE}/users`,
            {
                username,
                flow: 'password',
                value: password,
                profile: [
                    { attribute: 'email', value: email },
                ],
            }
        );

        return { success: true, token: response.data, username };
    } catch (error) {
        if (error instanceof AxiosError) {
            if (error.response?.status === 406) {
                return { success: false, error: 'passwordTooShort', errorCode: 'password_policy' };
            }
            if (error.response?.status === 409) {
                return { success: false, error: 'usernameExists', errorCode: 'conflict' };
            }
            const errorData = error.response?.data as ApiError;
            return { success: false, error: 'registrationFailed', errorCode: errorData?.error };
        }
        return { success: false, error: 'networkError' };
    }
}



/**
 * Assigns a role to a user.
 * Uses PUT /security/projects/{project}/users/{username}/roles/{role}
 */
export async function assignRole(username: string, role: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.put(
            `/security/projects/${PROJECT_CODE}/users/${username}/roles/${role}`
        );
        return { success: true };
    } catch (error) {
        if (error instanceof AxiosError) {
            const errorData = error.response?.data as ApiError;
            console.error('Role assignment failed:', errorData);
            return { success: false, error: errorData?.error || 'roleAssignmentFailed' };
        }
        return { success: false, error: 'networkError' };
    }
}

/** App user record in the custom 'Users' table */
export interface AppUser {
    id: string;
    email?: string;
    username: string;
    orgCode?: string;
    isActive: boolean;
}

/** Result of App user fetch/save */
export interface AppUserResult {
    success: boolean;
    user?: AppUser;
    error?: string;
}

/**
 * Fetches the application-level user record by username.
 */
export async function getAppUser(username: string): Promise<AppUserResult> {
    try {
        const response = await apiClient.get<any>(
            `/application/api/Users`,
            {
                params: {
                    filter: `username=="${username}"`,
                },
            }
        );

        const users = Array.isArray(response.data) ? response.data : (response.data?.data || []);

        if (users.length === 0) {
            return { success: false, error: 'notFound' };
        }

        return { success: true, user: users[0] };
    } catch (error) {
        console.error('Failed to get app user:', error);
        return { success: false, error: 'fetchFailed' };
    }
}

/**
 * Creates a base app user record in the 'Users' table.
 */
export async function createAppUser(username: string, email?: string): Promise<AppUserResult> {
    try {
        const response = await apiClient.post<AppUser>(
            `/application/api/Users`,
            {
                username,
                email: email || null,
                isActive: true, // Default to true as per requirements
                orgCode: null
            }
        );

        return { success: true, user: response.data };
    } catch (error) {
        console.error('Failed to create app user:', error);
        return { success: false, error: 'createFailed' };
    }
}

/**
 * Updates the orgCode for a user in the 'Users' table.
 */
export async function updateAppUserOrg(usernameOrId: string, orgCode: string): Promise<{ success: boolean; error?: string }> {
    try {
        let user: AppUser | undefined;

        // Always get the full user record first to ensure we have all fields for PUT
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(usernameOrId)) {
            const getResult = await getAppUser(usernameOrId);
            if (!getResult.success || !getResult.user) {
                return { success: false, error: 'userNotFound' };
            }
            user = getResult.user;
        } else {
            // If it is an ID, we still need the full object for PUT
            const response = await apiClient.get<AppUser>(`/application/api/Users/${usernameOrId}`);
            user = response.data;
        }

        if (!user) return { success: false, error: 'userNotFound' };

        // Use PUT with the full object as per typical GraviBase requirements for full update
        await apiClient.put(
            `/application/api/Users`,
            {
                ...user,
                orgCode
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Failed to update app user org:', error);
        return { success: false, error: 'updateFailed' };
    }
}
