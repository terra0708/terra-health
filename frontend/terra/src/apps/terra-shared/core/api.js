import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // HTTP-Only Cookie'ler için
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

// Request Interceptor: Add Auth Token and Tenant ID
apiClient.interceptors.request.use(
    (config) => {
        // Authorization header ekle
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
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
        // Login öncesi isteklerde tenantId olmayabilir, bu normaldir
        // null, undefined, empty string kontrolü yap
        if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
            config.headers['X-Tenant-ID'] = tenantId;
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
                localStorage.removeItem('token');
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
                }).then(token => {
                    // KRİTİK: Header'ı config bazında güncelle (originalRequest üzerinde)
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    // Config'i de güncelle (axios'un internal yapısı için)
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
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
                        baseURL: baseURL
                    }
                );
                
                const newToken = response.data?.data?.accessToken || response.data?.accessToken;
                if (newToken) {
                    localStorage.setItem('token', newToken);
                    processQueue(null, newToken);
                    // KRİTİK: Header'ı config bazında güncelle
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    // Config'i de güncelle (axios'un internal yapısı için)
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    }
                    return apiClient(originalRequest);
                } else {
                    throw new Error('No token in refresh response');
                }
            } catch (refreshError) {
                // Refresh başarısız - Logout
                processQueue(refreshError, null);
                isRefreshing = false;
                failedQueue = [];
                localStorage.removeItem('token');
                localStorage.removeItem('tenantId');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        
        // Hata durumlarında backend'den gelen ApiResponse yapısını düzleştir
        // Frontend'de error.message ve error.code ile direkt erişim sağla
        const normalizedError = normalizeError(error);
        return Promise.reject(normalizedError);
    }
);

export default apiClient;
