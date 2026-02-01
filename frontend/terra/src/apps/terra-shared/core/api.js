import axios from 'axios';
import { getToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Single refresh in flight; failed requests wait in queue and retry after refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

const normalizeError = (error) => {
    if (error.response?.data) {
        const apiResponse = error.response.data;
        if (apiResponse.error && typeof apiResponse.error === 'object') {
            const normalizedError = new Error(apiResponse.error.message || apiResponse.message || 'An error occurred');
            normalizedError.code = apiResponse.error.code;
            normalizedError.message = apiResponse.error.message || apiResponse.message || 'An error occurred';
            normalizedError.status = error.response.status;
            normalizedError.statusText = error.response.statusText;
            normalizedError.original = error;
            normalizedError.response = error.response;
            return normalizedError;
        }
    }
    const normalizedError = new Error(error.message || 'An error occurred');
    normalizedError.status = error.response?.status;
    normalizedError.statusText = error.response?.statusText;
    normalizedError.original = error;
    normalizedError.response = error.response;
    return normalizedError;
};

/**
 * Try refresh and retry the request. Used for both 401 and 403 when we have refreshToken.
 * Backend returns 403 (not 401) when token is missing/invalid.
 */
const tryRefreshAndRetry = async (originalRequest) => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearTokens();
        localStorage.removeItem('tenantId');
        window.location.href = '/login';
        return Promise.reject(new Error('No refresh token'));
    }

    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest)).catch((err) => Promise.reject(err));
    }

    isRefreshing = true;
    originalRequest._retry = true;

    try {
        const baseURL = import.meta.env.VITE_API_URL || '/api';
        const res = await axios.post(
            `${baseURL}/v1/auth/refresh`,
            { refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const payload = res.data?.data;
        if (payload?.accessToken) {
            setTokens(payload.accessToken, payload.refreshToken ?? refreshToken);
        }
        processQueue(null, payload?.accessToken);

        import('../store/authStore').then((module) => {
            const useAuthStore = module.default || module.useAuthStore;
            if (!useAuthStore) return;
            const store = useAuthStore.getState();
            store.fetchGranularPermissions?.().then((granularPermissions) => {
                const currentPermissions = store.user?.permissions || [];
                const modulePermissions = currentPermissions.filter((p) => p && p.startsWith('MODULE_'));
                useAuthStore.setState({
                    user: { ...store.user, permissions: [...modulePermissions, ...granularPermissions] },
                });
            }).catch(() => {});
        }).catch(() => {});

        return apiClient(originalRequest);
    } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        localStorage.removeItem('tenantId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
    } finally {
        isRefreshing = false;
    }
};

// Request Interceptor: Authorization Bearer + X-Tenant-ID
apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        let tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            const authData = localStorage.getItem('terra-auth-storage') || localStorage.getItem('auth-storage');
            if (authData) {
                try {
                    const parsed = JSON.parse(authData);
                    tenantId = parsed?.state?.user?.tenantId || parsed?.user?.tenantId;
                } catch (e) {
                    // ignore
                }
            }
        }

        const tenantIndependentPaths = ['/auth/', '/discovery/', '/v1/auth/', '/v1/discovery/'];
        const isTenantIndependent = tenantIndependentPaths.some((path) => config.url?.includes(path));

        if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
            config.headers['X-Tenant-ID'] = tenantId;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: unwrap ApiResponse + 401/403 refresh + retry
apiClient.interceptors.response.use(
    (response) => {
        if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
            if (response.data.success === true) {
                return response.data.data;
            }
            return response.data;
        }
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        // 401 Unauthorized: try refresh and retry (or redirect to login)
        if (status === 401) {
            if (originalRequest.url?.includes('/v1/auth/refresh') || originalRequest._retry) {
                isRefreshing = false;
                failedQueue = [];
                clearTokens();
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            return tryRefreshAndRetry(originalRequest);
        }

        // 403 Forbidden: backend returns 403 when token is missing/invalid; try refresh once then retry
        if (status === 403) {
            const hasRefreshToken = !!getRefreshToken();
            const notYetRetried = !originalRequest._retry;

            if (hasRefreshToken && notYetRetried) {
                return tryRefreshAndRetry(originalRequest);
            }

            // No refresh token or already retried: unauthenticated -> login; real permission denied -> forbidden
            if (!hasRefreshToken) {
                clearTokens();
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            const currentPath = window.location.pathname;
            const userActionEndpoints = ['/bundles', '/users/'];
            const isUserAction = userActionEndpoints.some((endpoint) => originalRequest?.url?.includes(endpoint));
            const isModifyingRequest = originalRequest?.method &&
                ['POST', 'PUT', 'PATCH', 'DELETE'].includes(originalRequest.method?.toUpperCase());

            if (currentPath !== '/forbidden' && currentPath !== '/403' && !isUserAction && !isModifyingRequest) {
                window.location.href = '/forbidden';
                return Promise.reject(error);
            }
        }

        return Promise.reject(normalizeError(error));
    }
);

export default apiClient;
