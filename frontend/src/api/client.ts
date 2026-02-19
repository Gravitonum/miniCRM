import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

// Create a custom Axios instance
const apiClient = axios.create({
    baseURL: '', // Usage of relative path relies on Vite proxy
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('gravisales_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

// Response interceptor to handle token refresh on 401 errors
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('gravisales_refresh_token');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                // Call refresh token endpoint
                const response = await axios.put('/auth/token', new URLSearchParams({
                    refresh_token: refreshToken
                }), {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                if (response.status === 200) {
                    const { access_token, refresh_token } = response.data;

                    // Update local storage
                    localStorage.setItem('gravisales_token', access_token);
                    if (refresh_token) {
                        localStorage.setItem('gravisales_refresh_token', refresh_token);
                    }

                    // Update the header for the original request and retry
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    }
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // If refresh fails, clear tokens and redirect to login
                localStorage.removeItem('gravisales_token');
                localStorage.removeItem('gravisales_refresh_token');
                localStorage.removeItem('gravisales_username');

                // Only redirect if not already on login/register pages
                if (!window.location.pathname.startsWith('/login') &&
                    !window.location.pathname.startsWith('/register')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
