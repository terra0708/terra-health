features/auth/ modülünü oluştur:

PAGES:
1. LoginPage: Email/şifre ile giriş formu
2. ForgotPasswordPage: Şifre sıfırlama

COMPONENTS:
1. LoginForm: react-hook-form ile validation
2. ProtectedRoute: JWT kontrolü, yoksa login'e yönlendir
3. PermissionGate: Role-based component gösterme

HOOKS:
1. useAuth: Login, logout, token refresh işlemleri
2. usePermissions: Kullanıcı yetkilerini kontrol et

SERVICES (auth/services/authService.js):
- login(email, password)
- logout()
- refreshToken()
- getCurrentUser()

REDUX STORE (auth/store/authSlice.js):
State: { user, token, isAuthenticated, loading, error }
Actions: login, logout, setUser, clearError

API ENDPOINTS:
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
GET  /api/v1/auth/me

JWT token'ı localStorage'da sakla.
Token'ı her API isteğinde header'a ekle (axios interceptor).

Önce authService.js'yi oluştur.