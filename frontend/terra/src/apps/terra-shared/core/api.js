import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Cookie'ler için gerekli
    xsrfCookieName: 'XSRF-TOKEN',  // Axios otomatik cookie'den okuyacak
    xsrfHeaderName: 'X-XSRF-TOKEN', // Axios otomatik header'a ekleyecek
});

// State Management (Queuing)
let isRefreshing = false; // Refresh işleminin devam edip etmediğini takip eder
let failedQueue = []; // 401 hatası alan isteklerin bekletildiği kuyruk

// processQueue helper fonksiyonu
const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = []; // KRİTİK: Kuyruğu temizle (mutlaka yapılmalı)
};

// Hata objesini düzleştiren helper fonksiyon
const normalizeError = (error) => {
    // Backend'den gelen ApiResponse yapısı: { success: false, error: { code, message } }
    if (error.response?.data) {
        const apiResponse = error.response.data;
        
        // ApiResponse formatında mı kontrol et
        if (apiResponse.error && typeof apiResponse.error === 'object') {
            // Düzleştirilmiş hata objesi oluştur
            const normalizedError = new Error(apiResponse.error.message || apiResponse.message || 'An error occurred');
            normalizedError.code = apiResponse.error.code;
            normalizedError.message = apiResponse.error.message || apiResponse.message || 'An error occurred';
            normalizedError.status = error.response.status;
            normalizedError.statusText = error.response.statusText;
            // Orijinal error objesini de koru (debug için)
            normalizedError.original = error;
            normalizedError.response = error.response;
            return normalizedError;
        }
    }
    
    // ApiResponse formatında değilse, standart Axios hatasını düzleştir
    const normalizedError = new Error(error.message || 'An error occurred');
    normalizedError.status = error.response?.status;
    normalizedError.statusText = error.response?.statusText;
    normalizedError.original = error;
    normalizedError.response = error.response;
    return normalizedError;
};

// Request Interceptor: Add Tenant ID (Authorization header kaldırıldı - cookie'den otomatik gönderiliyor)
apiClient.interceptors.request.use(
    (config) => {
        // Authorization header ekleme mantığı tamamen kaldırıldı
        // Token artık HttpOnly cookie'de ve otomatik gönderiliyor
        
        // Tenant ID'yi al (önce localStorage, sonra auth store)
        let tenantId = localStorage.getItem('tenantId');
        if (!tenantId) {
            // Auth store'dan user objesini al (useAuthStore kullanılamaz, direkt localStorage'dan parse et)
            // Zustand persist key'i kontrol et (varsayılan key veya özel key)
            const authData = localStorage.getItem('terra-auth-storage') || 
                           localStorage.getItem('auth-storage');
            if (authData) {
                try {
                    const parsed = JSON.parse(authData);
                    tenantId = parsed?.state?.user?.tenantId || parsed?.user?.tenantId;
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
        
        // KRİTİK: X-Tenant-ID header'ı sadece truthy değer varsa ekle
        // Login/discovery endpoint'leri tenant-bağımsızdır, tenantId olmaması normaldir
        // null, undefined, empty string kontrolü yap
        
        // Tenant-bağımsız endpoint'ler (login, discovery, auth endpoints)
        const tenantIndependentPaths = ['/auth/', '/discovery/', '/v1/auth/', '/v1/discovery/'];
        const isTenantIndependent = tenantIndependentPaths.some(path => config.url?.includes(path));
        
        if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
            config.headers['X-Tenant-ID'] = tenantId;
            // Debug log (production'da kaldırılabilir)
            if (import.meta.env.DEV) {
                console.debug('✅ X-Tenant-ID header added:', tenantId);
            }
        } else if (!isTenantIndependent) {
            // Sadece tenant-bağımlı endpoint'ler için uyarı ver
            // Login/discovery endpoint'leri için uyarı verme (normal durum)
            if (import.meta.env.DEV) {
                console.warn('⚠️ X-Tenant-ID header NOT added. tenantId:', tenantId, 'URL:', config.url);
            }
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors globally and token refresh
apiClient.interceptors.response.use(
    (response) => {
        // Response data sadeleştirme
        // Backend ApiResponse<T> yapısı: { success, data, message, error }
        if (response.data && typeof response.data === 'object') {
            // ApiResponse yapısı varsa kontrol et
            if ('data' in response.data && 'success' in response.data) {
                // Başarılı durumda direkt içteki data'yı döndür (frontend kodunu sadeleştirir)
                if (response.data.success === true) {
                    return response.data.data; // Direkt data'yı döndür
                }
                // Başarısız durum (200 OK ama success: false - nadir durum)
                // ApiResponse yapısını koru
                return response.data;
            }
            return response.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // 401 Hata Kontrolü
        if (error.response?.status === 401) {
            // KRİTİK: Refresh isteğinin kendisi hata verdi mi?
            if (originalRequest.url === '/v1/auth/refresh' || originalRequest._retry) {
                // Sonsuz döngüyü önle - Logout yap
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('tenantId');
                // Auth store'u da temizle (eğer varsa)
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            // Refresh token kontrolü
            if (isRefreshing) {
                // Başka bir istek zaten refresh atıyor, kuyruğa ekle
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    // Token artık cookie'de, header'a ekleme gerekmez
                    // Cookie otomatik gönderilecek
                    return apiClient(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }
            
            // Refresh token başlat
            isRefreshing = true;
            originalRequest._retry = true; // Bu isteği tekrar refresh etme
            
            try {
                // KRİTİK: Refresh isteğini apiClient (interceptor'lı) yerine direkt axios ile at
                // Böylece interceptor'dan geçmez ve sonsuz döngü oluşmaz
                // baseURL zaten '/api' olduğu için, endpoint path'inde sadece '/v1/auth/refresh' kullan
                const baseURL = import.meta.env.VITE_API_URL || '/api';
                const response = await axios.post(
                    '/v1/auth/refresh',
                    {},
                    {
                        withCredentials: true,
                        baseURL: baseURL,
                        xsrfCookieName: 'XSRF-TOKEN',
                        xsrfHeaderName: 'X-XSRF-TOKEN'
                    }
                );
                
                // Token artık cookie'de, localStorage'a yazma işlemi kaldırıldı
                // Cookie otomatik gönderilecek, header'a ekleme gerekmez
                processQueue(null, null); // Token cookie'de, null geçiyoruz
                
                // CRITICAL: Refresh başarılı olduğunda granüler yetkileri güncelle
                // Auth store'u import et (circular dependency önlemek için lazy import)
                // Sessizce arka planda güncelle (kullanıcı fark etmez)
                import('../store/authStore').then((module) => {
                    const useAuthStore = module.default || module.useAuthStore;
                    if (!useAuthStore) {
                        if (import.meta.env.DEV) {
                            console.debug('authStore not found in module:', module);
                        }
                        return;
                    }
                    
                    const store = useAuthStore.getState();
                    // Sessizce arka planda güncelle (kullanıcı fark etmez)
                    store.fetchGranularPermissions().then(granularPermissions => {
                        // Mevcut MODULE yetkileri ile birleştir
                        const currentPermissions = store.user?.permissions || [];
                        const modulePermissions = currentPermissions.filter(p => p && p.startsWith('MODULE_'));
                        const allPermissions = [...modulePermissions, ...granularPermissions];
                        
                        // Store'u güncelle
                        useAuthStore.setState({ 
                            user: { ...store.user, permissions: allPermissions } 
                        });
                    }).catch(err => {
                        // Sessizce fail et, kullanıcıyı rahatsız etme
                        if (import.meta.env.DEV) {
                            console.debug('Failed to refresh granular permissions:', err);
                        }
                    });
                }).catch(err => {
                    // Import hatası - sessizce ignore et
                    if (import.meta.env.DEV) {
                        console.debug('Failed to import authStore for granular permissions refresh:', err);
                    }
                });
                
                // Orijinal isteği tekrar dene (cookie otomatik gönderilecek)
                return apiClient(originalRequest);
            } catch (refreshError) {
                // Refresh başarısız - Logout
                processQueue(refreshError, null);
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // 403 Forbidden Handling - Access Denied
        // CRITICAL: Redirect to forbidden page when user lacks required permissions
        // BUT: Allow certain endpoints to handle 403 errors themselves (e.g., bundle creation)
        if (error.response?.status === 403) {
            // Check if we're already on forbidden page to avoid redirect loops
            const currentPath = window.location.pathname;
            
            // Endpoints that should handle 403 errors themselves (user actions)
            // These endpoints will show error messages instead of redirecting
            const userActionEndpoints = [
                '/bundles',  // Bundle creation/update/delete
                '/users/',   // User management actions
            ];
            
            const isUserAction = userActionEndpoints.some(endpoint => 
                originalRequest?.url?.includes(endpoint)
            );
            
            // Only redirect if:
            // 1. Not already on forbidden page
            // 2. Not a user action endpoint (let component handle the error)
            // 3. Not a POST/PUT/DELETE request (these are usually user actions)
            const isModifyingRequest = originalRequest?.method && 
                ['POST', 'PUT', 'PATCH', 'DELETE'].includes(originalRequest.method.toUpperCase());
            
            if (currentPath !== '/forbidden' && 
                currentPath !== '/403' && 
                !isUserAction && 
                !isModifyingRequest) {
                // Redirect to forbidden page for GET requests to protected resources
                // Using window.location.href instead of navigate() because interceptor
                // cannot use React hooks (useNavigate)
                window.location.href = '/forbidden';
                return Promise.reject(error);
            }
            // For user actions and modifying requests, let the component handle the error
            // This allows showing proper error messages in Snackbar/Alert components
        }
        
        // Hata durumlarında backend'den gelen ApiResponse yapısını düzleştir
        // Frontend'de error.message ve error.code ile direkt erişim sağla
        const normalizedError = normalizeError(error);
        return Promise.reject(normalizedError);
    }
);

export default apiClient;
