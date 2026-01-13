shared/services/ ve config/ klasörlerini oluştur:

API SERVICE (shared/services/api.js):
- Axios instance oluştur
- Base URL: process.env.REACT_APP_API_URL
- Timeout: 30000ms
- Request Interceptor:
  - JWT token ekle (Authorization header)
  - Accept-Language header (TR/EN)
- Response Interceptor:
  - 401 durumunda logout
  - Hata mesajlarını standart formata çevir

CONFIG (config/api.config.js):
API_CONFIG = {
  BASE_URL: env bazlı,
  ENDPOINTS: {
    AUTH: '/auth',
    CUSTOMERS: '/customers',
    APPOINTMENTS: '/appointments',
    // ...
  }
}

I18N CONFIG (config/i18n.config.js):
- i18next setup
- Diller: TR, EN
- Namespace'ler: common, customers, appointments, etc.
- Language detector (localStorage)
- Fallback: TR

UTILS (shared/utils/):
1. dateUtil.js: formatDate, parseDate, addDays
2. currencyUtil.js: formatCurrency, convertCurrency
3. validators.js: validateEmail, validatePhone
4. formatters.js: formatPhoneNumber, truncateText

ERROR HANDLING:
ApiResponse format:
{
  success: boolean,
  data: any,
  error: { message, code }
}

Hata mesajlarını toast ile göster (react-hot-toast)

Önce api.js ve api.config.js oluştur.