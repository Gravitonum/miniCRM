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

        return { success: true, token: response.data };
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
 * Updates the user's profile attributes.
 * Uses /security/projects/{project}/users/{username}/profile endpoint.
 */
export async function updateUserProfile(username: string, attributes: { attribute: string, value: string }[]): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(
            `/security/projects/${PROJECT_CODE}/users/${username}/profile`,
            attributes
        );
        return { success: true };
    } catch (error) {
        if (error instanceof AxiosError) {
            const errorData = error.response?.data as ApiError;
            console.error('Profile update failed:', errorData);
            return { success: false, error: errorData?.error || 'updateFailed' };
        }
        return { success: false, error: 'networkError' };
    }
}

/**
 * Gets the user's profile attributes.
 * Uses /security/projects/{project}/users/{username}/profile endpoint.
 */
export async function getUserProfile(username: string): Promise<{ [key: string]: string } | null> {
    try {
        const response = await apiClient.get<any>(
            `/security/projects/${PROJECT_CODE}/users/${username}/profile`
        );

        const profile: { [key: string]: string } = {};

        // The structure depends on whether it returns { data: [] } or just []
        const attributes = Array.isArray(response.data) ? response.data : response.data.data;

        if (Array.isArray(attributes)) {
            attributes.forEach((attr: any) => {
                profile[attr.attribute] = attr.value;
            });
        }
        return profile;
    } catch (error) {
        console.error('Failed to get profile:', error);
        return null;
    }
}
